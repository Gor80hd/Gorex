use crate::{
    jobs::{self, Jobs, RunOutcome, RunSpec},
    tools::{locate, Tool},
};
use serde_json::{json, Value};
use std::{
    path::{Path, PathBuf},
    sync::Arc,
};
use tauri::{AppHandle, Emitter, Manager, State};

fn string<'a>(value: &'a Value, key: &str, fallback: &'a str) -> &'a str {
    value
        .get(key)
        .and_then(Value::as_str)
        .filter(|s| !s.is_empty())
        .unwrap_or(fallback)
}
fn flag(value: &Value, key: &str) -> bool {
    value.get(key).and_then(Value::as_bool).unwrap_or(false)
}
fn argument(args: &mut Vec<String>, name: &str, value: impl ToString) {
    args.push(name.into());
    args.push(value.to_string());
}

pub fn output_extension(format: &str) -> &'static str {
    match format {
        "av_mkv" => "mkv",
        "av_webm" => "webm",
        "av_mov" => "mov",
        "av_avi" => "avi",
        "av_flv" => "flv",
        "av_ts" => "ts",
        "av_ogg" | "audio_ogg" => "ogg",
        "av_3gp" => "3gp",
        "audio_mp3" => "mp3",
        "audio_m4a" => "m4a",
        "audio_flac" => "flac",
        "audio_wav" => "wav",
        "audio_opus" => "opus",
        _ => "mp4",
    }
}

fn container(format: &str) -> &'static str {
    match format {
        "av_mkv" => "matroska",
        "av_ts" => "mpegts",
        "audio_m4a" => "ipod",
        _ => output_extension(format),
    }
}

fn video_codec(encoder: &str) -> &'static str {
    match encoder {
        "x264" | "x264_10bit" => "libx264",
        "x265" | "x265_10bit" | "x265_12bit" => "libx265",
        "svt_av1" | "svt_av1_10bit" => "libsvtav1",
        "vp8" => "libvpx",
        "vp9" | "vp9_10bit" => "libvpx-vp9",
        "nvenc_h264" => "h264_nvenc",
        "nvenc_h265" => "hevc_nvenc",
        "nvenc_av1" => "av1_nvenc",
        "qsv_h264" => "h264_qsv",
        "qsv_h265" => "hevc_qsv",
        "qsv_av1" => "av1_qsv",
        "vce_h264" => "h264_amf",
        "vce_h265" => "hevc_amf",
        "vce_av1" => "av1_amf",
        "mf_h264" => "h264_mf",
        "mf_h265" => "hevc_mf",
        "vt_h264" => "h264_videotoolbox",
        "vt_h265" => "hevc_videotoolbox",
        "theora" => "libtheora",
        "libaom_av1" => "libaom-av1",
        "flv1" => "flv",
        "prores_ks" => "prores_ks",
        "mpeg4" => "mpeg4",
        "mpeg2video" => "mpeg2video",
        "mpeg1video" => "mpeg1video",
        "dnxhd" => "dnxhd",
        "ffv1" => "ffv1",
        "huffyuv" => "huffyuv",
        "mjpeg" => "mjpeg",
        "wmv2" => "wmv2",
        "wmv1" => "wmv1",
        "h263" => "h263",
        "h263p" => "h263p",
        _ => "libx265",
    }
}

fn audio_codec(codec: &str) -> &'static str {
    match codec {
        "mp3" => "libmp3lame",
        "ac3" => "ac3",
        "eac3" => "eac3",
        "vorbis" => "libvorbis",
        "flac16" | "flac24" => "flac",
        "opus" => "libopus",
        "alac" => "alac",
        "pcm_s16le" => "pcm_s16le",
        "pcm_s24le" => "pcm_s24le",
        "pcm_f32le" => "pcm_f32le",
        "mp2" => "mp2",
        "wmav2" => "wmav2",
        "fdk_aac" | "fdk_haac" => "libfdk_aac",
        _ => "aac",
    }
}

fn quality(encoder: &str, settings: &Value) -> i64 {
    if string(settings, "quality", "medium") == "custom" {
        return settings["customQuality"].as_i64().unwrap_or(26);
    }
    let values = match encoder {
        "x264" | "x264_10bit" => [18, 23, 30, 51, 0],
        "x265" | "x265_10bit" | "x265_12bit" => [20, 26, 34, 51, 0],
        _ => [20, 28, 36, 51, 0],
    };
    let index = match string(settings, "quality", "medium") {
        "high" => 0,
        "low" => 2,
        "potato" => 3,
        "lossless" => 4,
        _ => 1,
    };
    values[index]
}

fn audio_args(args: &mut Vec<String>, settings: &Value, default: &str, format: &str) {
    let configured = string(settings, "audioCodec", default);
    let codec = if format == "av_webm"
        && !matches!(configured, "opus" | "vorbis")
        && !configured.starts_with("copy")
    {
        "opus"
    } else if format == "av_ogg"
        && !matches!(configured, "opus" | "vorbis")
        && !configured.starts_with("copy")
    {
        "vorbis"
    } else {
        configured
    };
    if codec.starts_with("copy") {
        argument(args, "-c:a", "copy");
        return;
    }
    argument(args, "-c:a", audio_codec(codec));
    if codec == "fdk_haac" {
        argument(args, "-profile:a", "aac_he");
    }
    if matches!(codec, "flac24" | "pcm_s24le") {
        argument(args, "-sample_fmt", "s32");
    }
    if !matches!(
        codec,
        "flac16" | "flac24" | "pcm_s16le" | "pcm_s24le" | "pcm_f32le" | "alac"
    ) {
        argument(
            args,
            "-b:a",
            format!("{}k", settings["audioBitrate"].as_u64().unwrap_or(160)),
        );
    }
    let channels = match string(settings, "audioMixdown", "stereo") {
        "mono" => 1,
        "5point1" => 6,
        "6point1" => 7,
        "7point1" => 8,
        _ => 2,
    };
    argument(args, "-ac", channels);
    let sample_rate = string(settings, "audioSampleRate", "auto");
    if sample_rate != "auto" {
        argument(args, "-ar", sample_rate);
    }
}

pub fn build_args(
    input: &str,
    output: &str,
    settings: &Value,
    resolution: Option<&str>,
    start: Option<f64>,
    end: Option<f64>,
) -> Vec<String> {
    let mut args = vec![
        "-hide_banner".into(),
        "-y".into(),
        "-progress".into(),
        "pipe:2".into(),
        "-nostats".into(),
    ];
    let format = string(settings, "format", "av_mkv");
    let audio_only = format.starts_with("audio_");
    let hw = string(settings, "hwDecoding", "off");
    if !audio_only && matches!(hw, "nvdec" | "qsv" | "videotoolbox") {
        argument(&mut args, "-hwaccel", hw);
    }
    if let Some(start) = start.filter(|start| *start > 0.0) {
        argument(&mut args, "-ss", start);
    }
    argument(&mut args, "-i", input);
    let subtitle = string(settings, "subtitleExternalFile", "");
    let burn_subtitle = flag(settings, "subtitleBurn");
    if !subtitle.is_empty() && !burn_subtitle && !audio_only {
        argument(&mut args, "-i", subtitle);
    }
    if let Some(end) = end {
        argument(&mut args, "-t", (end - start.unwrap_or_default()).max(1.0));
    }

    if audio_only {
        args.push("-vn".into());
        let default = match format {
            "audio_mp3" => "mp3",
            "audio_flac" => "flac16",
            "audio_wav" => "pcm_s16le",
            "audio_opus" => "opus",
            "audio_ogg" => "vorbis",
            _ => "av_aac",
        };
        audio_args(&mut args, settings, default, format);
        args.push("-sn".into());
        argument(
            &mut args,
            "-map_metadata",
            if flag(settings, "keepMetadata") {
                "0"
            } else {
                "-1"
            },
        );
        argument(
            &mut args,
            "-map_chapters",
            if settings["chapterMarkers"] == false {
                "-1"
            } else {
                "0"
            },
        );
        argument(&mut args, "-f", container(format));
        args.push(output.into());
        return args;
    }

    let mut encoder = string(settings, "encoder", "x265");
    if format == "av_webm"
        && !matches!(
            encoder,
            "vp8" | "vp9" | "vp9_10bit" | "svt_av1" | "svt_av1_10bit" | "libaom_av1"
        )
    {
        encoder = "vp9";
    }
    if format == "av_ogg" && !matches!(encoder, "theora" | "vp8" | "vp9" | "vp9_10bit") {
        encoder = "theora";
    }
    if format == "av_flv"
        && !matches!(
            encoder,
            "flv1"
                | "x264"
                | "x264_10bit"
                | "nvenc_h264"
                | "qsv_h264"
                | "vce_h264"
                | "mf_h264"
                | "vt_h264"
        )
    {
        encoder = "flv1";
    }
    if format == "av_3gp" && !matches!(encoder, "h263" | "h263p" | "x264" | "x264_10bit" | "mpeg4")
    {
        encoder = "h263p";
    }
    let codec = video_codec(encoder);
    argument(&mut args, "-c:v", codec);
    let alpha_format = if flag(settings, "alphaChannel") {
        match codec {
            "libvpx-vp9" | "ffv1" | "libaom-av1" => Some("yuva420p"),
            "prores_ks" => Some("yuva444p10le"),
            _ => None,
        }
    } else {
        None
    };
    if let Some(format) = alpha_format {
        argument(&mut args, "-pix_fmt", format);
    } else if encoder.ends_with("_10bit") {
        argument(&mut args, "-pix_fmt", "yuv420p10le");
    } else if encoder.ends_with("_12bit") {
        argument(&mut args, "-pix_fmt", "yuv420p12le");
    } else if matches!(
        codec,
        "libx264"
            | "h264_nvenc"
            | "h264_qsv"
            | "h264_amf"
            | "h264_mf"
            | "h264_videotoolbox"
            | "libvpx"
            | "libtheora"
            | "mpeg4"
            | "mpeg2video"
            | "mpeg1video"
            | "mjpeg"
            | "wmv2"
            | "wmv1"
            | "h263"
            | "h263p"
            | "flv"
    ) {
        argument(&mut args, "-pix_fmt", "yuv420p");
    }

    let speed = string(settings, "encoderSpeed", "");
    if !speed.is_empty() {
        if matches!(
            codec,
            "libx264"
                | "libx265"
                | "libsvtav1"
                | "h264_nvenc"
                | "hevc_nvenc"
                | "av1_nvenc"
                | "h264_qsv"
                | "hevc_qsv"
                | "av1_qsv"
        ) {
            argument(&mut args, "-preset", speed);
        } else if matches!(codec, "h264_amf" | "hevc_amf" | "av1_amf") {
            argument(&mut args, "-quality", speed);
        } else if matches!(codec, "libvpx" | "libvpx-vp9") {
            argument(&mut args, "-deadline", speed);
        } else if codec == "libaom-av1" {
            argument(&mut args, "-cpu-used", speed);
        } else if matches!(codec, "prores_ks" | "dnxhd") {
            argument(&mut args, "-profile:v", speed);
        } else if matches!(codec, "h264_videotoolbox" | "hevc_videotoolbox") {
            if speed == "quality" {
                argument(&mut args, "-prio_speed", 0);
            } else if speed == "speed" {
                argument(&mut args, "-realtime", 1);
                argument(&mut args, "-prio_speed", 1);
            }
        }
    }
    let rf = quality(encoder, settings);
    if matches!(codec, "libx264" | "libx265" | "libsvtav1") {
        argument(&mut args, "-crf", rf);
    } else if matches!(codec, "libvpx" | "libvpx-vp9" | "libaom-av1") {
        argument(&mut args, "-crf", rf);
        argument(&mut args, "-b:v", 0);
    } else if matches!(codec, "h264_nvenc" | "hevc_nvenc" | "av1_nvenc") {
        if rf == 0 && codec != "av1_nvenc" {
            argument(&mut args, "-rc", "constqp");
            argument(&mut args, "-qp", 0);
        } else {
            argument(&mut args, "-rc", "vbr");
            argument(&mut args, "-cq", rf.max(1));
        }
    } else if matches!(codec, "h264_qsv" | "hevc_qsv" | "av1_qsv") {
        argument(&mut args, "-global_quality", rf);
    } else if matches!(codec, "h264_amf" | "hevc_amf" | "av1_amf") {
        argument(&mut args, "-rc", "qvbr");
        argument(&mut args, "-qvbr_quality_level", rf);
    } else if matches!(codec, "h264_videotoolbox" | "hevc_videotoolbox") {
        argument(&mut args, "-q:v", (100 - rf).max(1));
        argument(&mut args, "-allow_sw", 1);
    } else if !matches!(codec, "ffv1" | "huffyuv") {
        argument(&mut args, "-q:v", rf);
    }

    if flag(settings, "multiPass") {
        if matches!(codec, "h264_nvenc" | "hevc_nvenc" | "av1_nvenc") && rf != 0 {
            argument(&mut args, "-multipass", "fullres");
        } else if matches!(codec, "h264_qsv" | "hevc_qsv" | "av1_qsv") {
            argument(&mut args, "-look_ahead", 1);
        } else if matches!(codec, "h264_amf" | "hevc_amf" | "av1_amf") {
            argument(&mut args, "-preanalysis", 1);
        }
    }

    let mut filters = Vec::<String>::new();
    let target_height = match string(settings, "resolution", "source") {
        "4k" => Some(2160),
        "1440p" => Some(1440),
        "1080p" => Some(1080),
        "720p" => Some(720),
        "480p" => Some(480),
        _ => None,
    };
    if let Some(height) = target_height {
        let scale = resolution
            .and_then(|resolution| resolution.split_once('x'))
            .and_then(|(width, source_height)| {
                Some((
                    width.parse::<u32>().ok()?,
                    source_height.parse::<u32>().ok()?,
                ))
            })
            .filter(|(width, source_height)| *width > 0 && *source_height > 0)
            .map(|(width, source_height)| {
                if source_height > width {
                    format!(
                        "scale={height}:{}",
                        ((source_height as f64 * height as f64 / width as f64).round() as u32 + 1)
                            & !1
                    )
                } else {
                    format!(
                        "scale={}:{}",
                        ((width as f64 * height as f64 / source_height as f64).round() as u32 + 1)
                            & !1,
                        height
                    )
                }
            })
            .unwrap_or_else(|| format!("scale=-2:{height}"));
        filters.push(scale);
    }
    let fps = string(settings, "fps", "source");
    if fps != "source" {
        filters.push(format!("fps={fps}"));
    }
    let deinterlace = string(settings, "deinterlace", "off");
    if deinterlace != "off" {
        let method = if deinterlace.starts_with("bwdif") {
            "bwdif"
        } else {
            "yadif"
        };
        filters.push(format!(
            "{method}=mode={}:parity=-1:deint=0",
            if deinterlace.contains("bob") { 1 } else { 0 }
        ));
    }
    if let Some(filter) = match string(settings, "denoise", "off") {
        "nlmeans_ultralight" => Some("hqdn3d=1:0.7:1:1.5"),
        "nlmeans_light" => Some("hqdn3d=2:1.5:2:2.5"),
        "nlmeans_medium" => Some("hqdn3d=3:2:3:3"),
        "nlmeans_strong" => Some("hqdn3d=7:5:7:5"),
        "hqdn3d_light" => Some("hqdn3d=2:1:2:3"),
        "hqdn3d_medium" => Some("hqdn3d=3:2:2:3"),
        "hqdn3d_strong" => Some("hqdn3d=7:7:7:5"),
        _ => None,
    } {
        filters.push(filter.into());
    }
    if let Some(filter) = match string(settings, "deblock", "off") {
        "ultralight" | "light" => Some("deblock=filter=weak:block=4"),
        "medium" => Some("deblock=filter=strong:block=4"),
        "strong" | "stronger" => Some("deblock=filter=strong:block=8"),
        _ => None,
    } {
        filters.push(filter.into());
    }
    if let Some(filter) = match string(settings, "sharpen", "off") {
        "unsharp_ultralight" | "lapsharp_ultralight" => Some("unsharp=5:5:0.5:5:5:0"),
        "unsharp_light" | "lapsharp_light" => Some("unsharp=5:5:0.75:5:5:0"),
        "unsharp_medium" | "lapsharp_medium" => Some("unsharp=5:5:1.0:5:5:0"),
        "unsharp_strong" | "lapsharp_strong" => Some("unsharp=5:5:1.5:5:5:0"),
        _ => None,
    } {
        filters.push(filter.into());
    }
    if flag(settings, "grayscale") {
        filters.push("hue=s=0".into());
    }
    match string(settings, "rotate", "0") {
        "90" => filters.push("transpose=1".into()),
        "180" => filters.push("vflip,hflip".into()),
        "270" => filters.push("transpose=2".into()),
        "hflip" => filters.push("hflip".into()),
        _ => {}
    }
    if burn_subtitle && !subtitle.is_empty() {
        filters.push(format!(
            "subtitles='{}'",
            subtitle.replace('\\', "/").replace(':', "\\:")
        ));
    }
    let hdr = string(settings, "hdrMetadata", "off") != "off"
        && matches!(
            codec,
            "libx265"
                | "hevc_nvenc"
                | "hevc_qsv"
                | "hevc_amf"
                | "hevc_videotoolbox"
                | "libsvtav1"
                | "av1_nvenc"
                | "av1_qsv"
                | "av1_amf"
                | "libaom-av1"
                | "libvpx-vp9"
                | "ffv1"
                | "prores_ks"
                | "dnxhd"
        );
    if hdr {
        filters.push(
            "setparams=color_primaries=bt2020:color_trc=smpte2084:colorspace=bt2020nc:range=tv"
                .into(),
        );
    }
    if !filters.is_empty() {
        argument(&mut args, "-vf", filters.join(","));
    }
    if hdr {
        for (key, value) in [
            ("-color_primaries", "bt2020"),
            ("-color_trc", "smpte2084"),
            ("-colorspace", "bt2020nc"),
            ("-color_range", "tv"),
        ] {
            argument(&mut args, key, value);
        }
    }
    if fps != "source" && string(settings, "fpsMode", "vfr") == "cfr" {
        argument(&mut args, "-vsync", "cfr");
    }
    if flag(settings, "noAudio") {
        args.push("-an".into());
    } else {
        audio_args(&mut args, settings, "av_aac", format);
    }
    let embedded_subtitles = string(settings, "subtitleMode", "none");
    if !subtitle.is_empty() && !burn_subtitle {
        args.extend(["-map", "0:v:0", "-map", "0:a?", "-map", "1:0"].map(str::to_owned));
        argument(
            &mut args,
            "-c:s",
            if matches!(format, "av_mp4" | "av_mov" | "av_3gp") {
                "mov_text"
            } else if matches!(format, "av_webm" | "av_ogg") {
                "webvtt"
            } else {
                "srt"
            },
        );
    } else if matches!(embedded_subtitles, "first" | "scan_forced" | "all") && !burn_subtitle {
        args.extend(
            [
                "-map",
                "0:v:0",
                "-map",
                "0:a?",
                "-map",
                if embedded_subtitles == "all" {
                    "0:s?"
                } else {
                    "0:s:0?"
                },
            ]
            .map(str::to_owned),
        );
        argument(
            &mut args,
            "-c:s",
            if matches!(format, "av_mp4" | "av_mov" | "av_3gp") {
                "mov_text"
            } else if matches!(format, "av_webm" | "av_ogg") {
                "webvtt"
            } else {
                "srt"
            },
        );
    } else {
        args.push("-sn".into());
    }
    argument(
        &mut args,
        "-map_metadata",
        if flag(settings, "keepMetadata") {
            "0"
        } else {
            "-1"
        },
    );
    argument(
        &mut args,
        "-map_chapters",
        if settings["chapterMarkers"] == false {
            "-1"
        } else {
            "0"
        },
    );
    if flag(settings, "optimizeMP4") && format == "av_mp4" {
        argument(&mut args, "-movflags", "+faststart");
    }
    if codec == "libx264" && flag(settings, "inlineParamSets") {
        argument(&mut args, "-x264-params", "repeat_headers=1");
    }
    if codec == "libx265" && (hdr || flag(settings, "inlineParamSets")) {
        let parameters = if hdr {
            "hdr-opt=1:repeat-headers=1"
        } else {
            "repeat-headers=1"
        };
        argument(&mut args, "-x265-params", parameters);
    }
    argument(&mut args, "-f", container(format));
    args.push(output.into());
    args
}

pub(crate) async fn duration(app: &AppHandle, path: &str) -> Option<f64> {
    let tool = locate(app, Tool::Ffprobe).ok()?;
    let output = tokio::process::Command::new(tool)
        .args([
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            path,
        ])
        .kill_on_drop(true)
        .output()
        .await
        .ok()?;
    String::from_utf8(output.stdout).ok()?.trim().parse().ok()
}

#[tauri::command]
pub async fn run_cli(
    app: AppHandle,
    jobs: State<'_, Arc<Jobs>>,
    request: Value,
) -> Result<(), String> {
    let id = request["id"].clone();
    let result = execute(app.clone(), jobs.inner().clone(), request)
        .await
        .map(|_| ());
    if let Err(error) = &result {
        let _ = app.emit(
            "cli-exit",
            json!({"id": id, "code": 1, "stderr": error, "outputPath": null}),
        );
    }
    result
}

pub async fn execute(
    app: AppHandle,
    jobs: Arc<Jobs>,
    request: Value,
) -> Result<RunOutcome, String> {
    let id = request["id"].clone();
    if id.is_null() {
        return Err("Job ID is required".into());
    }
    let input = request["filePath"]
        .as_str()
        .ok_or("Input path is required")?;
    if !Path::new(input).is_file() {
        return Err("Input file does not exist".into());
    }
    let output_mode = string(&request, "outputMode", "default");
    let directory = if output_mode == "source" {
        Path::new(input)
            .parent()
            .ok_or("Input has no parent")?
            .to_path_buf()
    } else if let Some(path) = request["customOutputDir"]
        .as_str()
        .filter(|path| !path.is_empty())
    {
        PathBuf::from(path)
    } else {
        app.path().video_dir().map_err(|error| error.to_string())?
    };
    std::fs::create_dir_all(&directory).map_err(|error| error.to_string())?;
    let base = request["outputName"]
        .as_str()
        .filter(|name| !name.is_empty())
        .map(str::to_owned)
        .unwrap_or_else(|| {
            Path::new(input)
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .into_owned()
        });
    let base = base.trim_end_matches("_converted").trim();
    let base = base.replace(['/', '\\', ':', '*', '?', '"', '<', '>', '|'], "_");
    let settings = &request["settings"];
    let mut reserved = crate::workspace::OutputFile::reserve(
        &directory,
        &format!("{base}_converted"),
        output_extension(string(settings, "format", "av_mkv")),
    )?;
    let output_path = reserved.path().to_path_buf();
    let output = output_path.to_string_lossy();
    let start = request["clipStart"].as_f64();
    let end = request["clipEnd"].as_f64();
    let args = build_args(
        input,
        &output,
        settings,
        request["videoResolution"].as_str(),
        start,
        end,
    );
    let full_duration = duration(&app, input).await;
    let effective_duration = full_duration
        .map(|full| end.unwrap_or(full) - start.unwrap_or_default())
        .filter(|time| *time > 0.0);
    let spec = RunSpec {
        id: id.clone(),
        program: locate(&app, Tool::Ffmpeg)?,
        args,
        output_path: output_path.clone(),
        cleanup_paths: vec![output_path],
        event_prefix: "cli",
        duration: effective_duration,
        discover_output: None,
        emit_exit: true,
    };
    let result = jobs::run(app, jobs, spec).await;
    if result
        .as_ref()
        .is_ok_and(|outcome| outcome.code == 0 && !outcome.cancelled)
    {
        reserved.keep();
    }
    result
}

#[cfg(test)]
mod tests {
    use super::{build_args, output_extension};
    use serde_json::json;
    #[test]
    fn ffmpeg_audio_only_has_no_video_and_keeps_container() {
        let args = build_args(
            "input.mp4",
            "output.mp3",
            &json!({"format":"audio_mp3","audioCodec":"mp3"}),
            None,
            None,
            None,
        );
        assert!(args.contains(&"-vn".into()));
        assert_eq!(&args[args.len() - 2..], ["mp3", "output.mp3"]);
    }
    #[test]
    fn clips_never_have_negative_duration() {
        let args = build_args(
            "input.mp4",
            "output.mkv",
            &json!({"format":"av_mkv"}),
            None,
            Some(10.0),
            Some(5.0),
        );
        assert!(args.windows(2).any(|pair| pair == ["-t", "1"]));
    }
    #[test]
    fn extensions_match_containers() {
        assert_eq!(output_extension("av_mkv"), "mkv");
        assert_eq!(output_extension("audio_m4a"), "m4a");
    }
    #[test]
    fn preserves_filters_embedded_subtitles_and_hardware_multipass() {
        let args = build_args(
            "input.mkv",
            "output.mp4",
            &json!({
                "format":"av_mp4","encoder":"nvenc_h265","denoise":"hqdn3d_medium",
                "deblock":"strong","sharpen":"unsharp_light","subtitleMode":"all","multiPass":true
            }),
            None,
            None,
            None,
        );
        assert!(args
            .windows(2)
            .any(|part| part == ["-multipass", "fullres"]));
        assert!(args.windows(2).any(|part| part == ["-map", "0:s?"]));
        let filters = args.windows(2).find(|part| part[0] == "-vf").unwrap()[1].as_str();
        assert!(filters.contains("hqdn3d=3:2:2:3"));
        assert!(filters.contains("deblock=filter=strong:block=8"));
        assert!(filters.contains("unsharp=5:5:0.75:5:5:0"));
    }
}
