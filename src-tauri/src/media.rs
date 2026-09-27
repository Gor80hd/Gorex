use base64::{engine::general_purpose::STANDARD, Engine};
use serde_json::{json, Value};
use std::sync::atomic::{AtomicBool, Ordering};
use tauri::{AppHandle, State};

use crate::tools::{locate, Tool};
use crate::extension::ExtensionState;
use std::sync::Arc;

#[derive(Default)]
pub struct MediaState {
    cancelled: AtomicBool,
}

fn fraction(value: Option<&str>) -> Option<String> {
    let (numerator, denominator) = value?.split_once('/')?;
    let value = numerator.parse::<f64>().ok()? / denominator.parse::<f64>().ok()?;
    if !value.is_finite() || value <= 0.0 {
        return None;
    }
    let formatted = format!("{value:.3}");
    Some(formatted.trim_end_matches('0').trim_end_matches('.').to_owned())
}

fn duration_label(seconds: f64) -> String {
    let total = seconds.max(0.0).floor() as u64;
    let hours = total / 3600;
    let minutes = (total % 3600) / 60;
    let seconds = total % 60;
    if hours > 0 {
        format!("{hours}:{minutes:02}:{seconds:02}")
    } else {
        format!("{minutes:02}:{seconds:02}")
    }
}

fn size_label(bytes: Option<f64>) -> String {
    match bytes.filter(|bytes| *bytes > 0.0) {
        None => "—".into(),
        Some(bytes) if bytes < 1024.0 * 1024.0 * 1024.0 => format!("{:.1} MB", bytes / 1024.0 / 1024.0),
        Some(bytes) => format!("{:.2} GB", bytes / 1024.0 / 1024.0 / 1024.0),
    }
}

fn channels_label(channels: Option<u64>) -> Option<String> {
    channels.map(|channels| match channels {
        1 => "Mono".into(),
        2 => "Stereo".into(),
        6 => "5.1".into(),
        8 => "7.1".into(),
        channels => format!("{channels}ch"),
    })
}

async fn metadata_for_file(app: &AppHandle, path: &str, id: usize) -> Result<Value, String> {
    let ffprobe = locate(app, Tool::Ffprobe)?;
    let output = tokio::process::Command::new(ffprobe)
        .args(["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", path])
        .output()
        .await
        .map_err(|error| error.to_string())?;
    if !output.status.success() {
        return Err(String::from_utf8_lossy(&output.stderr).into_owned());
    }
    let metadata: Value = serde_json::from_slice(&output.stdout).map_err(|error| error.to_string())?;
    let streams = metadata["streams"].as_array();
    let video = streams.and_then(|streams| streams.iter().find(|stream| stream["codec_type"] == "video"));
    let audio = streams.and_then(|streams| streams.iter().find(|stream| stream["codec_type"] == "audio"));
    let format = &metadata["format"];
    let duration = format["duration"].as_str().and_then(|value| value.parse::<f64>().ok()).unwrap_or(0.0);
    let bytes = format["size"].as_str().and_then(|value| value.parse::<f64>().ok());
    let bitrate = format["bit_rate"].as_str().and_then(|value| value.parse::<f64>().ok());
    let name = std::path::Path::new(path).file_name().and_then(|name| name.to_str()).unwrap_or(path);
    let title = std::path::Path::new(name).file_stem().and_then(|name| name.to_str()).unwrap_or(name);

    let thumbnail = match locate(app, Tool::Ffmpeg) {
        Ok(ffmpeg) => {
            let seek = (duration * 0.1).max(0.0).to_string();
            let image = tokio::process::Command::new(ffmpeg)
                .args(["-v", "error", "-ss", &seek, "-i", path, "-frames:v", "1", "-vf", "scale=320:-2", "-f", "image2pipe", "-vcodec", "mjpeg", "pipe:1"])
                .output()
                .await;
            image.ok().filter(|image| image.status.success() && !image.stdout.is_empty())
                .map(|image| format!("data:image/jpeg;base64,{}", STANDARD.encode(image.stdout)))
        }
        Err(_) => None,
    };

    let resolution = video.and_then(|stream| Some(format!("{}x{}", stream["width"].as_u64()?, stream["height"].as_u64()?)));
    let bitrate = bitrate.map(|bitrate| {
        let kbps = (bitrate / 1000.0).round();
        if kbps >= 1000.0 { format!("{:.1} Mbps", kbps / 1000.0) } else { format!("{kbps:.0} kbps") }
    });

    Ok(json!({
        "id": id,
        "title": title,
        "outputName": title,
        "container": std::path::Path::new(name).extension().and_then(|ext| ext.to_str()).map(str::to_uppercase),
        "path": path,
        "duration": duration_label(duration),
        "durationSecs": duration,
        "resolution": resolution,
        "videoCodec": video.and_then(|stream| stream["codec_name"].as_str()).map(str::to_uppercase),
        "fps": fraction(video.and_then(|stream| stream["r_frame_rate"].as_str())),
        "audioCodec": audio.and_then(|stream| stream["codec_name"].as_str()).map(str::to_uppercase),
        "channels": channels_label(audio.and_then(|stream| stream["channels"].as_u64())),
        "bitrate": bitrate,
        "size": size_label(bytes),
        "thumbnail": thumbnail,
    }))
}

#[tauri::command]
pub async fn get_video_data(app: AppHandle, state: State<'_, MediaState>, extension: State<'_, Arc<ExtensionState>>, file_paths: Vec<String>) -> Result<Option<Vec<Value>>, String> {
    state.cancelled.store(false, Ordering::SeqCst);
    let mut videos = Vec::new();
    for (id, path) in file_paths.iter().enumerate() {
        if state.cancelled.load(Ordering::SeqCst) {
            return Ok(None);
        }
        match metadata_for_file(&app, path, id).await {
            Ok(mut video) => {
                video["previewUrl"] = extension.register_media(std::path::PathBuf::from(path)).into();
                videos.push(video);
            },
            Err(error) => log::warn!("Failed to probe media {}: {}", path, error),
        }
    }
    if state.cancelled.load(Ordering::SeqCst) { Ok(None) } else { Ok(Some(videos)) }
}

#[tauri::command]
pub fn cancel_video_data(state: State<'_, MediaState>) {
    state.cancelled.store(true, Ordering::SeqCst);
}

#[cfg(test)]
mod tests {
    use super::{duration_label, fraction, size_label};

    #[test]
    fn metadata_labels_match_queue_contract() {
        assert_eq!(duration_label(3671.9), "1:01:11");
        assert_eq!(fraction(Some("30000/1001")), Some("29.97".into()));
        assert_eq!(size_label(None), "—");
    }
}
