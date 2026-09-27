use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};
use std::{fs, path::PathBuf};
use tauri::{AppHandle, Manager};

const SETTINGS_VERSION: u32 = 1;
static SETTINGS_WRITE_LOCK: std::sync::Mutex<()> = std::sync::Mutex::new(());

#[derive(Serialize, Deserialize)]
struct StoredSettings {
    version: u32,
    settings: Value,
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_config_dir()
        .map(|dir| dir.join("gorex-settings.json"))
        .map_err(|error| error.to_string())
}

fn read_settings(app: &AppHandle) -> Result<Value, String> {
    let path = settings_path(app)?;
    let content = match fs::read_to_string(path) {
        Ok(content) => content,
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => {
            return Ok(Value::Object(Map::new()));
        }
        Err(error) => return Err(error.to_string()),
    };
    let stored: StoredSettings = serde_json::from_str(&content).map_err(|error| error.to_string())?;
    if stored.version != SETTINGS_VERSION || !stored.settings.is_object() {
        return Err("Unsupported Gorex settings format".into());
    }
    Ok(stored.settings)
}

#[tauri::command]
pub fn get_app_settings(app: AppHandle) -> Result<Value, String> {
    read_settings(&app)
}

#[tauri::command]
pub fn save_app_settings(app: AppHandle, settings: Value) -> Result<(), String> {
    if !settings.is_object() {
        return Err("Settings must be an object".into());
    }
    let _write = SETTINGS_WRITE_LOCK.lock().map_err(|error| error.to_string())?;
    let path = settings_path(&app)?;
    let parent = path.parent().ok_or("Settings path has no parent")?;
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    let temporary = path.with_extension("json.tmp");
    let mut merged = read_settings(&app)?;
    if let (Some(current), Some(update)) = (merged.as_object_mut(), settings.as_object()) {
        for (key, value) in update { current.insert(key.clone(), value.clone()); }
    }
    let stored = StoredSettings { version: SETTINGS_VERSION, settings: merged };
    let bytes = serde_json::to_vec_pretty(&stored).map_err(|error| error.to_string())?;
    fs::write(&temporary, bytes).map_err(|error| error.to_string())?;
    fs::rename(&temporary, path).map_err(|error| error.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn save_renderer_storage(app: AppHandle, entries: Value) -> Result<(), String> {
    if !entries.is_object() { return Err("Renderer storage must be an object".into()); }
    save_app_settings(app, serde_json::json!({"__rendererStorage": entries}))
}

#[tauri::command]
pub fn clear_all_settings(app: AppHandle) -> Result<(), String> {
    let _write = SETTINGS_WRITE_LOCK.lock().map_err(|error| error.to_string())?;
    let path = settings_path(&app)?;
    match fs::remove_file(path) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.to_string()),
    }
}

#[tauri::command]
pub fn get_default_output_dir(app: AppHandle) -> Result<String, String> {
    let settings = read_settings(&app)?;
    if let Some(path) = settings.get("defaultOutputDir").and_then(Value::as_str) {
        if !path.trim().is_empty() {
            return Ok(path.to_owned());
        }
    }
    let videos = app.path().video_dir().map_err(|error| error.to_string())?;
    Ok(videos.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn get_app_version(app: AppHandle) -> String {
    app.package_info().version.to_string()
}

#[cfg(test)]
mod tests {
    use super::{StoredSettings, SETTINGS_VERSION};
    use serde_json::json;

    #[test]
    fn settings_file_is_explicitly_versioned() {
        let stored = StoredSettings { version: SETTINGS_VERSION, settings: json!({"backgroundMode": true}) };
        let value = serde_json::to_value(stored).unwrap();
        assert_eq!(value["version"], 1);
        assert_eq!(value["settings"]["backgroundMode"], true);
    }
}
