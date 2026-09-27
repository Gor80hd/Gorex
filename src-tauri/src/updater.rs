use std::{path::{Path, PathBuf}, sync::atomic::{AtomicBool, Ordering}};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use tauri::{AppHandle, Emitter, Manager};
use crate::tools::{locate, Tool};

static YTDLP_UPDATING: AtomicBool = AtomicBool::new(false);
static TWITCH_UPDATING: AtomicBool = AtomicBool::new(false);

#[derive(Clone, Copy)]
enum Kind { Ytdlp, Twitch }

impl Kind {
    fn repository(self) -> &'static str {
        match self { Kind::Ytdlp => "yt-dlp/yt-dlp", Kind::Twitch => "lay295/TwitchDownloader" }
    }
    fn asset_name(self) -> &'static str {
        match self {
            Kind::Ytdlp if cfg!(windows) => "yt-dlp.exe",
            Kind::Ytdlp => "yt-dlp_macos",
            Kind::Twitch if cfg!(windows) => "-Windows-x64.zip",
            Kind::Twitch => "-MacOSArm64.zip",
        }
    }
    fn binary_name(self) -> &'static str {
        match self {
            Kind::Ytdlp if cfg!(windows) => "yt-dlp.exe",
            Kind::Ytdlp => "yt-dlp",
            Kind::Twitch if cfg!(windows) => "TwitchDownloaderCLI.exe",
            Kind::Twitch => "TwitchDownloaderCLI",
        }
    }
    fn folder(self) -> &'static str { match self { Kind::Ytdlp => "ytdlp", Kind::Twitch => "twitch" } }
    fn progress_event(self) -> &'static str { match self { Kind::Ytdlp => "ytdl-update-progress", Kind::Twitch => "twitch-update-progress" } }
    fn guard(self) -> &'static AtomicBool { match self { Kind::Ytdlp => &YTDLP_UPDATING, Kind::Twitch => &TWITCH_UPDATING } }
}

async fn curl(app: &AppHandle, url: &str, output: Option<&Path>) -> Result<Vec<u8>, String> {
    let mut command = tokio::process::Command::new("curl");
    command.args(["--fail", "--silent", "--show-error", "--location", "--retry", "3", "--max-time", "120", "--user-agent", &format!("Gorex-App/{}", app.package_info().version)]);
    if let Some(path) = output { command.arg("--output").arg(path); }
    let result = command.arg(url).output().await.map_err(|error| error.to_string())?;
    if !result.status.success() { return Err(String::from_utf8_lossy(&result.stderr).trim().to_owned()); }
    Ok(result.stdout)
}

async fn latest(app: &AppHandle, kind: Kind) -> Result<Value, String> {
    let url = format!("https://api.github.com/repos/{}/releases/latest", kind.repository());
    let release: Value = serde_json::from_slice(&curl(app, &url, None).await?).map_err(|error| error.to_string())?;
    let asset = release["assets"].as_array().and_then(|assets| assets.iter().find(|asset| {
        let name = asset["name"].as_str().unwrap_or("");
        if matches!(kind, Kind::Twitch) { name.ends_with(kind.asset_name()) } else { name == kind.asset_name() }
    })).ok_or_else(|| format!("{} is missing from the latest release", kind.asset_name()))?;
    let tag = release["tag_name"].as_str().unwrap_or("");
    Ok(json!({
        "latestVersion": tag.trim_start_matches('v'),
        "downloadUrl": asset["browser_download_url"],
        "sha256": asset["digest"].as_str().unwrap_or("").strip_prefix("sha256:").unwrap_or(""),
        "releaseUrl": release["html_url"],
        "publishedAt": release["published_at"],
        "releaseName": release["name"],
        "body": release["body"],
    }))
}

#[tauri::command]
pub async fn get_ytdl_latest_info(app: AppHandle) -> Result<Value, String> { latest(&app, Kind::Ytdlp).await }

#[tauri::command]
pub async fn get_twitch_latest_info(app: AppHandle) -> Result<Value, String> { latest(&app, Kind::Twitch).await }

fn report(app: &AppHandle, kind: Kind, stage: &str, percent: Option<u8>) {
    let _ = app.emit(kind.progress_event(), json!({"stage":stage,"percent":percent}));
}

fn hash(path: &Path) -> Result<String, String> {
    use std::io::Read;
    let mut file = std::fs::File::open(path).map_err(|error| error.to_string())?;
    let mut hasher = Sha256::new();
    let mut chunk = [0_u8; 64 * 1024];
    loop {
        let count = file.read(&mut chunk).map_err(|error| error.to_string())?;
        if count == 0 { break; }
        hasher.update(&chunk[..count]);
    }
    Ok(format!("{:x}", hasher.finalize()))
}

fn find_binary(root: &Path, name: &str) -> Result<PathBuf, String> {
    let mut pending = vec![root.to_path_buf()];
    while let Some(directory) = pending.pop() {
        for entry in std::fs::read_dir(&directory).map_err(|error| error.to_string())? {
            let entry = entry.map_err(|error| error.to_string())?;
            let file_type = entry.file_type().map_err(|error| error.to_string())?;
            if file_type.is_dir() { pending.push(entry.path()); }
            else if file_type.is_file() && entry.file_name() == name { return Ok(entry.path()); }
        }
    }
    Err(format!("{name} not found in release archive"))
}

async fn version(app: &AppHandle, kind: Kind, path: &Path) -> Result<String, String> {
    let mut command = tokio::process::Command::new(path);
    if matches!(kind, Kind::Twitch) { command.env("DOTNET_BUNDLE_EXTRACT_BASE_DIR", crate::tools::twitch_extract_dir(app)?); }
    let output = command.arg("--version").output().await.map_err(|error| error.to_string())?;
    let text = if output.stdout.is_empty() { String::from_utf8_lossy(&output.stderr) } else { String::from_utf8_lossy(&output.stdout) };
    if !output.status.success() && !(matches!(kind, Kind::Twitch) && text.starts_with("TwitchDownloaderCLI ")) {
        return Err(String::from_utf8_lossy(&output.stderr).trim().to_owned());
    }
    let first = text.lines().next().unwrap_or("").trim();
    Ok(if matches!(kind, Kind::Twitch) { first.split_whitespace().nth(1).unwrap_or("").split('+').next().unwrap_or("").to_owned() } else { first.to_owned() })
}

async fn install(app: &AppHandle, kind: Kind) -> Result<Value, String> {
    if kind.guard().swap(true, Ordering::SeqCst) { return Err("Обновление уже выполняется".into()); }
    let result = install_inner(app, kind).await;
    kind.guard().store(false, Ordering::SeqCst);
    if result.is_err() { report(app, kind, "error", None); }
    result
}

async fn install_inner(app: &AppHandle, kind: Kind) -> Result<Value, String> {
    report(app, kind, "preparing", Some(0));
    let info = latest(app, kind).await?;
    let url = info["downloadUrl"].as_str().ok_or("Release has no download URL")?;
    let digest = info["sha256"].as_str().filter(|digest| digest.len() == 64).ok_or("GitHub release has no SHA256 digest")?;
    let root = app.path().app_data_dir().map_err(|error| error.to_string())?.join("tools").join(kind.folder());
    std::fs::create_dir_all(&root).map_err(|error| error.to_string())?;
    let scratch = root.join(format!("staging-{}", uuid::Uuid::new_v4()));
    std::fs::create_dir_all(&scratch).map_err(|error| error.to_string())?;
    let result = async {
        let archive = scratch.join(kind.asset_name());
        report(app, kind, "connecting", Some(5));
        curl(app, url, Some(&archive)).await?;
        report(app, kind, "downloaded", Some(84));
        if hash(&archive)? != digest.to_ascii_lowercase() { return Err("SHA256 mismatch for downloaded tool".into()); }
        report(app, kind, "verifying", Some(88));
        let candidate = if matches!(kind, Kind::Twitch) {
            let status = tokio::process::Command::new("tar").args(["-xf"]).arg(&archive).arg("-C").arg(&scratch).status().await.map_err(|error| error.to_string())?;
            if !status.success() { return Err("Could not unpack TwitchDownloaderCLI".into()); }
            find_binary(&scratch, kind.binary_name())?
        } else { archive };
        #[cfg(unix)] {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(&candidate, std::fs::Permissions::from_mode(0o755)).map_err(|error| error.to_string())?;
        }
        let checked = version(app, kind, &candidate).await?;
        if checked.is_empty() { return Err("Updated tool did not report its version".into()); }
        let staged = scratch.join(kind.binary_name());
        if staged != candidate { std::fs::copy(&candidate, &staged).map_err(|error| error.to_string())?; }
        let current = root.join("current");
        let backup = root.join("previous");
        let pending = root.join("pending");
        std::fs::create_dir_all(&pending).map_err(|error| error.to_string())?;
        std::fs::copy(&staged, pending.join(kind.binary_name())).map_err(|error| error.to_string())?;
        #[cfg(unix)] {
            use std::os::unix::fs::PermissionsExt;
            std::fs::set_permissions(pending.join(kind.binary_name()), std::fs::Permissions::from_mode(0o755)).map_err(|error| error.to_string())?;
        }
        report(app, kind, "installing", Some(96));
        if backup.exists() { std::fs::remove_dir_all(&backup).map_err(|error| error.to_string())?; }
        if current.exists() { std::fs::rename(&current, &backup).map_err(|error| error.to_string())?; }
        if let Err(error) = std::fs::rename(&pending, &current) {
            if backup.exists() { let _ = std::fs::rename(&backup, &current); }
            return Err(error.to_string());
        }
        report(app, kind, "done", Some(100));
        let active = locate(app, if matches!(kind, Kind::Ytdlp) { Tool::Ytdlp } else { Tool::Twitch })?;
        Ok(json!({"found":true,"version":checked,"path":active,"source":"user","latest":info}))
    }.await;
    let _ = std::fs::remove_dir_all(&scratch);
    result
}

#[tauri::command]
pub async fn update_ytdl(app: AppHandle) -> Value {
    match install(&app, Kind::Ytdlp).await { Ok(info) => json!({"ok":true,"info":info}), Err(error) => json!({"ok":false,"error":error}) }
}

#[tauri::command]
pub async fn update_twitch(app: AppHandle) -> Value {
    match install(&app, Kind::Twitch).await { Ok(info) => json!({"ok":true,"info":info}), Err(error) => json!({"ok":false,"error":error}) }
}

fn version_tuple(version: &str) -> [u64; 3] {
    let mut parts = version.trim_start_matches('v').split('.').map(|part| part.parse().unwrap_or(0));
    [parts.next().unwrap_or(0), parts.next().unwrap_or(0), parts.next().unwrap_or(0)]
}

#[tauri::command]
pub async fn check_for_updates(app: AppHandle, options: Value) -> Option<Value> {
    let manual = options["manual"].as_bool().unwrap_or(false);
    let current = app.package_info().version.to_string();
    let result = async {
        let data: Value = serde_json::from_slice(&curl(&app, "https://api.github.com/repos/Gor80hd/Gorex/releases/latest", None).await?)
            .map_err(|error| error.to_string())?;
        let latest = data["tag_name"].as_str().unwrap_or("").trim_start_matches('v');
        if latest.is_empty() { return Err("GitHub did not report a release version".to_owned()); }
        let available = version_tuple(latest) > version_tuple(&current);
        let release_url = data["html_url"].as_str().filter(|url| url.starts_with("https://github.com/Gor80hd/Gorex/")).unwrap_or("https://github.com/Gor80hd/Gorex/releases/latest");
        if manual { Ok(Some(json!({"ok":true,"updateAvailable":available,"currentVersion":current,"latestVersion":latest,"downloadUrl":release_url}))) }
        else if available { Ok(Some(json!({"latestVersion":latest,"downloadUrl":release_url}))) }
        else { Ok(None) }
    }.await;
    match result { Ok(value) => value, Err(error) if manual => Some(json!({"ok":false,"error":error,"currentVersion":current})), Err(_) => None }
}

#[cfg(test)]
mod tests {
    use super::version_tuple;
    #[test]
    fn compares_app_versions_numerically() {
        assert!(version_tuple("3.0.0") > version_tuple("2.15.0"));
        assert_eq!(version_tuple("v3.0.0"), [3, 0, 0]);
    }
}
