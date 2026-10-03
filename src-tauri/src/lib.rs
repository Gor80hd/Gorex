mod auth;
mod dialogs;
mod downloads;
mod encoding;
mod extension;
mod jobs;
mod media;
mod platform;
mod player;
mod queue;
mod settings;
mod tools;
mod twitch;
mod updater;
mod workspace;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let extension_state = std::sync::Arc::new(extension::ExtensionState::default());
    let jobs = std::sync::Arc::new(jobs::Jobs::default());
    let player_state = std::sync::Arc::new(player::PlayerState::default());
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(media::MediaState::default())
        .manage(downloads::FormatFetchState::default())
        .manage(extension_state)
        .manage(jobs)
        .manage(std::sync::Arc::new(queue::Queue::default()))
        .manage(player_state)
        .invoke_handler(tauri::generate_handler![
            settings::get_app_settings,
            settings::save_app_settings,
            settings::save_renderer_storage,
            settings::clear_all_settings,
            settings::get_default_output_dir,
            settings::get_app_version,
            dialogs::select_files,
            dialogs::select_folder,
            dialogs::select_subtitle_file,
            dialogs::select_cookies_file,
            tools::check_cli,
            media::get_video_data,
            media::cancel_video_data,
            platform::get_gpu_info,
            platform::window_minimize,
            platform::window_maximize,
            platform::window_close,
            platform::app_quit,
            platform::relaunch_app,
            platform::set_background_mode,
            platform::update_native_menu,
            platform::open_devtools,
            platform::open_external,
            platform::open_output_location,
            platform::open_temp_folder,
            platform::clear_temp_folder,
            updater::check_for_updates,
            extension::extension_update_queue,
            player::get_youtube_player_url,
            encoding::run_cli,
            queue::start_queue,
            queue::get_queue_state,
            queue::remove_queue_items,
            jobs::stop_all,
            jobs::pause_all,
            jobs::resume_all,
            downloads::ytdl_get_formats,
            downloads::ytdl_cancel_fetch,
            downloads::ytdl_run,
            downloads::get_ytdl_info,
            updater::get_ytdl_latest_info,
            updater::update_ytdl,
            updater::get_twitch_latest_info,
            updater::update_twitch,
            auth::open_youtube_login_window,
            auth::get_youtube_auth_status,
            auth::export_youtube_cookies,
            auth::clear_youtube_auth,
            twitch::twitch_resolve_url,
            twitch::twitch_get_channel_videos,
            twitch::twitch_run,
            twitch::get_twitch_info,
            twitch::twitch_download_chat,
            twitch::twitch_export_chat,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            let handle = app.handle().clone();
            platform::setup_tray(&handle)?;
            let state = app
                .state::<std::sync::Arc<extension::ExtensionState>>()
                .inner()
                .clone();
            tauri::async_runtime::spawn(async move {
                if let Err(error) = extension::start(handle, state).await {
                    log::error!("Extension API failed: {error}");
                }
            });
            let player_state = app
                .state::<std::sync::Arc<player::PlayerState>>()
                .inner()
                .clone();
            tauri::async_runtime::spawn(async move {
                if let Err(error) = player::start(player_state).await {
                    log::error!("YouTube player failed: {error}");
                }
            });
            Ok(())
        })
        .on_menu_event(|app, event| platform::handle_menu(app, event.id().as_ref()))
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                if let Ok(settings) = settings::get_app_settings(window.app_handle().clone()) {
                    if settings["backgroundMode"] == true {
                        api.prevent_close();
                        let _ = window.hide();
                    }
                }
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run({
            let exiting = std::sync::Arc::new(std::sync::atomic::AtomicBool::new(false));
            move |app, event| {
                if let tauri::RunEvent::ExitRequested { api, code, .. } = event {
                    if code != Some(tauri::RESTART_EXIT_CODE)
                        && !exiting.swap(true, std::sync::atomic::Ordering::SeqCst)
                    {
                        api.prevent_exit();
                        let app = app.clone();
                        tauri::async_runtime::spawn(async move {
                            jobs::shutdown(app.clone()).await;
                            app.exit(code.unwrap_or(0));
                        });
                    }
                }
            }
        });
}
