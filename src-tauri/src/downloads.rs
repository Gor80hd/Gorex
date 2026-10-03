use crate::{
    encoding, extension,
    jobs::{self, Jobs, RunOutcome, RunSpec},
    settings,
    tools::{locate, Tool},
};
use serde_json::{json, Value};
use std::{
    path::{Path, PathBuf},
    sync::{Arc, Mutex},
};
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Default)]
pub struct FormatFetchState {
    active: Mutex<Option<Arc<tokio::sync::Notify>>>,
}

fn text<'a>(value: &'a Value, key: &str, fallback: &'a str) -> &'a str {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|text| !text.is_empty())
        .unwrap_or(fallback)
}
fn enabled(value: &Value, key: &str) -> bool {
    value.get(key).and_then(Value::as_bool).unwrap_or(false)
}
fn arg(args: &mut Vec<String>, key: &str, value: impl ToString) {
    args.push(key.into());
    args.push(value.to_string());
}

fn format_selector(format: &str, no_audio: bool) -> String {
    if format == "bestaudio" {
        "bestaudio/best".into()
    } else if format == "best" || format.is_empty() {
        if no_audio {
            "bestvideo/best"
        } else {
            "bestvideo+bestaudio[ext=m4a]/bestvideo+bestaudio/best"
        }
        .into()
    } else if format.contains('/') || format.contains('[') {
        format.into()
    } else if no_audio {
        format!("{format}/bestvideo/best")
    } else {
        format!("{format}+bestaudio[ext=m4a]/{format}+bestaudio/{format}/bestvideo+bestaudio/best")
    }
}

fn safe_name(raw: &str) -> String {
    let name = raw
        .trim()
        .chars()
        .map(|character| {
            if character.is_control() || "<>:\"/\\|?*".contains(character) {
                '_'
            } else {
                character
            }
        })
        .collect::<String>();
    let name = name.trim_end_matches('.').trim();
    if name.is_empty() {
        "video".into()
    } else {
        name.into()
    }
}

fn move_file(source: &Path, destination: &Path) -> Result<(), String> {
    match std::fs::rename(source, destination) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::CrossesDevices => {
            std::fs::copy(source, destination).map_err(|error| error.to_string())?;
            std::fs::remove_file(source).map_err(|error| error.to_string())
        }
        Err(error) => Err(error.to_string()),
    }
}

pub(crate) fn move_download_with_sidecars(
    stage: &Path,
    primary: &Path,
    output_dir: &Path,
    base: &str,
) -> Result<PathBuf, String> {
    let primary = primary.canonicalize().map_err(|error| error.to_string())?;
    let stage = stage.canonicalize().map_err(|error| error.to_string())?;
    if !primary.starts_with(&stage) || !primary.is_file() {
        return Err("yt-dlp output is outside its staging directory".into());
    }
    let extension = primary
        .extension()
        .and_then(|extension| extension.to_str())
        .ok_or("yt-dlp output has no extension")?;
    let mut reserved = crate::workspace::OutputFile::reserve(output_dir, base, extension)?;
    let destination = reserved.path().to_path_buf();
    let final_stem = destination
        .file_stem()
        .and_then(|stem| stem.to_str())
        .ok_or("Invalid output filename")?
        .to_owned();
    move_file(&primary, &destination)?;
    reserved.keep();
    for entry in std::fs::read_dir(&stage).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let name = entry.file_name().to_string_lossy().into_owned();
        if !name.starts_with(base) || name.ends_with(".part") {
            continue;
        }
        let suffix = &name[base.len()..];
        let target = output_dir.join(format!("{final_stem}{suffix}"));
        if !target.exists() {
            move_file(&path, &target)?;
        }
    }
    Ok(destination)
}

fn move_subtitles(stage: &Path, output: &Path, base: &str) -> Result<(), String> {
    let stem = output
        .file_stem()
        .and_then(|value| value.to_str())
        .ok_or("Invalid output filename")?;
    let directory = output.parent().ok_or("Output has no directory")?;
    for entry in std::fs::read_dir(stage).map_err(|error| error.to_string())? {
        let entry = entry.map_err(|error| error.to_string())?;
        let path = entry.path();
        if !path.is_file()
            || !matches!(
                path.extension().and_then(|ext| ext.to_str()),
                Some("srt" | "vtt" | "ass" | "ssa" | "lrc" | "ttml")
            )
        {
            continue;
        }
        let name = entry.file_name().to_string_lossy().into_owned();
        let Some(suffix) = name.strip_prefix(base) else {
            continue;
        };
        let target = directory.join(format!("{stem}{suffix}"));
        if !target.exists() {
            move_file(&path, &target)?;
        }
    }
    Ok(())
}

fn timestamp(seconds: f64) -> String {
    let seconds = seconds.max(0.0).floor() as u64;
    format!(
        "{:02}:{:02}:{:02}",
        seconds / 3600,
        (seconds / 60) % 60,
        seconds % 60
    )
}

fn download_args(
    request: &Value,
    template: &str,
    ffmpeg: &Path,
    deno: &Path,
    cookies: Option<&Path>,
) -> Vec<String> {
    let format = text(request, "formatId", "best");
    let audio_only = format == "bestaudio";
    let mut args = vec![
        "-f".into(),
        format_selector(format, enabled(request, "noAudio")),
        "-o".into(),
        template.into(),
        "--no-playlist".into(),
        "--newline".into(),
    ];
    if !audio_only {
        arg(&mut args, "--merge-output-format", "mp4");
    }
    arg(
        &mut args,
        "--js-runtimes",
        format!("deno:{}", deno.display()),
    );
    arg(&mut args, "--ffmpeg-location", ffmpeg.display());
    if let Some(cookies) = cookies {
        arg(&mut args, "--cookies", cookies.display());
    }
    if audio_only {
        args.push("--extract-audio".into());
        let format = text(request, "audioFormat", "best");
        if format != "best" {
            arg(&mut args, "--audio-format", format);
            if format == "mp3" {
                arg(&mut args, "--audio-quality", 0);
            }
        }
    }
    if enabled(request, "downloadSubs") {
        args.push("--write-subs".into());
    }
    if enabled(request, "autoSubs") {
        args.push("--write-auto-subs".into());
    }
    if enabled(request, "downloadSubs") || enabled(request, "autoSubs") {
        arg(&mut args, "--sub-langs", text(request, "subLangs", "all"));
        let subtitle_format = text(request, "subFormat", "srt");
        if subtitle_format == "srt" {
            arg(&mut args, "--convert-subs", "srt");
        } else {
            arg(&mut args, "--sub-format", subtitle_format);
        }
    }
    let start = request["clipStart"].as_f64();
    let end = request["clipEnd"].as_f64();
    if start.is_some_and(|start| start > 0.0) || end.is_some() {
        arg(
            &mut args,
            "--download-sections",
            format!(
                "*{}-{}",
                timestamp(start.unwrap_or_default()),
                end.map(timestamp).unwrap_or_else(|| "inf".into())
            ),
        );
    }
    if enabled(request, "sponsorBlock") && !audio_only {
        let categories = request["sponsorBlockCats"]
            .as_array()
            .map(|categories| {
                categories
                    .iter()
                    .filter_map(Value::as_str)
                    .collect::<Vec<_>>()
                    .join(",")
            })
            .filter(|categories| !categories.is_empty())
            .unwrap_or_else(|| "sponsor".into());
        arg(&mut args, "--sponsorblock-remove", categories);
    }
    arg(&mut args, "--print", "after_move:gorex-path:%(filepath)s");
    args.push(text(request, "url", "").into());
    args
}

fn cookie_file(app: &AppHandle, request: &Value) -> Option<PathBuf> {
    if let Some(file) = request["cookieFileOverride"]
        .as_str()
        .filter(|path| !path.is_empty())
    {
        return Some(PathBuf::from(file));
    }
    let settings = settings::get_app_settings(app.clone()).ok()?;
    ["ytdlManagedCookiesFile", "ytdlCookiesPath"]
        .iter()
        .filter_map(|key| settings[*key].as_str())
        .map(PathBuf::from)
        .find(|path| path.is_file())
}

#[tauri::command]
pub async fn ytdl_get_formats(
    app: AppHandle,
    state: State<'_, FormatFetchState>,
    request: Value,
) -> Result<Vec<Value>, String> {
    let url = request["url"].as_str().ok_or("Video URL is required")?;
    let notify = Arc::new(tokio::sync::Notify::new());
    {
        let mut active = state.active.lock().map_err(|error| error.to_string())?;
        if let Some(previous) = active.replace(notify.clone()) {
            previous.notify_one();
        }
    }
    let _ = app.emit("ytdl-fetch-progress", json!({"stage":"ytdlp"}));
    let result = extension::fetch_formats(&app, url, Some(notify.clone())).await;
    if let Ok(mut active) = state.active.lock() {
        if active
            .as_ref()
            .is_some_and(|current| Arc::ptr_eq(current, &notify))
        {
            *active = None;
        }
    }
    result.map(|info| vec![info])
}

#[tauri::command]
pub fn ytdl_cancel_fetch(state: State<'_, FormatFetchState>) {
    if let Ok(mut active) = state.active.lock() {
        if let Some(fetch) = active.take() {
            fetch.notify_one();
        }
    }
}

#[tauri::command]
pub async fn ytdl_run(
    app: AppHandle,
    jobs: State<'_, Arc<Jobs>>,
    request: Value,
) -> Result<(), String> {
    let id = request["id"].clone();
    let result = execute(app.clone(), jobs.inner().clone(), request)
        .await
        .map(|_| ());
    if let Err(error) = &result {
        let _ = app.emit(
            "ytdl-exit",
            json!({"id": id, "code": 1, "error": error, "stderr": error, "outputPath": null}),
        );
    }
    result
}

pub async fn execute(
    app: AppHandle,
    jobs: Arc<Jobs>,
    request: Value,
) -> Result<RunOutcome, String> {
    let id = request["id"].clone();
    if id.is_null() {
        return Err("Job ID is required".into());
    }
    let url = text(&request, "url", "");
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("Only HTTP and HTTPS video links are supported".into());
    }
    let directory = request["outputDir"]
        .as_str()
        .filter(|path| !path.is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(|| {
            app.path()
                .video_dir()
                .unwrap_or_else(|_| std::env::temp_dir())
        });
    std::fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    let convert = enabled(&request, "convertAfterDownload");
    let stage = crate::workspace::StagingDirectory::new("yt-dlp")?;
    let download_dir = stage.path().to_path_buf();
    let base = safe_name(text(&request, "outputName", "video"));
    let template = download_dir.join(format!("{base}.%(ext)s"));
    let ffmpeg = locate(&app, Tool::Ffmpeg)?;
    let deno = locate(&app, Tool::Deno)?;
    let args = download_args(
        &request,
        &template.to_string_lossy(),
        &ffmpeg,
        &deno,
        cookie_file(&app, &request).as_deref(),
    );
    let spec = RunSpec {
        id: id.clone(),
        program: locate(&app, Tool::Ytdlp)?,
        args,
        output_path: download_dir.join(format!("{base}.mp4")),
        cleanup_paths: vec![],
        event_prefix: "ytdl",
        duration: None,
        discover_output: Some((download_dir.clone(), base.clone())),
        emit_exit: false,
    };
    let result = jobs::run(app.clone(), jobs.clone(), spec).await;
    let result = match result {
        Ok(result) => result,
        Err(error) => {
            let _ = std::fs::remove_dir_all(&download_dir);
            return Err(error);
        }
    };
    if result.code != 0 || result.cancelled {
        let _ = std::fs::remove_dir_all(&download_dir);
        let _ = app.emit(
            "ytdl-exit",
            json!({"id":id,"code":result.code,"stderr":result.stderr,"outputPath":null}),
        );
        return Ok(result);
    }
    if !convert {
        let moved =
            move_download_with_sidecars(&download_dir, &result.output_path, &directory, &base);
        if moved.is_ok() {
            let _ = std::fs::remove_dir_all(&download_dir);
        }
        match moved {
            Ok(output) => {
                let _ = app.emit(
                    "ytdl-exit",
                    json!({"id":id,"code":0,"stderr":result.stderr,"outputPath":output}),
                );
                let _ = std::fs::remove_dir_all(&download_dir);
                return Ok(RunOutcome {
                    output_path: output,
                    ..result
                });
            }
            Err(error) => {
                let _ = std::fs::remove_dir_all(&download_dir);
                return Err(error);
            }
        }
    }
    crate::queue::report_conversion(&app, &id);
    let _ = app.emit(
        "ytdl-exit",
        json!({"id":id,"code":0,"converting":true,"outputPath":result.output_path}),
    );
    let settings = &request["conversionSettings"];
    let mut reserved = crate::workspace::OutputFile::reserve(
        &directory,
        &format!(
            "{}_converted",
            safe_name(text(&request, "outputName", "video"))
        ),
        encoding::output_extension(text(settings, "format", "av_mp4")),
    )?;
    let output = reserved.path().to_path_buf();
    let args = encoding::build_args(
        &result.output_path.to_string_lossy(),
        &output.to_string_lossy(),
        settings,
        request["videoResolution"].as_str(),
        None,
        None,
    );
    let conversion = RunSpec {
        id: id.clone(),
        program: ffmpeg,
        args,
        output_path: output.clone(),
        cleanup_paths: vec![output],
        event_prefix: "cli",
        duration: encoding::duration(&app, &result.output_path.to_string_lossy()).await,
        discover_output: None,
        emit_exit: true,
    };
    let outcome = jobs::run(app.clone(), jobs.clone(), conversion).await;
    if let Ok(result) = &outcome {
        if result.code == 0 && !result.cancelled {
            reserved.keep();
            move_subtitles(&download_dir, &result.output_path, &base)?;
        }
    }
    outcome
}

#[tauri::command]
pub async fn get_ytdl_info(app: AppHandle) -> Value {
    match locate(&app, Tool::Ytdlp) {
        Ok(path) => match tokio::process::Command::new(&path)
            .arg("--version")
            .output()
            .await
        {
            Ok(output) if output.status.success() => {
                json!({"found":true,"version":String::from_utf8_lossy(&output.stdout).trim(),"path":path})
            }
            _ => json!({"found":false,"version":null,"path":path}),
        },
        Err(_) => json!({"found":false,"version":null,"path":null}),
    }
}

#[cfg(test)]
mod tests {
    use super::{download_args, format_selector, safe_name};
    use serde_json::json;
    use std::path::Path;
    #[test]
    fn selects_video_and_audio_without_discarding_requested_format() {
        assert_eq!(
            format_selector("137", false),
            "137+bestaudio[ext=m4a]/137+bestaudio/137/bestvideo+bestaudio/best"
        );
        assert_eq!(format_selector("bestaudio", false), "bestaudio/best");
    }
    #[test]
    fn download_args_use_bundled_deno_and_ffmpeg() {
        let args = download_args(
            &json!({"url":"https://example.org/video"}),
            "out.%(ext)s",
            Path::new("/ffmpeg"),
            Path::new("/deno"),
            None,
        );
        assert!(args
            .windows(2)
            .any(|pair| pair == ["--js-runtimes", "deno:/deno"]));
        assert!(args
            .windows(2)
            .any(|pair| pair == ["--ffmpeg-location", "/ffmpeg"]));
    }
    #[test]
    fn filenames_are_sanitized() {
        assert_eq!(safe_name("a/b:c"), "a_b_c");
    }
}
