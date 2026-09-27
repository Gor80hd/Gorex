use serde_json::{json, Value};
use std::{path::PathBuf, sync::Arc};
use tauri::{AppHandle, Emitter, Manager, State};
use crate::{encoding, jobs::{self, Jobs, RunSpec}, tools::{locate, Tool}};

fn field<'a>(value: &'a Value, key: &str, fallback: &'a str) -> &'a str {
    value.get(key).and_then(Value::as_str).filter(|text| !text.is_empty()).unwrap_or(fallback)
}
fn bool_field(value: &Value, key: &str) -> bool { value.get(key).and_then(Value::as_bool).unwrap_or(false) }

fn parse_url(raw: &str) -> Result<Value, String> {
    let url = url::Url::parse(raw).map_err(|_| "Некорректная ссылка Twitch")?;
    if url.scheme() != "https" && url.scheme() != "http" { return Err("Некорректная ссылка Twitch".into()); }
    let host = url.host_str().unwrap_or("").trim_start_matches("www.").trim_start_matches("m.");
    let parts = url.path_segments().ok_or("Некорректная ссылка Twitch")?.filter(|part| !part.is_empty()).collect::<Vec<_>>();
    if host == "clips.twitch.tv" && !parts.is_empty() {
        return Ok(json!({"ok":true,"type":"clip","id":parts[0],"slug":parts[0],"sourceUrl":url.to_string()}));
    }
    if host != "twitch.tv" { return Err("Неподдерживаемая ссылка Twitch".into()); }
    if parts.len() >= 2 && parts[0] == "videos" && parts[1].chars().all(|character| character.is_ascii_digit()) {
        return Ok(json!({"ok":true,"type":"vod","id":parts[1],"sourceUrl":url.to_string()}));
    }
    if parts.len() >= 2 && parts[0] == "clip" {
        return Ok(json!({"ok":true,"type":"clip","id":parts[1],"slug":parts[1],"sourceUrl":url.to_string()}));
    }
    if parts.len() >= 3 && parts[1] == "clip" {
        return Ok(json!({"ok":true,"type":"clip","id":parts[2],"slug":parts[2],"channel":parts[0],"sourceUrl":url.to_string()}));
    }
    if parts.len() == 1 && parts[0].len() >= 3 && parts[0].len() <= 25 && parts[0].chars().all(|character| character.is_ascii_alphanumeric() || character == '_') {
        let reserved = ["videos", "clips", "directory", "search", "settings", "login", "about"];
        if !reserved.contains(&parts[0].to_ascii_lowercase().as_str()) {
            return Ok(json!({"ok":true,"type":"channel","id":parts[0],"channel":parts[0],"sourceUrl":format!("https://www.twitch.tv/{}",parts[0])}));
        }
    }
    Err("Неподдерживаемая ссылка Twitch".into())
}

async fn graphql(app: &AppHandle, query: &str, variables: Value) -> Result<Value, String> {
    let body = json!({"query":query,"variables":variables}).to_string();
    let output = tokio::process::Command::new("curl")
        .args(["--fail", "--silent", "--show-error", "--location", "--max-time", "20", "-X", "POST", "-H", "Client-ID: kimne78kx3ncx6brgo4mv6wki5h1ko", "-H", "Content-Type: application/json", "-H", &format!("User-Agent: Gorex-App/{}", app.package_info().version), "--data-binary", &body, "https://gql.twitch.tv/gql"])
        .output().await.map_err(|error| error.to_string())?;
    if !output.status.success() { return Err(String::from_utf8_lossy(&output.stderr).trim().into()); }
    let response: Value = serde_json::from_slice(&output.stdout).map_err(|error| error.to_string())?;
    if let Some(errors) = response["errors"].as_array() { return Err(errors.iter().filter_map(|error| error["message"].as_str()).collect::<Vec<_>>().join("; ")); }
    Ok(response["data"].clone())
}

fn duration_label(seconds: f64) -> String {
    let seconds = seconds.max(0.0) as u64;
    format!("{}:{:02}:{:02}", seconds / 3600, (seconds / 60) % 60, seconds % 60)
}

fn quality_options() -> Value {
    json!([
        {"value":"Source","label":"Source","height":0,"fps":0,"source":true},
        {"value":"1080p60","label":"1080p60","height":1080,"fps":60},
        {"value":"1080p","label":"1080p","height":1080,"fps":30},
        {"value":"720p60","label":"720p60","height":720,"fps":60},
        {"value":"720p","label":"720p","height":720,"fps":30},
        {"value":"480p","label":"480p","height":480,"fps":30},
        {"value":"360p","label":"360p","height":360,"fps":30},
    ])
}

fn normalize_video(node: &Value, kind: &str, source_url: &str, channel: &str) -> Value {
    let seconds = node["durationSeconds"].as_f64().or_else(|| node["lengthSeconds"].as_f64()).unwrap_or_default();
    let id = node["slug"].as_str().or_else(|| node["id"].as_str()).unwrap_or("");
    let url = if source_url.is_empty() { format!("https://www.twitch.tv/videos/{id}") } else { source_url.into() };
    json!({
        "id":id,"type":kind,"url":url,
        "title":node["title"].as_str().unwrap_or(if kind == "clip" { "Twitch Clip" } else { "Twitch VOD" }),
        "duration":duration_label(seconds),"durationSeconds":seconds,
        "thumbnail":node["previewThumbnailURL"].as_str().or_else(||node["thumbnailURL"].as_str()).unwrap_or(""),
        "channel":node["owner"]["displayName"].as_str().or_else(||node["broadcaster"]["displayName"].as_str()).unwrap_or(channel),
        "qualityOptions":quality_options(),"quality":"Source",
        "createdAt":node["createdAt"],
    })
}

#[tauri::command]
pub async fn twitch_resolve_url(app: AppHandle, url: String) -> Value {
    let parsed = match parse_url(&url) { Ok(parsed) => parsed, Err(error) => return json!({"ok":false,"error":error}) };
    let kind = field(&parsed, "type", "");
    if kind == "channel" { return json!({"ok":true,"type":"channel","channel":parsed["channel"],"parsed":parsed}); }
    let id = field(&parsed, "id", "");
    let response = if kind == "vod" {
        graphql(&app, "query GorexVod($id: ID!) { video(id: $id) { id title lengthSeconds createdAt previewThumbnailURL(width: 320, height: 180) owner { login displayName } } }", json!({"id":id})).await.map(|data| data["video"].clone())
    } else {
        graphql(&app, "query GorexClip($slug: String!) { clip(slug: $slug) { id slug title durationSeconds createdAt thumbnailURL(width: 320, height: 180) broadcaster { login displayName } } }", json!({"slug":id})).await.map(|data| data["clip"].clone())
    };
    let node = response.unwrap_or(Value::Null);
    let info = normalize_video(&node, kind, &url, field(&parsed, "channel", ""));
    json!({"ok":true,"type":kind,"parsed":parsed,"info":info})
}

#[tauri::command]
pub async fn twitch_get_channel_videos(app: AppHandle, channel: String, limit: Option<u32>) -> Value {
    let limit = limit.unwrap_or(30).clamp(1, 60);
    let result = graphql(&app, "query GorexChannelVideos($login: String!, $limit: Int!) { user(login: $login) { login displayName profileImageURL(width:70) videos(first:$limit,sort:TIME,type:ARCHIVE) { edges { node { id title lengthSeconds createdAt previewThumbnailURL(width:320,height:180) owner { login displayName } } } } } }", json!({"login":channel,"limit":limit})).await;
    match result {
        Ok(data) if data["user"].is_object() => {
            let user = &data["user"];
            let videos = user["videos"]["edges"].as_array().into_iter().flatten().map(|edge| normalize_video(&edge["node"], "vod", "", field(user, "displayName", &channel))).collect::<Vec<_>>();
            json!({"ok":true,"channel":user["login"].as_str().unwrap_or(&channel),"displayName":user["displayName"],"avatar":user["profileImageURL"],"videos":videos})
        }
        Ok(_) => json!({"ok":false,"error":format!("Канал Twitch не найден: {channel}")}),
        Err(error) => json!({"ok":false,"error":error}),
    }
}

fn unique_output(directory: &std::path::Path, base: &str, ext: &str) -> PathBuf {
    for index in 0..100_000 {
        let name = if index == 0 { format!("{base}.{ext}") } else { format!("{base} ({index}).{ext}") };
        let path = directory.join(name);
        if !path.exists() { return path; }
    }
    directory.join(format!("{base}-{}.{ext}",std::process::id()))
}

fn safe_name(raw: &str) -> String {
    let name = raw.chars().map(|character| if character.is_control() || "<>:\"/\\|?*".contains(character) { '_' } else { character }).collect::<String>();
    let name = name.trim_end_matches('.').trim();
    if name.is_empty() { "twitch_video".into() } else { name.into() }
}

#[tauri::command]
pub async fn twitch_run(app: AppHandle, jobs: State<'_, Arc<Jobs>>, request: Value) -> Result<(), String> {
    let id = request["id"].clone();
    if id.is_null() { return Err("Job ID is required".into()); }
    let kind = field(&request, "type", "vod");
    let mode = match kind { "vod" => "videodownload", "clip" => "clipdownload", _ => return Err("Unsupported Twitch item".into()) };
    let url = field(&request, "url", "");
    let parsed = parse_url(url)?;
    let dir = request["outputDir"].as_str().filter(|path| !path.is_empty()).map(PathBuf::from).unwrap_or_else(|| app.path().video_dir().unwrap_or_else(|_| std::env::temp_dir()));
    std::fs::create_dir_all(&dir).map_err(|error| error.to_string())?;
    let convert = bool_field(&request, "convertAfterDownload");
    let download_dir = if convert { crate::platform::temp_download_dir() } else { dir.clone() };
    std::fs::create_dir_all(&download_dir).map_err(|error| error.to_string())?;
    let name = safe_name(field(&request, "outputName", "twitch_video"));
    let download_name = if convert { format!("gorex_twitch_{}_{}", id, std::process::id()) } else { name.clone() };
    let output = unique_output(&download_dir, &download_name, "mp4");
    let ffmpeg = locate(&app, Tool::Ffmpeg)?;
    let mut args = vec![mode.into(), "--id".into(), field(&parsed,"sourceUrl",url).into(), "-o".into(), output.to_string_lossy().into_owned(), "--collision".into(), "Rename".into(), "--banner=false".into(), "--temp-path".into(), download_dir.to_string_lossy().into_owned(), "--ffmpeg-path".into(), ffmpeg.to_string_lossy().into_owned()];
    let quality = field(&request, "twitchQuality", "Source");
    if !matches!(quality.to_ascii_lowercase().as_str(), "source" | "best" | "auto") { args.extend(["--quality".into(),quality.into()]); }
    if let Some(start) = request["clipStart"].as_f64().filter(|start| *start > 0.0) { args.extend(["--beginning".into(), format!("{}",duration_label(start))]); }
    if let Some(end) = request["clipEnd"].as_f64() { args.extend(["--ending".into(), format!("{}",duration_label(end))]); }
    let spec = RunSpec { id: id.clone(), program: locate(&app, Tool::Twitch)?, args, output_path: output.clone(), cleanup_paths: vec![output], event_prefix: "twitch", duration: None, discover_output: Some((download_dir.clone(),download_name)), emit_exit: !convert };
    let result = jobs::run(app.clone(), jobs.inner().clone(), spec).await?;
    if !convert || result.code != 0 || result.cancelled {
        if convert { let _ = app.emit("twitch-exit", json!({"id":id,"code":result.code,"stderr":result.stderr,"outputPath":null})); }
        return Ok(());
    }
    let _ = app.emit("twitch-exit", json!({"id":id,"code":0,"converting":true,"outputPath":result.output_path}));
    let settings = &request["conversionSettings"];
    let final_path = unique_output(&dir, &format!("{}_converted", name.trim_end_matches("_converted")), encoding::output_extension(field(settings,"format","av_mp4")));
    let args = encoding::build_args(&result.output_path.to_string_lossy(), &final_path.to_string_lossy(), settings, request["videoResolution"].as_str(), None, None);
    let convert_spec = RunSpec { id, program: ffmpeg, args, output_path: final_path.clone(), cleanup_paths: vec![final_path], event_prefix: "cli", duration: None, discover_output: None, emit_exit: true };
    let converted = jobs::run(app, jobs.inner().clone(), convert_spec).await?;
    if converted.code == 0 { let _ = std::fs::remove_file(result.output_path); }
    Ok(())
}

#[tauri::command]
pub async fn get_twitch_info(app: AppHandle) -> Value {
    match locate(&app, Tool::Twitch) {
        Ok(path) => match tokio::process::Command::new(&path).env("DOTNET_BUNDLE_EXTRACT_BASE_DIR", crate::tools::twitch_extract_dir(&app).unwrap_or_else(|_| std::env::temp_dir())).arg("--version").output().await {
            Ok(output) if String::from_utf8_lossy(&output.stderr).starts_with("TwitchDownloaderCLI ") || String::from_utf8_lossy(&output.stdout).starts_with("TwitchDownloaderCLI ") => {
                let raw = if output.stdout.is_empty() { String::from_utf8_lossy(&output.stderr) } else { String::from_utf8_lossy(&output.stdout) };
                let version = raw.split_whitespace().nth(1).unwrap_or("").split('+').next().unwrap_or("");
                let source = if path.to_string_lossy().contains("/tools/twitch/current/") || path.to_string_lossy().contains("\\tools\\twitch\\current\\") { "user" } else { "bundled" };
                json!({"found":true,"version":version,"path":path,"source":source})
            },
            _ => json!({"found":false,"version":null,"path":path}),
        },
        Err(_) => json!({"found":false,"version":null,"path":null}),
    }
}

fn chat_identity(request: &Value) -> Result<String, String> {
    if let Some(url) = request["url"].as_str().filter(|url| !url.is_empty()) {
        let parsed = parse_url(url)?;
        if parsed["type"] == "channel" { return Err("Нужна ссылка на запись или клип Twitch".into()); }
        return Ok(field(&parsed, "sourceUrl", url).into());
    }
    request["id"].as_str().filter(|id| !id.is_empty()).map(str::to_owned).ok_or_else(|| "Невозможно определить Twitch VOD/Clip для чата".into())
}

fn chat_cache_file(app: &AppHandle, identity: &str, full: bool) -> Result<PathBuf, String> {
    let directory = app.path().app_cache_dir().map_err(|error| error.to_string())?.join("twitch-chat");
    std::fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    let key = identity.rsplit('/').next().unwrap_or(identity).split('?').next().unwrap_or("chat");
    Ok(directory.join(format!("{}.{}.json", safe_name(key), if full { "full" } else { "preview" })))
}

async fn fetch_chat(app: &AppHandle, identity: &str, path: &PathBuf, full: bool) -> Result<(), String> {
    let cli = locate(app, Tool::Twitch)?;
    let mut command = tokio::process::Command::new(cli);
    command.env("DOTNET_BUNDLE_EXTRACT_BASE_DIR", crate::tools::twitch_extract_dir(app)?);
    command.args(["chatdownload", "--id", identity, "-o", &path.to_string_lossy(), "--collision", "Overwrite", "--banner=false"]);
    if !full { command.args(["--ending", "15m"]); }
    let output = tokio::time::timeout(std::time::Duration::from_secs(600), command.output()).await
        .map_err(|_| "Twitch chat request timed out".to_owned())?.map_err(|error| error.to_string())?;
    if !output.status.success() { return Err(String::from_utf8_lossy(&output.stderr).trim().into()); }
    Ok(())
}

fn parse_chat(raw: &str) -> Result<Vec<Value>, String> {
    let data: Value = serde_json::from_str(raw).map_err(|error| error.to_string())?;
    let comments = if let Some(comments) = data.as_array() { comments } else { data["comments"].as_array().ok_or("Twitch chat has no comments")? };
    let messages = comments.iter().enumerate().filter_map(|(index, comment)| {
        let message = &comment["message"];
        let body = message["body"].as_str().or_else(||message["text"].as_str()).map(str::to_owned)
            .or_else(||message["fragments"].as_array().map(|fragments| fragments.iter().filter_map(|part| part["text"].as_str().or_else(||part["body"].as_str())).collect::<String>()))
            .unwrap_or_default();
        if body.trim().is_empty() { return None; }
        let seconds = comment["content_offset_seconds"].as_f64().or_else(||comment["offset_seconds"].as_f64()).unwrap_or_default();
        let label = duration_label(seconds);
        Some(json!({
            "id":comment["_id"].as_str().or_else(||comment["id"].as_str()).map(str::to_owned).unwrap_or_else(||index.to_string()),
            "offsetSeconds":seconds,"timeLabel":label,
            "username":comment["commenter"]["display_name"].as_str().or_else(||comment["commenter"]["name"].as_str()).or_else(||comment["user_name"].as_str()).unwrap_or(""),
            "body":body.trim(),"createdAt":comment["created_at"].as_str().unwrap_or("")
        }))
    }).collect();
    Ok(messages)
}

#[tauri::command]
pub async fn twitch_download_chat(app: AppHandle, request: Value) -> Value {
    let result = async {
        let identity = chat_identity(&request)?;
        let full = bool_field(&request, "full");
        let path = chat_cache_file(&app, &identity, full)?;
        if bool_field(&request, "force") || !path.is_file() { fetch_chat(&app, &identity, &path, full).await?; }
        let raw = std::fs::read_to_string(&path).map_err(|error| error.to_string())?;
        let messages = parse_chat(&raw)?;
        Ok::<Value, String>(json!({"ok":true,"filePath":path,"messages":messages,"isComplete":full,"previewMinutes":if full { None } else { Some(15) },"cachePolicy":"session"}))
    }.await;
    result.unwrap_or_else(|error| json!({"ok":false,"error":error}))
}

#[tauri::command]
pub async fn twitch_export_chat(app: AppHandle, request: Value) -> Value {
    let result = async {
        let identity = chat_identity(&request)?;
        let cache = chat_cache_file(&app, &identity, true)?;
        if !cache.is_file() { fetch_chat(&app, &identity, &cache, true).await?; }
        let directory = request["outputDir"].as_str().filter(|path| !path.is_empty()).map(PathBuf::from)
            .unwrap_or_else(||app.path().video_dir().unwrap_or_else(|_| std::env::temp_dir()));
        std::fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
        let format = field(&request, "format", "json");
        let ext = if format == "txt" { "txt" } else { "json" };
        let base = safe_name(identity.rsplit('/').next().unwrap_or("twitch_chat").split('?').next().unwrap_or("twitch_chat"));
        let output = unique_output(&directory, &format!("{base}_chat"), ext);
        if ext == "json" { std::fs::copy(&cache, &output).map_err(|error| error.to_string())?; }
        else {
            let raw = std::fs::read_to_string(&cache).map_err(|error| error.to_string())?;
            let messages = parse_chat(&raw)?;
            let text = messages.iter().map(|message| format!("[{}] {}: {}", field(message,"timeLabel","0:00"), field(message,"username","unknown"), field(message,"body",""))).collect::<Vec<_>>().join("\n");
            std::fs::write(&output, text).map_err(|error| error.to_string())?;
        }
        Ok::<Value, String>(json!({"ok":true,"outputPath":output}))
    }.await;
    result.unwrap_or_else(|error| json!({"ok":false,"error":error}))
}

#[cfg(test)]
mod tests {
    use super::parse_url;
    #[test]
    fn parses_vod_clip_and_channel() {
        assert_eq!(parse_url("https://www.twitch.tv/videos/12345").unwrap()["type"],"vod");
        assert_eq!(parse_url("https://clips.twitch.tv/GreatClip").unwrap()["type"],"clip");
        assert_eq!(parse_url("https://www.twitch.tv/example").unwrap()["type"],"channel");
        assert!(parse_url("https://twitch.tv.evil.example/videos/123").is_err());
    }
}
