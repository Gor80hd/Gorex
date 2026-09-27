use axum::{
    extract::{Query, State},
    http::{header, HeaderMap, HeaderValue, StatusCode},
    response::{Html, IntoResponse, Response},
    routing::get,
    Router,
};
use serde::Deserialize;
use std::sync::{atomic::{AtomicU16, Ordering}, Arc};

#[derive(Default)]
pub struct PlayerState {
    port: AtomicU16,
}

#[derive(Deserialize)]
struct PlayerQuery {
    id: String,
    start: Option<u32>,
}

fn valid_video_id(id: &str) -> bool {
    id.len() == 11 && id.bytes().all(|byte| byte.is_ascii_alphanumeric() || byte == b'_' || byte == b'-')
}

async fn player(State(state): State<Arc<PlayerState>>, Query(query): Query<PlayerQuery>) -> Response {
    if !valid_video_id(&query.id) {
        return StatusCode::BAD_REQUEST.into_response();
    }
    let origin = format!("http://127.0.0.1:{}", state.port.load(Ordering::SeqCst));
    let html = include_str!("player.html")
        .replace("__VIDEO_ID__", &query.id)
        .replace("__START__", &query.start.unwrap_or(0).min(86_400).to_string())
        .replace("__ORIGIN__", &origin);
    let mut headers = HeaderMap::new();
    headers.insert(header::REFERRER_POLICY, HeaderValue::from_static("strict-origin-when-cross-origin"));
    headers.insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    headers.insert(header::X_CONTENT_TYPE_OPTIONS, HeaderValue::from_static("nosniff"));
    headers.insert(header::CONTENT_SECURITY_POLICY, HeaderValue::from_static("default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; frame-src https://www.youtube-nocookie.com https://www.youtube.com; img-src https://i.ytimg.com data:"));
    (headers, Html(html)).into_response()
}

pub async fn start(state: Arc<PlayerState>) -> Result<(), String> {
    let listener = tokio::net::TcpListener::bind(("127.0.0.1", 0)).await.map_err(|error| error.to_string())?;
    let port = listener.local_addr().map_err(|error| error.to_string())?.port();
    state.port.store(port, Ordering::SeqCst);
    let router = Router::new().route("/player", get(player)).with_state(state);
    axum::serve(listener, router).await.map_err(|error| error.to_string())
}

#[tauri::command]
pub fn get_youtube_player_url(state: tauri::State<'_, Arc<PlayerState>>, id: String, start: u32) -> Result<String, String> {
    if !valid_video_id(&id) { return Err("Invalid YouTube video ID".into()); }
    let port = state.port.load(Ordering::SeqCst);
    if port == 0 { return Err("YouTube player is not ready".into()); }
    Ok(format!("http://127.0.0.1:{port}/player?id={id}&start={}", start.min(86_400)))
}

#[cfg(test)]
mod tests {
    use super::valid_video_id;

    #[test]
    fn accepts_only_youtube_video_ids() {
        assert!(valid_video_id("jNQXAC9IVRw"));
        assert!(!valid_video_id("../malicious"));
        assert!(!valid_video_id("too-short"));
    }
}
