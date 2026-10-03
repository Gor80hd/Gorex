use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    collections::HashSet,
    sync::{Arc, Mutex},
    time::{SystemTime, UNIX_EPOCH},
};
use tauri::{AppHandle, Emitter, Manager, State};

use crate::{
    downloads, encoding,
    jobs::{Jobs, RunOutcome},
    twitch,
};

#[derive(Clone, Copy, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum JobKind {
    Ffmpeg,
    Ytdl,
    Twitch,
}

#[derive(Clone, Deserialize)]
pub struct JobRequest {
    pub kind: JobKind,
    pub request: Value,
    #[serde(default)]
    pub task: Value,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QueueEntry {
    #[serde(skip_serializing_if = "Option::is_none")]
    task: Option<Arc<Value>>,
    id: Value,
    kind: JobKind,
    status: String,
    progress: f64,
    start_time: u64,
    end_time: Option<u64>,
    output_path: Option<String>,
    error: Option<String>,
}

#[derive(Clone, Default, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct QueueSnapshot {
    revision: u64,
    active: bool,
    paused: bool,
    started_at: Option<u64>,
    entries: Vec<QueueEntry>,
    #[serde(skip)]
    cancelled: bool,
    #[serde(skip)]
    remaining: usize,
}

#[derive(Default)]
pub struct Queue {
    state: Mutex<QueueSnapshot>,
    pub operation: tokio::sync::Mutex<()>,
}

impl QueueSnapshot {
    fn apply_progress(&mut self, id: &Value, progress: f64, phase: &str) -> bool {
        if !progress.is_finite() {
            return false;
        }
        let state = self;
        if !state.active || state.cancelled {
            return false;
        }
        let Some(entry) = state.entries.iter_mut().find(|entry| entry.id == *id) else {
            return false;
        };
        if matches!(entry.status.as_str(), "done" | "error") {
            return false;
        }
        if entry.status != "converting" {
            entry.status = phase.into();
        }
        entry.progress = entry.progress.max(progress.clamp(0.0, 99.0));
        true
    }

    fn apply_converting(&mut self, id: &Value) -> bool {
        let state = self;
        if state.cancelled {
            return false;
        }
        let Some(entry) = state.entries.iter_mut().find(|entry| entry.id == *id) else {
            return false;
        };
        entry.status = "converting".into();
        entry.progress = 0.0;
        true
    }

    fn apply_control(&mut self, action: &str) -> bool {
        let state = self;
        if !state.active || (state.cancelled && action != "stop") {
            return false;
        }
        match action {
            "stop" => {
                state.cancelled = true;
                state.paused = false;
                for entry in &mut state.entries {
                    if !matches!(entry.status.as_str(), "done" | "error") {
                        entry.status = idle_status(entry.kind).into();
                        entry.progress = 0.0;
                        entry.output_path = None;
                    }
                }
            }
            "pause" => state.paused = true,
            "resume" => state.paused = false,
            _ => return false,
        }
        true
    }

    fn apply_complete(&mut self, id: &Value, result: Result<RunOutcome, String>) -> bool {
        let state = self;
        let Some(entry) = state.entries.iter_mut().find(|entry| entry.id == *id) else {
            return false;
        };
        if state.cancelled || result.as_ref().is_ok_and(|outcome| outcome.cancelled) {
            entry.status = idle_status(entry.kind).into();
            entry.progress = 0.0;
            entry.output_path = None;
            entry.end_time = None;
        } else {
            entry.end_time = Some(now());
            match result {
                Ok(outcome) if outcome.code == 0 => {
                    entry.status = "done".into();
                    entry.progress = 100.0;
                    entry.output_path = Some(outcome.output_path.to_string_lossy().into_owned());
                }
                Ok(outcome) => {
                    entry.status = "error".into();
                    entry.error = Some(outcome.stderr);
                }
                Err(error) => {
                    entry.status = "error".into();
                    entry.error = Some(error);
                }
            }
        }
        state.remaining = state.remaining.saturating_sub(1);
        if state.remaining == 0 {
            state.active = false;
            state.paused = false;
        }
        true
    }
}

fn now() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn idle_status(kind: JobKind) -> &'static str {
    match kind {
        JobKind::Ffmpeg => "ready",
        JobKind::Ytdl | JobKind::Twitch => "format_select",
    }
}

impl Queue {
    pub fn is_active(&self) -> bool {
        self.state.lock().map(|state| state.active).unwrap_or(false)
    }
    fn snapshot(&self) -> Result<QueueSnapshot, String> {
        self.state
            .lock()
            .map(|state| state.clone())
            .map_err(|error| error.to_string())
    }

    fn change(&self, app: &AppHandle, update: impl FnOnce(&mut QueueSnapshot) -> bool) {
        let snapshot = {
            let Ok(mut state) = self.state.lock() else {
                return;
            };
            if !update(&mut state) {
                return;
            }
            state.revision += 1;
            let mut snapshot = state.clone();
            // Progress events carry only lifecycle data. Recovery metadata is shared
            // and sent by get_queue_state/start_queue, not serialized on every chunk.
            for entry in &mut snapshot.entries {
                entry.task = None;
            }
            snapshot
        };
        let _ = app.emit("queue-state", snapshot);
    }

    pub fn progress(&self, app: &AppHandle, id: &Value, progress: f64, phase: &str) {
        if !progress.is_finite() {
            return;
        }
        self.change(app, |state| state.apply_progress(id, progress, phase));
    }

    pub fn converting(&self, app: &AppHandle, id: &Value) {
        self.change(app, |state| state.apply_converting(id));
    }

    pub fn control(&self, app: &AppHandle, action: &str) {
        self.change(app, |state| state.apply_control(action));
    }

    fn complete(&self, app: &AppHandle, id: &Value, result: Result<RunOutcome, String>) {
        self.change(app, |state| state.apply_complete(id, result));
    }
}

#[tauri::command]
pub async fn remove_queue_items(
    app: AppHandle,
    queue: State<'_, Arc<Queue>>,
    ids: Vec<Value>,
) -> Result<(), String> {
    let _operation = queue.operation.lock().await;
    if queue.is_active() {
        return Err("Stop the queue before removing jobs".into());
    }
    queue.change(&app, |state| {
        state.entries.retain(|entry| !ids.contains(&entry.id));
        true
    });
    Ok(())
}

pub fn report_progress(app: &AppHandle, id: &Value, progress: f64, phase: &str) {
    if let Some(queue) = app.try_state::<Arc<Queue>>() {
        queue.progress(app, id, progress, phase);
    }
}

pub fn report_conversion(app: &AppHandle, id: &Value) {
    if let Some(queue) = app.try_state::<Arc<Queue>>() {
        queue.converting(app, id);
    }
}

#[tauri::command]
pub fn get_queue_state(queue: State<'_, Arc<Queue>>) -> Result<QueueSnapshot, String> {
    queue.snapshot()
}

#[tauri::command]
pub async fn start_queue(
    app: AppHandle,
    queue: State<'_, Arc<Queue>>,
    jobs: State<'_, Arc<Jobs>>,
    requests: Vec<JobRequest>,
) -> Result<QueueSnapshot, String> {
    let _operation = queue.operation.lock().await;
    if requests.is_empty() {
        return Err("The queue is empty".into());
    }
    let mut ids = HashSet::new();
    for entry in &requests {
        let id = &entry.request["id"];
        if !(id.is_string() || id.is_number()) || !ids.insert(id.to_string()) {
            return Err("Every job must have a unique string or numeric ID".into());
        }
    }
    let snapshot = {
        let mut state = queue.state.lock().map_err(|error| error.to_string())?;
        if state.active {
            return Err("The previous queue is still running or stopping".into());
        }
        jobs.begin()?;
        let started = now();
        *state = QueueSnapshot {
            revision: state.revision + 1,
            active: true,
            paused: false,
            cancelled: false,
            started_at: Some(started),
            remaining: requests.len(),
            entries: requests
                .iter()
                .map(|entry| QueueEntry {
                    task: Some(Arc::new(entry.task.clone())),
                    id: entry.request["id"].clone(),
                    kind: entry.kind,
                    status: match entry.kind {
                        JobKind::Ffmpeg => "encoding",
                        _ => "downloading",
                    }
                    .into(),
                    progress: 0.0,
                    start_time: started,
                    end_time: None,
                    output_path: None,
                    error: None,
                })
                .collect(),
        };
        state.clone()
    };
    let _ = app.emit("queue-state", &snapshot);
    for entry in requests {
        let app = app.clone();
        let queue = queue.inner().clone();
        let jobs = jobs.inner().clone();
        tauri::async_runtime::spawn(async move {
            let id = entry.request["id"].clone();
            let result = match entry.kind {
                JobKind::Ffmpeg => encoding::execute(app.clone(), jobs, entry.request).await,
                JobKind::Ytdl => downloads::execute(app.clone(), jobs, entry.request).await,
                JobKind::Twitch => twitch::execute(app.clone(), jobs, entry.request).await,
            };
            queue.complete(&app, &id, result);
        });
    }
    Ok(snapshot)
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;
    fn running() -> QueueSnapshot {
        QueueSnapshot {
            active: true,
            remaining: 2,
            entries: (1..=2)
                .map(|id| QueueEntry {
                    task: Some(Arc::new(json!({"id":id}))),
                    id: json!(id),
                    kind: JobKind::Ytdl,
                    status: "downloading".into(),
                    progress: 0.0,
                    start_time: 0,
                    end_time: None,
                    output_path: None,
                    error: None,
                })
                .collect(),
            ..Default::default()
        }
    }
    fn success() -> Result<RunOutcome, String> {
        Ok(RunOutcome {
            code: 0,
            stderr: String::new(),
            output_path: "/output.mp4".into(),
            cancelled: false,
        })
    }
    #[test]
    fn stopping_waits_for_every_job_and_ignores_late_progress_and_exit_errors() {
        let mut state = running();
        state.apply_control("pause");
        state.apply_control("stop");
        assert!(!state.apply_control("pause"));
        assert!(!state.apply_progress(&json!(1), 90.0, "downloading"));
        assert!(!state.apply_converting(&json!(1)));
        state.apply_complete(&json!(1), Err("cancelled during preparation".into()));
        assert!(state.active);
        state.apply_complete(&json!(2), success());
        assert!(!state.active);
        assert!(!state.paused);
        assert!(state
            .entries
            .iter()
            .all(|entry| entry.status == "format_select"
                && entry.progress == 0.0
                && entry.output_path.is_none()
                && entry.error.is_none()));
    }
    #[test]
    fn conversion_starts_new_progress_and_one_finished_job_does_not_finish_batch() {
        let mut state = running();
        state.apply_progress(&json!(1), 80.0, "downloading");
        state.apply_progress(&json!(1), 12.0, "downloading");
        assert_eq!(state.entries[0].progress, 80.0);
        state.apply_converting(&json!(1));
        state.apply_progress(&json!(1), 25.0, "encoding");
        assert_eq!(state.entries[0].status, "converting");
        assert_eq!(state.entries[0].progress, 25.0);
        state.apply_complete(&json!(1), success());
        assert!(state.active);
        assert!(!state.apply_progress(&json!(1), 30.0, "encoding"));
        state.apply_complete(&json!(2), Err("download failed".into()));
        assert!(!state.active);
        assert_eq!(state.entries[0].status, "done");
        assert_eq!(state.entries[1].error.as_deref(), Some("download failed"));
    }
}
