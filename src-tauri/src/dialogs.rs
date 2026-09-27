use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;

fn selected_path(path: tauri_plugin_dialog::FilePath) -> Result<String, String> {
    path.into_path()
        .map(|path| path.to_string_lossy().into_owned())
        .map_err(|error| error.to_string())
}

#[tauri::command]
pub async fn select_files(app: AppHandle) -> Result<Vec<String>, String> {
    app.dialog()
        .file()
        .blocking_pick_files()
        .unwrap_or_default()
        .into_iter()
        .map(selected_path)
        .collect()
}

#[tauri::command]
pub async fn select_folder(app: AppHandle) -> Result<Option<String>, String> {
    app.dialog().file().blocking_pick_folder().map(selected_path).transpose()
}

#[tauri::command]
pub async fn select_subtitle_file(app: AppHandle) -> Result<Option<String>, String> {
    app.dialog()
        .file()
        .add_filter("Subtitles", &["srt", "ass", "ssa", "vtt", "sub"])
        .blocking_pick_file()
        .map(selected_path)
        .transpose()
}

#[tauri::command]
pub async fn select_cookies_file(app: AppHandle) -> Result<Option<String>, String> {
    app.dialog()
        .file()
        .add_filter("Cookies", &["txt"])
        .blocking_pick_file()
        .map(selected_path)
        .transpose()
}
