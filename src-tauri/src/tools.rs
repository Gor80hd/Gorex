use std::path::PathBuf;
use tauri::{AppHandle, Manager};

#[derive(Clone, Copy)]
pub enum Tool {
    Ffmpeg,
    Ffprobe,
    Ytdlp,
    Deno,
    Twitch,
}

impl Tool {
    fn file_name(self) -> &'static str {
        match self {
            Tool::Ffmpeg => if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" },
            Tool::Ffprobe => if cfg!(windows) { "ffprobe.exe" } else { "ffprobe" },
            Tool::Ytdlp => if cfg!(windows) { "yt-dlp.exe" } else { "yt-dlp" },
            Tool::Deno => if cfg!(windows) { "deno.exe" } else { "deno" },
            Tool::Twitch => if cfg!(windows) { "TwitchDownloaderCLI.exe" } else { "TwitchDownloaderCLI" },
        }
    }

    fn development_path(self) -> PathBuf {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..");
        match self {
            Tool::Ffmpeg => root.join("node_modules/ffmpeg-static").join(self.file_name()),
            Tool::Ffprobe => root.join("node_modules/@derhuerst/ffprobe-static").join(self.file_name()),
            Tool::Ytdlp => root.join("resources/ytdl").join(if cfg!(windows) { "yt-dlp.exe" } else { "yt-dlp_macos" }),
            Tool::Deno => root.join("src-tauri/binaries").join(self.file_name()),
            Tool::Twitch => root.join("src-tauri/binaries/twitch").join(self.file_name()),
        }
    }
}

pub fn locate(app: &AppHandle, tool: Tool) -> Result<PathBuf, String> {
    if matches!(tool, Tool::Ytdlp | Tool::Twitch) {
        if let Ok(data_dir) = app.path().app_data_dir() {
            let user_path = data_dir.join("tools").join(if matches!(tool, Tool::Twitch) { "twitch" } else { "ytdlp" }).join("current").join(tool.file_name());
            if user_path.is_file() { return Ok(user_path); }
        }
    }
    if let Ok(resource_dir) = app.path().resource_dir() {
        let path = resource_dir.join("binaries").join(if matches!(tool, Tool::Twitch) { "twitch" } else { "" }).join(tool.file_name());
        if path.is_file() {
            return Ok(path);
        }
    }
    let development = tool.development_path();
    if development.is_file() {
        return Ok(development);
    }
    Err(format!("{} is not bundled with Gorex", tool.file_name()))
}

pub fn twitch_extract_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app.path().app_cache_dir().map_err(|error| error.to_string())?.join("twitch-runtime");
    std::fs::create_dir_all(&path).map_err(|error| error.to_string())?;
    Ok(path)
}

#[tauri::command]
pub async fn check_cli(app: AppHandle) -> serde_json::Value {
    match locate(&app, Tool::Ffmpeg) {
        Ok(path) => match tokio::process::Command::new(&path).arg("-version").output().await {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let version = stdout.lines().next().unwrap_or("unknown").trim();
                serde_json::json!({"found": true, "version": version, "path": path})
            }
            Err(_) => serde_json::json!({"found": false, "version": null, "path": path}),
        },
        Err(error) => serde_json::json!({"found": false, "version": null, "path": error}),
    }
}
