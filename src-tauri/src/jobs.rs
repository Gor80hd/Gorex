use serde_json::{json, Value};
use std::{
    collections::HashMap,
    path::PathBuf,
    process::Stdio,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
};
use tauri::{AppHandle, Emitter, Manager};
use tokio::{io::AsyncReadExt, process::Command};

pub struct Job {
    pid: u32,
    cancelled: AtomicBool,
    paused: AtomicBool,
    paths: Vec<PathBuf>,
}

#[derive(Default)]
pub struct Jobs {
    running: Mutex<HashMap<String, Arc<Job>>>,
    cancelled: AtomicBool,
    paused: AtomicBool,
    wake: tokio::sync::Notify,
}

impl Jobs {
    pub fn begin(&self) -> Result<(), String> {
        let running = self.running.lock().map_err(|error| error.to_string())?;
        if !running.is_empty() {
            return Err("Processes from the previous queue are still exiting".into());
        }
        self.cancelled.store(false, Ordering::SeqCst);
        self.paused.store(false, Ordering::SeqCst);
        Ok(())
    }

    async fn wait_ready(&self) -> Result<(), String> {
        loop {
            let wake = self.wake.notified();
            tokio::pin!(wake);
            wake.as_mut().enable();
            if self.cancelled.load(Ordering::SeqCst) {
                return Err("Job cancelled".into());
            }
            if !self.paused.load(Ordering::SeqCst) {
                return Ok(());
            }
            wake.await;
        }
    }

    fn insert(&self, id: &str, job: Arc<Job>) -> Result<(), String> {
        let mut running = self.running.lock().map_err(|error| error.to_string())?;
        if self.cancelled.load(Ordering::SeqCst) {
            return Err("Job cancelled".into());
        }
        if running.contains_key(id) {
            return Err(format!("Job {id} is already running"));
        }
        if self.paused.load(Ordering::SeqCst) {
            signal(job.pid, "pause")?;
            job.paused.store(true, Ordering::SeqCst);
        }
        running.insert(id.to_owned(), job);
        Ok(())
    }

    fn remove(&self, id: &str) {
        if let Ok(mut running) = self.running.lock() {
            running.remove(id);
        }
    }
}

pub struct RunSpec {
    pub id: Value,
    pub program: PathBuf,
    pub args: Vec<String>,
    pub output_path: PathBuf,
    pub cleanup_paths: Vec<PathBuf>,
    pub event_prefix: &'static str,
    pub duration: Option<f64>,
    pub discover_output: Option<(PathBuf, String)>,
    pub emit_exit: bool,
}

pub struct RunOutcome {
    pub code: i32,
    pub stderr: String,
    pub output_path: PathBuf,
    pub cancelled: bool,
}

fn find_output(directory: &std::path::Path, prefix: &str) -> Option<PathBuf> {
    std::fs::read_dir(directory)
        .ok()?
        .filter_map(Result::ok)
        .filter(|entry| entry.file_name().to_string_lossy().starts_with(prefix))
        .filter(|entry| entry.path().is_file())
        .filter(|entry| {
            !matches!(
                entry.path().extension().and_then(|ext| ext.to_str()),
                Some("part" | "ytdl" | "temp")
            )
        })
        .max_by_key(|entry| {
            entry
                .metadata()
                .ok()
                .and_then(|metadata| metadata.modified().ok())
        })
        .map(|entry| entry.path())
}

fn progress_from_ffmpeg(output: &str, duration: f64) -> Option<f64> {
    if duration <= 0.0 {
        return None;
    }
    let (marker, width) = if let Some(marker) = output.rfind("out_time=") {
        (marker, 9)
    } else if let Some(marker) = output.rfind("time=") {
        (marker, 5)
    } else if let Some(marker) = output.rfind("out_time_us=") {
        let microseconds = output[marker + 12..]
            .split_whitespace()
            .next()?
            .parse::<f64>()
            .ok()?;
        return Some((microseconds / 1_000_000.0 / duration * 100.0).clamp(0.0, 99.0));
    } else {
        return None;
    };
    let time = output[marker + width..].split_whitespace().next()?;
    let mut parts = time.split(':');
    let hours = parts.next()?.parse::<f64>().ok()?;
    let minutes = parts.next()?.parse::<f64>().ok()?;
    let seconds = parts.next()?.parse::<f64>().ok()?;
    Some(((hours * 3600.0 + minutes * 60.0 + seconds) / duration * 100.0).clamp(0.0, 99.0))
}

fn progress_from_ytdlp(output: &str) -> Option<f64> {
    let start = output.rfind("[download]")?;
    let tail = &output[start + 10..];
    let percent = tail.split('%').next()?.split_whitespace().last()?;
    percent
        .parse::<f64>()
        .ok()
        .map(|number| number.clamp(0.0, 99.0))
}

fn progress_from_twitch(output: &str) -> Option<f64> {
    output
        .split('%')
        .rev()
        .skip(1)
        .find_map(|part| part.split_whitespace().last()?.parse::<f64>().ok())
        .map(|number| number.clamp(0.0, 99.0))
}

fn keep_tail(text: &mut String, limit: usize) {
    if text.len() > limit {
        let cutoff = text
            .char_indices()
            .find(|(index, _)| *index >= text.len() - limit)
            .map(|(index, _)| index)
            .unwrap_or(0);
        text.drain(..cutoff);
    }
}

async fn read_output<R: tokio::io::AsyncRead + Unpin>(
    mut reader: R,
    app: AppHandle,
    id: Value,
    prefix: &'static str,
    duration: Option<f64>,
) -> String {
    let mut collected = String::new();
    let mut progress_tail = String::new();
    let mut buffer = [0_u8; 4096];
    loop {
        let size = match reader.read(&mut buffer).await {
            Ok(size) => size,
            Err(_) => break,
        };
        if size == 0 {
            break;
        }
        let chunk = String::from_utf8_lossy(&buffer[..size]).into_owned();
        collected.push_str(&chunk);
        keep_tail(&mut collected, 64 * 1024);
        progress_tail.push_str(&chunk);
        keep_tail(&mut progress_tail, 2048);
        let event = if prefix == "cli" {
            "cli-output"
        } else if prefix == "ytdl" {
            "ytdl-output"
        } else {
            "twitch-output"
        };
        let payload = if prefix == "cli" {
            Value::String(chunk.clone())
        } else {
            json!({"id": id, "data": chunk})
        };
        let _ = app.emit(event, payload);
        let progress = if prefix == "cli" {
            duration.and_then(|duration| progress_from_ffmpeg(&progress_tail, duration))
        } else if prefix == "twitch" {
            progress_from_twitch(&progress_tail)
        } else {
            progress_from_ytdlp(&progress_tail)
        };
        if let Some(progress) = progress {
            let phase = if prefix == "cli" {
                "encoding"
            } else {
                "downloading"
            };
            crate::queue::report_progress(&app, &id, progress, phase);
            let _ = app.emit(
                &format!("{prefix}-progress"),
                json!({"id": id, "progress": progress}),
            );
        }
    }
    collected
}

pub async fn run(app: AppHandle, jobs: Arc<Jobs>, spec: RunSpec) -> Result<RunOutcome, String> {
    jobs.wait_ready().await?;
    let mut command = Command::new(&spec.program);
    command
        .args(&spec.args)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);
    #[cfg(unix)]
    {
        use std::os::unix::process::CommandExt;
        // yt-dlp can spawn FFmpeg. Keep the complete job in its own process group
        // so stopping or pausing it also reaches the child process.
        command.as_std_mut().process_group(0);
    }
    if spec.event_prefix == "twitch" {
        command.env(
            "DOTNET_BUNDLE_EXTRACT_BASE_DIR",
            crate::tools::twitch_extract_dir(&app)?,
        );
    }
    let mut child = command.spawn().map_err(|error| error.to_string())?;
    let pid = child.id().ok_or("Process ID unavailable")?;
    let job = Arc::new(Job {
        pid,
        cancelled: AtomicBool::new(false),
        paused: AtomicBool::new(false),
        paths: spec.cleanup_paths,
    });
    let key = spec.id.to_string();
    if let Err(error) = jobs.insert(&key, job.clone()) {
        let _ = signal(pid, "kill");
        let _ = child.kill().await;
        return Err(error);
    }
    let stdout = child.stdout.take().ok_or("No process stdout")?;
    let stderr = child.stderr.take().ok_or("No process stderr")?;
    let out_task = tokio::spawn(read_output(
        stdout,
        app.clone(),
        spec.id.clone(),
        spec.event_prefix,
        spec.duration,
    ));
    let err_task = tokio::spawn(read_output(
        stderr,
        app.clone(),
        spec.id.clone(),
        spec.event_prefix,
        spec.duration,
    ));
    let result = loop {
        let wake = jobs.wake.notified();
        tokio::pin!(wake);
        wake.as_mut().enable();
        if jobs.cancelled.load(Ordering::SeqCst) {
            job.cancelled.store(true, Ordering::SeqCst);
            match tokio::time::timeout(std::time::Duration::from_secs(3), child.wait()).await {
                Ok(result) => break result,
                Err(_) => {
                    let _ = signal(pid, "kill");
                    let _ = child.start_kill();
                    break child.wait().await;
                }
            }
        }
        tokio::select! {
            result = child.wait() => break result,
            _ = &mut wake => {},
        }
    };
    if job.cancelled.load(Ordering::SeqCst) {
        let _ = signal(pid, "kill");
    }
    let stdout = out_task.await.unwrap_or_default();
    let stderr = err_task.await.unwrap_or_default();
    jobs.remove(&key);
    let cancelled = job.cancelled.load(Ordering::SeqCst);
    let code = result
        .map_err(|error| error.to_string())?
        .code()
        .unwrap_or(1);
    if cancelled || code != 0 {
        for path in &job.paths {
            let _ = std::fs::remove_file(path);
        }
    }
    let reported_path = stdout
        .lines()
        .filter_map(|line| line.trim().strip_prefix("gorex-path:"))
        .last()
        .map(PathBuf::from);
    let output_path = reported_path
        .or_else(|| {
            spec.discover_output
                .as_ref()
                .and_then(|(directory, prefix)| find_output(directory, prefix))
        })
        .unwrap_or(spec.output_path);
    if spec.emit_exit {
        let payload = json!({"id": spec.id, "code": code, "stderr": stderr, "outputPath": if cancelled { None } else { Some(output_path.to_string_lossy().into_owned()) }});
        let _ = app.emit(&format!("{}-exit", spec.event_prefix), payload);
    }
    Ok(RunOutcome {
        code,
        stderr,
        output_path,
        cancelled,
    })
}

fn signal(pid: u32, action: &str) -> Result<(), String> {
    #[cfg(unix)]
    {
        let signal = match action {
            "stop" => libc::SIGTERM,
            "kill" => libc::SIGKILL,
            "pause" => libc::SIGSTOP,
            "resume" => libc::SIGCONT,
            _ => return Err("Unknown action".into()),
        };
        // The PID comes only from a process spawned and tracked by this application.
        if action == "stop" {
            // A paused process must run again to handle SIGTERM and remove its
            // partially written output before the job can finish.
            unsafe {
                libc::kill(-(pid as i32), libc::SIGCONT);
            }
        }
        if unsafe { libc::kill(-(pid as i32), signal) } == 0 {
            Ok(())
        } else {
            let error = std::io::Error::last_os_error();
            if error.raw_os_error() == Some(libc::ESRCH) {
                Ok(())
            } else {
                Err(error.to_string())
            }
        }
    }
    #[cfg(windows)]
    {
        let status = if matches!(action, "stop" | "kill") {
            std::process::Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .status()
        } else if matches!(action, "pause" | "resume") {
            let script = format!(
                "$GorexRootProcessId = {pid}; $GorexControlAction = '{action}';\n{}",
                include_str!("../windows/process-control.ps1")
            );
            std::process::Command::new("powershell.exe")
                .args(["-NoProfile", "-NonInteractive", "-Command", &script])
                .status()
        } else {
            return Err("Unknown action".into());
        }
        .map_err(|error| error.to_string())?;
        if status.success() {
            Ok(())
        } else {
            Err(format!("{action} failed: {status}"))
        }
    }
}

fn control(jobs: &Jobs, action: &str) -> Result<(), String> {
    let running = jobs.running.lock().map_err(|error| error.to_string())?;
    match action {
        "stop" => {
            jobs.cancelled.store(true, Ordering::SeqCst);
            jobs.paused.store(false, Ordering::SeqCst);
        }
        "pause" => jobs.paused.store(true, Ordering::SeqCst),
        "resume" => jobs.paused.store(false, Ordering::SeqCst),
        _ => return Err("Unknown action".into()),
    }
    jobs.wake.notify_waiters();
    let mut errors = Vec::new();
    for job in running.values() {
        if action == "pause" && job.paused.load(Ordering::SeqCst) {
            continue;
        }
        if action == "resume" && !job.paused.load(Ordering::SeqCst) {
            continue;
        }
        if action == "stop" {
            job.cancelled.store(true, Ordering::SeqCst);
        }
        if let Err(error) = signal(job.pid, action) {
            errors.push(error);
            continue;
        }
        if action == "pause" {
            job.paused.store(true, Ordering::SeqCst);
        }
        if action == "resume" {
            job.paused.store(false, Ordering::SeqCst);
        }
    }
    if errors.is_empty() {
        Ok(())
    } else {
        Err(errors.join("\n"))
    }
}

#[tauri::command]
pub async fn stop_all(app: AppHandle, state: tauri::State<'_, Arc<Jobs>>) -> Result<(), String> {
    control_command(app, state.inner().clone(), "stop").await
}
#[tauri::command]
pub async fn pause_all(app: AppHandle, state: tauri::State<'_, Arc<Jobs>>) -> Result<(), String> {
    control_command(app, state.inner().clone(), "pause").await
}
#[tauri::command]
pub async fn resume_all(app: AppHandle, state: tauri::State<'_, Arc<Jobs>>) -> Result<(), String> {
    control_command(app, state.inner().clone(), "resume").await
}

async fn control_command(
    app: AppHandle,
    jobs: Arc<Jobs>,
    action: &'static str,
) -> Result<(), String> {
    let queue = app.state::<Arc<crate::queue::Queue>>().inner().clone();
    let _operation = queue.operation.lock().await;
    if action == "stop" {
        queue.control(&app, action);
    }
    tokio::task::spawn_blocking(move || control(&jobs, action))
        .await
        .map_err(|error| error.to_string())??;
    if action != "stop" {
        queue.control(&app, action);
    }
    Ok(())
}

pub async fn shutdown(app: AppHandle) {
    let jobs = app.state::<Arc<Jobs>>().inner().clone();
    if let Err(error) = control_command(app.clone(), jobs.clone(), "stop").await {
        log::warn!("Stopping jobs during exit: {error}");
    }
    let deadline = tokio::time::Instant::now() + std::time::Duration::from_secs(10);
    while app.state::<Arc<crate::queue::Queue>>().is_active() {
        if tokio::time::Instant::now() >= deadline {
            if let Ok(running) = jobs.running.lock() {
                for job in running.values() {
                    let _ = signal(job.pid, "kill");
                }
            }
            break;
        }
        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    }
}

#[cfg(test)]
mod tests {
    use super::{progress_from_ffmpeg, progress_from_twitch, progress_from_ytdlp};
    #[test]
    fn parses_ffmpeg_progress() {
        assert_eq!(
            progress_from_ffmpeg("frame=12 time=00:00:05.00 speed=2x", 10.0),
            Some(50.0)
        );
    }
    #[test]
    fn parses_ytdlp_progress() {
        assert_eq!(
            progress_from_ytdlp("[download]  42.0% of 100MiB"),
            Some(42.0)
        );
    }
    #[test]
    fn parses_twitch_progress() {
        assert_eq!(
            progress_from_twitch("Downloading 40.5% complete"),
            Some(40.5)
        );
    }

    #[test]
    fn cancellation_wakes_a_job_waiting_on_pause_and_next_batch_can_start() {
        let runtime = tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .unwrap();
        runtime.block_on(async {
            let jobs = std::sync::Arc::new(super::Jobs::default());
            jobs.begin().unwrap();
            super::control(&jobs, "pause").unwrap();
            let waiting = jobs.clone();
            let worker = tokio::spawn(async move { waiting.wait_ready().await });
            tokio::task::yield_now().await;
            assert!(!worker.is_finished());
            super::control(&jobs, "stop").unwrap();
            let result = tokio::time::timeout(std::time::Duration::from_secs(1), worker)
                .await
                .unwrap()
                .unwrap();
            assert_eq!(result.unwrap_err(), "Job cancelled");
            jobs.begin().unwrap();
            assert!(jobs.wait_ready().await.is_ok());
        });
    }

    #[cfg(windows)]
    #[test]
    fn pauses_and_resumes_a_real_windows_process() {
        use std::{process::Command, thread, time::Duration};
        let mut child = Command::new("powershell.exe")
            .args([
                "-NoProfile",
                "-NonInteractive",
                "-Command",
                "Start-Sleep -Seconds 30",
            ])
            .spawn()
            .expect("start Windows test process");
        thread::sleep(Duration::from_millis(250));
        let result =
            super::signal(child.id(), "pause").and_then(|_| super::signal(child.id(), "resume"));
        let _ = super::signal(child.id(), "stop");
        let _ = child.wait();
        assert!(result.is_ok(), "Windows process control failed: {result:?}");
    }
}
