use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager, WebviewWindow};
use tauri::menu::{Menu, MenuItem, Submenu};
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButtonState};
use std::path::{Path, PathBuf};

fn gpu_vendor(name: &str) -> &'static str {
    let name = name.to_ascii_lowercase();
    if name.contains("nvidia") { "nvidia" }
    else if name.contains("amd") || name.contains("radeon") { "amd" }
    else if name.contains("intel") { "intel" }
    else if name.contains("apple") { "apple" }
    else { "unknown" }
}

#[tauri::command]
pub async fn get_gpu_info() -> Value {
    #[cfg(target_os = "macos")]
    let names = vec!["Apple GPU".to_owned()];
    #[cfg(target_os = "windows")]
    let names = match tokio::time::timeout(std::time::Duration::from_secs(8),
        tokio::process::Command::new("powershell.exe")
            .args(["-NoProfile", "-NonInteractive", "-Command", "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"])
            .output()).await {
        Ok(Ok(output)) if output.status.success() => String::from_utf8_lossy(&output.stdout).lines().map(str::trim).filter(|name| !name.is_empty()).map(str::to_owned).collect(),
        _ => Vec::new(),
    };
    let primary = names.iter().max_by_key(|name| match gpu_vendor(name) { "apple" => 4, "nvidia" => 3, "amd" => 2, "intel" => 1, _ => 0 });
    let vendor = primary.map(|name| gpu_vendor(name)).unwrap_or("unknown");
    let acceleration_vendor = if cfg!(target_os = "macos") { "apple" } else { vendor };
    json!({"gpus":names,"vendor":vendor,"accelerationVendor":acceleration_vendor,
        "platform":if cfg!(target_os = "macos") { "darwin" } else { "win32" },"primaryGpu":primary})
}

#[tauri::command]
pub fn window_minimize(window: WebviewWindow) -> Result<(), String> {
    window.minimize().map_err(|error| error.to_string())
}

#[tauri::command]
pub fn window_maximize(window: WebviewWindow) -> Result<(), String> {
    if window.is_maximized().map_err(|error| error.to_string())? {
        window.unmaximize().map_err(|error| error.to_string())
    } else {
        window.maximize().map_err(|error| error.to_string())
    }
}

#[tauri::command]
pub fn window_close(window: WebviewWindow) -> Result<(), String> {
    let settings = crate::settings::get_app_settings(window.app_handle().clone())?;
    if settings["backgroundMode"].as_bool().unwrap_or(false) {
        window.hide().map_err(|error| error.to_string())
    } else {
        window.close().map_err(|error| error.to_string())
    }
}

#[tauri::command]
pub fn app_quit(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
pub async fn relaunch_app(app: AppHandle) {
    crate::jobs::shutdown(app.clone()).await;
    app.restart();
}

#[tauri::command]
pub fn set_background_mode(app: AppHandle, enabled: bool) -> Result<(), String> {
    let mut settings = crate::settings::get_app_settings(app.clone())?;
    settings["backgroundMode"] = Value::Bool(enabled);
    crate::settings::save_app_settings(app, settings)
}

#[tauri::command]
pub fn update_native_menu(app: AppHandle, state: Value) -> Result<(), String> {
    if !cfg!(target_os = "macos") { return Ok(()); }
    let labels = &state["labels"];
    let label = |key: &str, fallback: &str| labels[key].as_str().unwrap_or(fallback).to_owned();
    let has_videos = state["hasVideos"].as_bool().unwrap_or(false);
    let encoding = state["isEncoding"].as_bool().unwrap_or(false);
    let items = [
        ("open-source", "openSource", "Открыть файл", true, Some("Cmd+O")),
        ("clear-queue", "clearQueue", "Очистить очередь", has_videos && !encoding, None),
        ("start-encoding", "startEncoding", "Начать", has_videos && !encoding, None),
        ("toggle-pause", if state["isPaused"] == true { "resume" } else { "pause" }, "Пауза", encoding, None),
        ("stop", "stop", "Остановить", encoding, None),
        ("debug-console", "debugConsole", "Консоль", true, None),
    ];
    let file_items = items.iter().map(|(id, key, fallback, enabled, accelerator)|
        MenuItem::with_id(&app, *id, label(key, fallback), *enabled, *accelerator).map_err(|error| error.to_string())
    ).collect::<Result<Vec<_>,_>>()?;
    let file_refs = file_items.iter().map(|item| item as &dyn tauri::menu::IsMenuItem<_>).collect::<Vec<_>>();
    let file = Submenu::with_items(&app, label("file", "Файл"), true, &file_refs).map_err(|error| error.to_string())?;
    let settings = MenuItem::with_id(&app, "settings", label("settings", "Настройки"), true, Some("Cmd+," )).map_err(|error| error.to_string())?;
    let about = MenuItem::with_id(&app, "about", label("about", "О Gorex"), true, None::<&str>).map_err(|error| error.to_string())?;
    let quit = MenuItem::with_id(&app, "quit", label("exit", "Выход"), true, Some("Cmd+Q")).map_err(|error| error.to_string())?;
    let app_menu = Submenu::with_items(&app, "Gorex", true, &[&quit]).map_err(|error| error.to_string())?;
    let settings_menu = Submenu::with_items(&app, label("settings", "Настройки"), true, &[&settings]).map_err(|error| error.to_string())?;
    let about_menu = Submenu::with_items(&app, label("about", "О программе"), true, &[&about]).map_err(|error| error.to_string())?;
    let menu = Menu::with_items(&app, &[&app_menu, &file, &settings_menu, &about_menu]).map_err(|error| error.to_string())?;
    app.set_menu(menu).map_err(|error| error.to_string())?;
    Ok(())
}

pub fn setup_tray(app: &AppHandle) -> Result<(), String> {
    let show = MenuItem::with_id(app, "tray-show", "Показать Gorex", true, None::<&str>).map_err(|error| error.to_string())?;
    let quit = MenuItem::with_id(app, "quit", "Выход", true, None::<&str>).map_err(|error| error.to_string())?;
    let menu = Menu::with_items(app, &[&show, &quit]).map_err(|error| error.to_string())?;
    let mut builder = TrayIconBuilder::new().menu(&menu).tooltip("Gorex").on_tray_icon_event(|tray, event| {
        if let TrayIconEvent::Click { button_state: MouseButtonState::Up, .. } = event {
            if let Some(window) = tray.app_handle().get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    });
    if let Some(icon) = app.default_window_icon() { builder = builder.icon(icon.clone()); }
    #[cfg(target_os = "macos")]
    { builder = builder.icon_as_template(true); }
    builder.build(app).map_err(|error| error.to_string())?;
    Ok(())
}

pub fn handle_menu(app: &AppHandle, id: &str) {
    match id {
        "quit" => app.exit(0),
        "tray-show" => { if let Some(window) = app.get_webview_window("main") { let _ = window.show(); let _ = window.set_focus(); } },
        id => { let _ = app.emit("native-menu-action", id); },
    }
}

#[tauri::command]
pub fn open_devtools(window: WebviewWindow) {
    #[cfg(debug_assertions)]
    window.open_devtools();
    #[cfg(not(debug_assertions))]
    let _ = window;
}

fn open_target(target: &str, select: bool) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    let status = {
        let mut command = std::process::Command::new("open");
        if select { command.arg("-R"); }
        command.arg(target).status()
    };
    #[cfg(target_os = "windows")]
    let status = {
        let mut command = std::process::Command::new("explorer.exe");
        if select { command.arg(format!("/select,{target}")); } else { command.arg(target); }
        command.status()
    };
    status.map_err(|error| error.to_string()).and_then(|status| if status.success() { Ok(()) } else { Err(format!("Could not open: {status}")) })
}

#[tauri::command]
pub fn open_external(url: String) -> Result<(), String> {
    let parsed = url::Url::parse(&url).map_err(|error| error.to_string())?;
    if !matches!(parsed.scheme(), "http" | "https" | "mailto") {
        return Err("Only web and email links can be opened".into());
    }
    open_target(&url, false)
}

#[tauri::command]
pub fn open_output_location(output_path: String) -> Result<(), String> {
    let path = Path::new(&output_path);
    if !path.exists() { return Err("Output file does not exist".into()); }
    open_target(&output_path, true)
}

pub fn temp_download_dir() -> PathBuf { std::env::temp_dir().join("gorex-downloads") }

#[tauri::command]
pub fn open_temp_folder() -> Result<(), String> {
    let path = temp_download_dir();
    std::fs::create_dir_all(&path).map_err(|error| error.to_string())?;
    open_target(&path.to_string_lossy(), false)
}

#[tauri::command]
pub fn clear_temp_folder() -> Result<(), String> {
    let path = temp_download_dir();
    match std::fs::remove_dir_all(&path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}
