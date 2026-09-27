use axum::{
    extract::{Path as RoutePath, Query, State},
    http::{header, HeaderMap, HeaderValue, Request, StatusCode},
    middleware::{self, Next},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use serde_json::{json, Value};
use std::{collections::HashMap, path::PathBuf, sync::{atomic::{AtomicU16, Ordering}, Arc, Mutex}};
use tauri::{AppHandle, Emitter};

use crate::tools::{locate, Tool};

const API_PORTS: std::ops::RangeInclusive<u16> = 19870..=19875;

#[derive(Default)]
pub struct ExtensionState {
    queue: Mutex<Vec<Value>>,
    media: Mutex<HashMap<String, PathBuf>>,
    port: AtomicU16,
}

impl ExtensionState {
    pub fn register_media(&self, path: PathBuf) -> Option<String> {
        let canonical = path.canonicalize().ok()?;
        if !canonical.is_file() { return None; }
        let token = uuid::Uuid::new_v4().to_string();
        self.media.lock().ok()?.insert(token.clone(), canonical);
        Some(format!("http://127.0.0.1:{}/gorex-api/media/{token}", self.port.load(Ordering::SeqCst)))
    }
}

#[derive(Clone)]
struct ApiState {
    app: AppHandle,
    extension: Arc<ExtensionState>,
}

async fn cors(request: Request<axum::body::Body>, next: Next) -> Response {
    let origin = request.headers().get(header::ORIGIN).and_then(|origin| origin.to_str().ok()).map(str::to_owned);
    let allowed = origin.as_deref().is_none_or(|origin| {
        origin.starts_with("chrome-extension://")
            || origin.starts_with("http://127.0.0.1:")
            || origin.starts_with("http://localhost:")
            || origin == "tauri://localhost"
            || origin == "http://tauri.localhost"
    });
    if !allowed {
        return StatusCode::FORBIDDEN.into_response();
    }
    let mut response = if request.method() == axum::http::Method::OPTIONS {
        StatusCode::NO_CONTENT.into_response()
    } else {
        next.run(request).await
    };
    let headers = response.headers_mut();
    headers.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, origin.as_deref().and_then(|value| HeaderValue::from_str(value).ok()).unwrap_or_else(|| HeaderValue::from_static("http://127.0.0.1")));
    headers.insert(header::ACCESS_CONTROL_ALLOW_METHODS, HeaderValue::from_static("GET, POST, OPTIONS"));
    headers.insert(header::ACCESS_CONTROL_ALLOW_HEADERS, HeaderValue::from_static("Content-Type"));
    headers.insert(header::VARY, HeaderValue::from_static("Origin"));
    response
}

async fn ping(State(state): State<ApiState>) -> Json<Value> {
    let queue_size = state.extension.queue.lock().map(|queue| queue.len()).unwrap_or_default();
    Json(json!({"ok": true, "version": state.app.package_info().version.to_string(), "queueSize": queue_size}))
}

async fn queue(State(state): State<ApiState>) -> Json<Value> {
    let queue = state.extension.queue.lock().map(|queue| queue.clone()).unwrap_or_default();
    Json(json!({"ok": true, "queue": queue}))
}

#[derive(Deserialize)]
struct FormatQuery {
    url: String,
}

pub async fn fetch_formats(app: &AppHandle, url: &str, cancel: Option<Arc<tokio::sync::Notify>>) -> Result<Value, String> {
    if !(url.starts_with("https://") || url.starts_with("http://")) {
        return Err("Only HTTP and HTTPS video links are supported".into());
    }
    let ytdlp = locate(app, Tool::Ytdlp)?;
    let mut command = tokio::process::Command::new(ytdlp);
    command.args(["--dump-json", "--no-playlist"]);
    if let Ok(deno) = locate(app, Tool::Deno) {
        command.args(["--js-runtimes", &format!("deno:{}", deno.display())]);
    }
    command.kill_on_drop(true);
    let output = tokio::select! {
        output = command.arg(url).output() => output.map_err(|error| error.to_string())?,
        _ = tokio::time::sleep(std::time::Duration::from_secs(45)) => return Err("Video format lookup timed out".into()),
        _ = async { if let Some(cancel) = cancel { cancel.notified().await } else { std::future::pending::<()>().await } } => return Err("Video format lookup cancelled".into()),
    };
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_owned());
    }
    let info: Value = serde_json::from_slice(&output.stdout).map_err(|error| error.to_string())?;
    let mut formats: Vec<Value> = info["formats"].as_array().into_iter().flatten()
        .filter(|format| format["vcodec"].as_str().is_some_and(|codec| codec != "none"))
        .map(|format| json!({
            "format_id": format["format_id"],
            "ext": format["ext"],
            "height": format["height"],
            "width": format["width"],
            "fps": format["fps"],
            "filesize": format["filesize"].as_u64().or_else(|| format["filesize_approx"].as_u64()),
            "vcodec": format["vcodec"],
            "acodec": format["acodec"],
            "tbr": format["tbr"],
            "hasAudio": format["acodec"].as_str().is_some_and(|codec| codec != "none"),
        }))
        .collect();
    formats.sort_by_key(|format| std::cmp::Reverse(format["height"].as_u64().unwrap_or_default()));
    let thumbnail = info["thumbnail"].clone();
    let available_subs: Vec<String> = info["subtitles"].as_object().map(|subs| subs.keys().cloned().collect()).unwrap_or_default();
    Ok(json!({
        "title": info["title"].as_str().or_else(|| info["id"].as_str()).unwrap_or("Видео"),
        "thumbnailUrl": thumbnail,
        "duration": info["duration"],
        "formats": formats,
        "url": url,
        "resolvedUrl": null,
        "availableSubs": available_subs,
    }))
}

async fn formats(State(state): State<ApiState>, Query(query): Query<FormatQuery>) -> impl IntoResponse {
    match fetch_formats(&state.app, &query.url, None).await {
        Ok(formats) => (StatusCode::OK, Json(json!({"ok": true, "title": formats["title"], "thumbnailUrl": formats["thumbnailUrl"], "duration": formats["duration"], "formats": formats["formats"], "url": formats["url"], "resolvedUrl": formats["resolvedUrl"], "availableSubs": formats["availableSubs"]}))),
        Err(error) => (StatusCode::BAD_GATEWAY, Json(json!({"error": error}))),
    }
}

async fn add(State(state): State<ApiState>, Json(body): Json<Value>) -> impl IntoResponse {
    let Some(url) = body["url"].as_str().map(str::trim).filter(|url| !url.is_empty()) else {
        return (StatusCode::BAD_REQUEST, Json(json!({"error": "url field required"})));
    };
    let payload = json!({
        "url": url,
        "formatId": body["formatId"],
        "quality": body["quality"].as_str().unwrap_or("best"),
        "audioOnly": body["audioOnly"].as_bool().unwrap_or(false),
        "clipStart": body["clipStart"],
        "clipEnd": body["clipEnd"],
        "downloadThumbnail": body["downloadThumbnail"].as_bool().unwrap_or(false),
        "convertAfterDownload": body["convertAfterDownload"].as_bool().unwrap_or(false),
    });
    match state.app.emit("extension-add-to-queue", payload) {
        Ok(()) => (StatusCode::OK, Json(json!({"ok": true}))),
        Err(error) => (StatusCode::SERVICE_UNAVAILABLE, Json(json!({"error": error.to_string()}))),
    }
}

async fn remove(State(state): State<ApiState>, Json(body): Json<Value>) -> impl IntoResponse {
    if body["id"].is_null() {
        return (StatusCode::BAD_REQUEST, Json(json!({"error": "id field required"})));
    }
    match state.app.emit("extension-remove-from-queue", json!({"id": body["id"]})) {
        Ok(()) => (StatusCode::OK, Json(json!({"ok": true}))),
        Err(error) => (StatusCode::SERVICE_UNAVAILABLE, Json(json!({"error": error.to_string()}))),
    }
}

async fn media(State(state): State<ApiState>, RoutePath(token): RoutePath<String>, headers: HeaderMap) -> Response {
    let path = match state.extension.media.lock().ok().and_then(|media| media.get(&token).cloned()) {
        Some(path) => path,
        None => return StatusCode::NOT_FOUND.into_response(),
    };
    let mut file = match tokio::fs::File::open(&path).await {
        Ok(file) => file,
        Err(_) => return StatusCode::NOT_FOUND.into_response(),
    };
    let total = match file.metadata().await { Ok(metadata) => metadata.len(), Err(_) => return StatusCode::NOT_FOUND.into_response() };
    if total == 0 { return StatusCode::NO_CONTENT.into_response(); }
    let range = headers.get(header::RANGE).and_then(|range| range.to_str().ok()).and_then(|range| range.strip_prefix("bytes="));
    let (start, end, partial) = match range {
        Some(range) => {
            let Some((start, end)) = range.split_once('-') else { return StatusCode::RANGE_NOT_SATISFIABLE.into_response() };
            let Ok(start) = start.parse::<u64>() else { return StatusCode::RANGE_NOT_SATISFIABLE.into_response() };
            let end = if end.is_empty() { total - 1 } else { match end.parse::<u64>() { Ok(end) => end.min(total - 1), Err(_) => return StatusCode::RANGE_NOT_SATISFIABLE.into_response() } };
            if start >= total || start > end { return StatusCode::RANGE_NOT_SATISFIABLE.into_response(); }
            (start, end, true)
        }
        None => (0, total - 1, false),
    };
    use tokio::io::{AsyncReadExt, AsyncSeekExt, SeekFrom};
    if file.seek(SeekFrom::Start(start)).await.is_err() { return StatusCode::INTERNAL_SERVER_ERROR.into_response(); }
    let length = end - start + 1;
    let stream = tokio_util::io::ReaderStream::new(file.take(length));
    let mime = match path.extension().and_then(|ext| ext.to_str()).unwrap_or("").to_ascii_lowercase().as_str() {
        "mp4" | "m4v" => "video/mp4", "mov" => "video/quicktime", "mkv" => "video/x-matroska", "webm" => "video/webm", "avi" => "video/x-msvideo", "ts" => "video/mp2t", "ogv" => "video/ogg", _ => "application/octet-stream",
    };
    let mut response = Response::new(axum::body::Body::from_stream(stream));
    *response.status_mut() = if partial { StatusCode::PARTIAL_CONTENT } else { StatusCode::OK };
    let response_headers = response.headers_mut();
    response_headers.insert(header::CONTENT_TYPE, HeaderValue::from_static(mime));
    response_headers.insert(header::ACCEPT_RANGES, HeaderValue::from_static("bytes"));
    if let Ok(value) = HeaderValue::from_str(&length.to_string()) { response_headers.insert(header::CONTENT_LENGTH, value); }
    if partial { if let Ok(value) = HeaderValue::from_str(&format!("bytes {start}-{end}/{total}")) { response_headers.insert(header::CONTENT_RANGE, value); } }
    response
}

pub async fn start(app: AppHandle, extension: Arc<ExtensionState>) -> Result<(), String> {
    let state = ApiState { app, extension };
    let router = Router::new()
        .route("/gorex-api/ping", get(ping))
        .route("/gorex-api/queue", get(queue))
        .route("/gorex-api/formats", get(formats))
        .route("/gorex-api/queue/add", post(add))
        .route("/gorex-api/queue/remove", post(remove))
        .route("/gorex-api/media/{token}", get(media))
        .fallback(|| async { (StatusCode::NOT_FOUND, Json(json!({"error": "not found"}))) })
        .layer(middleware::from_fn(cors))
        .with_state(state.clone());
    for port in API_PORTS {
        match tokio::net::TcpListener::bind(("127.0.0.1", port)).await {
            Ok(listener) => {
                state.extension.port.store(port, Ordering::SeqCst);
                log::info!("Gorex extension API listening on {}", port);
                return axum::serve(listener, router).await.map_err(|error| error.to_string());
            }
            Err(error) if error.kind() == std::io::ErrorKind::AddrInUse => continue,
            Err(error) => return Err(error.to_string()),
        }
    }
    Err("All Gorex extension API ports are in use".into())
}

#[tauri::command]
pub fn extension_update_queue(state: tauri::State<'_, Arc<ExtensionState>>, queue: Vec<Value>) {
    if let Ok(mut current) = state.queue.lock() {
        *current = queue;
    }
}

#[cfg(test)]
mod tests {
    use super::API_PORTS;

    #[test]
    fn legacy_extension_port_range_is_stable() {
        assert_eq!(API_PORTS.collect::<Vec<_>>(), vec![19870, 19871, 19872, 19873, 19874, 19875]);
    }
}
