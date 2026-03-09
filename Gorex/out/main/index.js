"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const child_process = require("child_process");
function getCLIPath() {
  if (utils.is.dev) {
    return path.join(electron.app.getAppPath(), "..", "build", "HandBrakeCLI.exe");
  }
  return path.join(path.dirname(process.execPath), "HandBrakeCLI.exe");
}
let settingsFilePath = "";
function getSettingsFilePath() {
  if (!settingsFilePath) settingsFilePath = path.join(electron.app.getPath("userData"), "gorex-settings.json");
  return settingsFilePath;
}
function readAppSettings() {
  try {
    const data = require("fs").readFileSync(getSettingsFilePath(), "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}
function writeAppSettings(settings) {
  require("fs").writeFileSync(getSettingsFilePath(), JSON.stringify(settings, null, 2), "utf8");
}
const activeJobs = /* @__PURE__ */ new Map();
function getYtdlPath() {
  const platform = process.platform;
  const bin = platform === "win32" ? "yt-dlp.exe" : "yt-dlp_macos";
  if (utils.is.dev) {
    return path.join(electron.app.getAppPath(), "resources", "ytdl", bin);
  }
  return path.join(path.dirname(process.execPath), "resources", "ytdl", bin);
}
function getFfmpegPath() {
  const bin = process.platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
  if (utils.is.dev) {
    return path.join(electron.app.getAppPath(), "resources", "ytdl", bin);
  }
  return path.join(path.dirname(process.execPath), "resources", "ytdl", bin);
}
function getDownloadDir(customOutputDir) {
  if (customOutputDir) return customOutputDir;
  const s = readAppSettings();
  if (s.defaultOutputDir) return s.defaultOutputDir;
  if (utils.is.dev) {
    return path.join(electron.app.getAppPath(), "..", "Downloaded");
  }
  return path.join(path.dirname(process.execPath), "Downloaded");
}
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1280,
    height: 850,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    // Frameless window
    icon: path.join(__dirname, "../../resources/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  const cleanUA = mainWindow.webContents.userAgent.replace(/\bElectron\/[\d.]+\s*/g, "").trim();
  mainWindow.webContents.userAgent = cleanUA;
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(() => {
  utils.electronApp.setAppUserModelId("com.akhmatyarov.gorex");
  {
    const _fs = require("fs");
    const fluentFfmpeg = require("fluent-ffmpeg");
    const ffmpegBin = getFfmpegPath();
    const ffprobeBin = path.join(require("path").dirname(ffmpegBin), process.platform === "win32" ? "ffprobe.exe" : "ffprobe");
    if (_fs.existsSync(ffmpegBin)) {
      fluentFfmpeg.setFfmpegPath(ffmpegBin);
    } else {
      try {
        const ffmpegStatic = require("ffmpeg-static");
        if (ffmpegStatic && _fs.existsSync(ffmpegStatic)) fluentFfmpeg.setFfmpegPath(ffmpegStatic);
      } catch (_) {
      }
    }
    if (_fs.existsSync(ffprobeBin)) {
      fluentFfmpeg.setFfprobePath(ffprobeBin);
    } else {
      try {
        const ffprobeStatic = require("ffprobe-static");
        const p = ffprobeStatic && (ffprobeStatic.path || ffprobeStatic);
        if (p && _fs.existsSync(p)) fluentFfmpeg.setFfprobePath(p);
      } catch (_) {
      }
    }
  }
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  electron.ipcMain.on("window-minimize", () => {
    electron.BrowserWindow.getFocusedWindow()?.minimize();
  });
  electron.ipcMain.on("window-maximize", () => {
    const win = electron.BrowserWindow.getFocusedWindow();
    if (win?.isMaximized()) win.unmaximize();
    else win?.maximize();
  });
  electron.ipcMain.on("window-close", () => {
    electron.BrowserWindow.getFocusedWindow()?.close();
  });
  electron.ipcMain.on("open-devtools", () => {
    electron.BrowserWindow.getFocusedWindow()?.webContents.openDevTools();
  });
  electron.ipcMain.handle("select-files", async () => {
    const { canceled, filePaths } = await electron.dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        {
          name: "Videos",
          extensions: [
            "mp4",
            "mkv",
            "avi",
            "mov",
            "wmv",
            "flv",
            "m4v",
            "ts",
            "m2ts",
            "mts",
            "mpg",
            "mpeg",
            "vob",
            "webm",
            "3gp",
            "3g2",
            "ogv",
            "ogg",
            "divx",
            "xvid",
            "rmvb",
            "asf",
            "mxf",
            "dv",
            "f4v",
            "h264",
            "h265",
            "hevc",
            "avchd"
          ]
        }
      ]
    });
    return canceled ? [] : filePaths;
  });
  electron.ipcMain.handle("select-folder", async () => {
    const { canceled, filePaths } = await electron.dialog.showOpenDialog({
      properties: ["openDirectory"]
    });
    return canceled ? null : filePaths[0];
  });
  electron.ipcMain.handle("select-subtitle-file", async () => {
    const { canceled, filePaths } = await electron.dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        { name: "Subtitle Files", extensions: ["srt", "ass", "ssa", "sub", "vtt"] }
      ]
    });
    return canceled ? null : filePaths[0];
  });
  electron.ipcMain.handle("check-cli", async () => {
    const cliPath = getCLIPath();
    const fs = require("fs");
    if (!fs.existsSync(cliPath)) {
      return { found: false, version: null, path: cliPath };
    }
    return new Promise((resolve) => {
      const child = child_process.spawn(cliPath, ["--version"]);
      let output = "";
      child.stdout.on("data", (d) => {
        output += d.toString();
      });
      child.stderr.on("data", (d) => {
        output += d.toString();
      });
      child.on("close", () => {
        const versionMatch = output.match(/HandBrake\s+([\d.]+)/i);
        resolve({
          found: true,
          version: versionMatch ? versionMatch[1] : output.trim().split("\n")[0],
          path: cliPath
        });
      });
      child.on("error", () => {
        resolve({ found: false, version: null, path: cliPath });
      });
    });
  });
  electron.ipcMain.handle("get-app-settings", () => {
    return readAppSettings();
  });
  electron.ipcMain.handle("save-app-settings", (event, settings) => {
    writeAppSettings(settings);
    return true;
  });
  electron.ipcMain.handle("get-default-output-dir", () => {
    const s = readAppSettings();
    return s.defaultOutputDir || electron.app.getPath("videos");
  });
  electron.ipcMain.handle("ytdl-get-formats", async (_, videoUrl) => {
    const fs = require("fs");
    const ytdlPath = getYtdlPath();
    if (!fs.existsSync(ytdlPath)) throw new Error(`yt-dlp не найден: ${ytdlPath}`);
    return new Promise((resolve, reject) => {
      const child = child_process.spawn(ytdlPath, [
        "--dump-json",
        "--no-playlist",
        videoUrl
      ], { windowsHide: true });
      let out = "";
      let err = "";
      child.stdout.on("data", (d) => {
        out += d.toString();
      });
      child.stderr.on("data", (d) => {
        err += d.toString();
      });
      child.on("close", async (code) => {
        if (code !== 0) return reject(new Error(err.trim() || `yt-dlp завершился с кодом ${code}`));
        try {
          const info = JSON.parse(out.trim());
          const rawFormats = info.formats || [];
          const formats = rawFormats.filter((f) => f.vcodec && f.vcodec !== "none").map((f) => ({
            format_id: f.format_id,
            ext: f.ext,
            resolution: f.resolution || (f.width && f.height ? `${f.width}x${f.height}` : null),
            width: f.width || null,
            height: f.height || null,
            fps: f.fps || null,
            filesize: f.filesize || f.filesize_approx || null,
            vcodec: f.vcodec,
            acodec: f.acodec,
            tbr: f.tbr || null,
            format_note: f.format_note || null,
            hasAudio: !!(f.acodec && f.acodec !== "none")
          })).sort((a, b) => (b.height || 0) - (a.height || 0));
          const thumbnails = info.thumbnails || [];
          const thumbnailUrl = info.thumbnail || (thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : null);
          let thumbnailBase64 = null;
          if (thumbnailUrl) {
            try {
              const https = require("https");
              const http = require("http");
              thumbnailBase64 = await new Promise((res, rej) => {
                const protocol = thumbnailUrl.startsWith("https") ? https : http;
                protocol.get(thumbnailUrl, (resp) => {
                  const chunks = [];
                  resp.on("data", (d) => chunks.push(d));
                  resp.on("end", () => {
                    const buf = Buffer.concat(chunks);
                    const mime = (resp.headers["content-type"] || "image/jpeg").split(";")[0];
                    res(`data:${mime};base64,${buf.toString("base64")}`);
                  });
                  resp.on("error", rej);
                }).on("error", rej);
              });
            } catch {
            }
          }
          const chapters = (info.chapters || []).map((ch) => ({
            title: ch.title || "",
            start_time: ch.start_time ?? 0,
            end_time: ch.end_time ?? (info.duration || 0)
          }));
          resolve({
            title: info.title || info.id || "Видео",
            thumbnailUrl: thumbnailBase64,
            formats,
            duration: info.duration || null,
            chapters,
            url: videoUrl
          });
        } catch (e) {
          reject(new Error("Не удалось разобрать ответ yt-dlp: " + e.message));
        }
      });
      child.on("error", reject);
    });
  });
  electron.ipcMain.on("ytdl-run", (event, { id, url, formatId, outputDir, outputName, convertAfterDownload, conversionSettings, videoResolution, clipStart, clipEnd, ytdlDuration }) => {
    const fs = require("fs");
    const ytdlPath = getYtdlPath();
    const cliPath = getCLIPath();
    if (!fs.existsSync(ytdlPath)) {
      event.sender.send("ytdl-exit", { id, code: 1, error: `yt-dlp не найден: ${ytdlPath}` });
      return;
    }
    const resolvedDir = getDownloadDir(outputDir);
    if (!fs.existsSync(resolvedDir)) fs.mkdirSync(resolvedDir, { recursive: true });
    const downloadDir = convertAfterDownload ? utils.is.dev ? path.join(electron.app.getAppPath(), "..", "Downloads_Temp") : path.join(path.dirname(process.execPath), "Downloads_Temp") : resolvedDir;
    if (convertAfterDownload && !fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });
    const safeBase = (outputName || "video").replace(/[<>:"/\\|?*\x00-\x1f]/g, "_").replace(/\.+$/, "").trim() || "video";
    const fmtArg = !formatId || formatId === "best" ? "bestvideo+bestaudio/best" : formatId.includes("/") || formatId.includes("[") ? formatId : `${formatId}+bestaudio/${formatId}`;
    const downloadBase = convertAfterDownload ? `gorex_temp_${id}_${Date.now()}` : safeBase;
    const outputTemplate = path.join(downloadDir, downloadBase + ".%(ext)s");
    const hasClip = clipStart != null && clipStart > 0 || clipEnd != null;
    const secToTimestamp = (s) => {
      const sec = Math.max(0, Math.floor(s));
      const h = Math.floor(sec / 3600);
      const m = Math.floor(sec % 3600 / 60);
      const ss = sec % 60;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(ss).padStart(2, "0")}`;
    };
    const ffmpegPath = getFfmpegPath();
    const ytdlArgs = [
      "-f",
      fmtArg,
      "-o",
      outputTemplate,
      "--no-playlist",
      "--merge-output-format",
      "mp4",
      "--newline",
      ...require("fs").existsSync(ffmpegPath) ? ["--ffmpeg-location", ffmpegPath] : []
    ];
    if (hasClip) {
      const fromTs = secToTimestamp(clipStart ?? 0);
      const toTs = clipEnd != null ? secToTimestamp(clipEnd) : "inf";
      ytdlArgs.push("--download-sections", `*${fromTs}-${toTs}`);
    }
    ytdlArgs.push(url);
    console.log("[yt-dlp] spawn:", ytdlPath);
    console.log("[yt-dlp] args:", ytdlArgs.join(" "));
    const child = child_process.spawn(ytdlPath, ytdlArgs, { windowsHide: true });
    activeJobs.set(id, { child, outputPath: null });
    let downloadedPath = null;
    let fragPhase = 0;
    let fragPhaseOffset = 0;
    let lastFragTotal = 0;
    const clipDuration = clipEnd != null ? Math.max(1, clipEnd - (clipStart ?? 0)) : ytdlDuration ?? null;
    const parseProgress = (str, fromStderr) => {
      const progressMatch = str.match(/\[download\]\s+([\d.]+)%/);
      if (progressMatch) {
        const progress = parseFloat(progressMatch[1]);
        event.sender.send("ytdl-progress", { id, progress });
        return;
      }
      const fragMatch = str.match(/\[download\] Downloading fragment (\d+) of (\d+)/);
      if (fragMatch) {
        const current = parseInt(fragMatch[1], 10);
        const total = parseInt(fragMatch[2], 10);
        if (total > 0) {
          if (total !== lastFragTotal && lastFragTotal > 0) {
            fragPhase++;
            fragPhaseOffset = fragPhase * 50;
          }
          lastFragTotal = total;
          const phaseProgress = current / total * (lastFragTotal > 0 ? 50 : 100);
          const progress = Math.min(99, fragPhaseOffset + phaseProgress);
          event.sender.send("ytdl-progress", { id, progress });
        }
        return;
      }
      if (fromStderr && clipDuration && str.includes("time=")) {
        const timeMatch = str.match(/time=(\d+):(\d+):([\d.]+)/);
        if (timeMatch) {
          const secs = parseInt(timeMatch[1], 10) * 3600 + parseInt(timeMatch[2], 10) * 60 + parseFloat(timeMatch[3]);
          const progress = Math.min(99, secs / clipDuration * 100);
          event.sender.send("ytdl-progress", { id, progress });
        }
      }
    };
    child.stdout.on("data", (data) => {
      const str = data.toString();
      console.log("[yt-dlp stdout]", str.trimEnd());
      event.sender.send("ytdl-output", { id, data: str });
      parseProgress(str, false);
      const destMatch = str.match(/\[download\] Destination:\s+(.+)/);
      if (destMatch) downloadedPath = destMatch[1].trim();
      const mergeMatch = str.match(/\[(?:Merger|ffmpeg)\] Merging formats into "(.+)"/);
      if (mergeMatch) downloadedPath = mergeMatch[1].trim();
      const alreadyMatch = str.match(/\[download\] (.+) has already been downloaded/);
      if (alreadyMatch) downloadedPath = alreadyMatch[1].trim();
    });
    child.stderr.on("data", (data) => {
      const str = data.toString();
      console.log("[yt-dlp stderr]", str.trimEnd());
      event.sender.send("ytdl-output", { id, data: str });
      parseProgress(str, true);
    });
    child.on("error", (err) => {
      console.log("[yt-dlp error]", err.message);
      activeJobs.delete(id);
      event.sender.send("ytdl-exit", { id, code: 1, error: err.message });
    });
    child.on("close", async (code) => {
      console.log("[yt-dlp exit] code:", code);
      activeJobs.delete(id);
      if (code !== 0) {
        event.sender.send("ytdl-exit", { id, code, outputPath: null });
        return;
      }
      if (!downloadedPath || !fs.existsSync(downloadedPath)) {
        try {
          const files = fs.readdirSync(downloadDir);
          const matching = files.filter((f) => f.startsWith(downloadBase + ".") || f.startsWith(downloadBase + " (")).map((f) => ({ f, mtime: fs.statSync(path.join(downloadDir, f)).mtimeMs })).sort((a, b) => b.mtime - a.mtime);
          if (matching.length > 0) downloadedPath = path.join(downloadDir, matching[0].f);
        } catch (_) {
        }
      }
      if (convertAfterDownload && downloadedPath && fs.existsSync(downloadedPath) && fs.existsSync(cliPath)) {
        const ffmpeg = require("fluent-ffmpeg");
        let hasVideo = false;
        try {
          hasVideo = await new Promise((res) => {
            ffmpeg.ffprobe(downloadedPath, (err, meta) => {
              if (err) return res(false);
              res(!!(meta && meta.streams && meta.streams.some((s2) => s2.codec_type === "video")));
            });
          });
        } catch (_) {
          hasVideo = false;
        }
        if (!hasVideo) {
          const audioExt = require("path").extname(downloadedPath);
          const audioBase = (outputName || safeBase).replace(/_converted(\s*\(\d+\))?$/i, "").trimEnd();
          let audioOut = path.join(resolvedDir, audioBase + audioExt);
          if (fs.existsSync(audioOut)) {
            let c = 1;
            while (fs.existsSync(path.join(resolvedDir, `${audioBase} (${c})${audioExt}`))) c++;
            audioOut = path.join(resolvedDir, `${audioBase} (${c})${audioExt}`);
          }
          try {
            fs.renameSync(downloadedPath, audioOut);
          } catch (_) {
            try {
              fs.copyFileSync(downloadedPath, audioOut);
              fs.unlinkSync(downloadedPath);
            } catch (__) {
            }
          }
          event.sender.send("ytdl-exit", { id, code: 0, outputPath: audioOut });
          return;
        }
        event.sender.send("ytdl-exit", { id, code: 0, outputPath: downloadedPath, converting: true });
        const s = conversionSettings || { format: "av_mp4", encoder: "x265", encoderSpeed: "slow", quality: "medium", fps: "source", resolution: "source" };
        const rawBase = (outputName || safeBase).replace(/_converted(\s*\(\d+\))?$/i, "").trimEnd();
        const convertedBase = rawBase + "_converted";
        const ext = FORMAT_EXT[s.format] || "mp4";
        let convertedPath = path.join(resolvedDir, convertedBase + "." + ext);
        if (fs.existsSync(convertedPath)) {
          let c = 1;
          while (fs.existsSync(path.join(resolvedDir, `${convertedBase} (${c}).${ext}`))) c++;
          convertedPath = path.join(resolvedDir, `${convertedBase} (${c}).${ext}`);
        }
        const args = buildCliArgs(downloadedPath, convertedPath, s, videoResolution);
        const stderrLines = [];
        const hbChild = child_process.spawn(cliPath, args);
        activeJobs.set(id + "_cvt", { child: hbChild, outputPath: convertedPath });
        hbChild.stdout.on("data", (d) => {
          const str = d.toString();
          let pv = null;
          const em = str.match(/Encoding:.*?([\d.]+)\s*%/);
          if (em) {
            pv = parseFloat(em[1]);
          } else {
            const all = [...str.matchAll(/([\d.]+)\s*%/g)];
            if (all.length > 0) pv = parseFloat(all[all.length - 1][1]);
          }
          if (pv !== null && pv <= 100) event.sender.send("cli-progress", { id, progress: pv });
        });
        hbChild.stderr.on("data", (d) => {
          stderrLines.push(d.toString());
        });
        hbChild.on("close", (hbCode) => {
          activeJobs.delete(id + "_cvt");
          if (downloadedPath && fs.existsSync(downloadedPath)) {
            try {
              fs.unlinkSync(downloadedPath);
            } catch (_) {
            }
          }
          event.sender.send("cli-exit", { id, code: hbCode, outputPath: convertedPath, stderr: stderrLines.join("") });
        });
      } else {
        event.sender.send("ytdl-exit", { id, code: 0, outputPath: downloadedPath });
      }
    });
  });
  electron.ipcMain.handle("get-video-data", async (event, filePaths) => {
    const ffmpeg = require("fluent-ffmpeg");
    const results = [];
    const thumbDir = path.join(electron.app.getPath("userData"), "thumbnails");
    if (!require("fs").existsSync(thumbDir)) require("fs").mkdirSync(thumbDir);
    for (const [index, filePath] of filePaths.entries()) {
      try {
        const metadata = await new Promise((resolve, reject) => {
          ffmpeg.ffprobe(filePath, (err, data) => {
            if (err) reject(err);
            else resolve(data);
          });
        });
        const videoStream = metadata.streams.find((s) => s.codec_type === "video");
        const audioStream = metadata.streams.find((s) => s.codec_type === "audio");
        const duration = metadata.format.duration;
        const formatDuration = (s) => {
          const hrs = Math.floor(s / 3600);
          const mins = Math.floor(s % 3600 / 60);
          const secs = Math.floor(s % 60);
          return `${hrs > 0 ? hrs + ":" : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        };
        const formatSize = (bytes) => {
          if (!bytes) return "—";
          const mb = bytes / (1024 * 1024);
          if (mb < 1024) return mb.toFixed(1) + " MB";
          return (mb / 1024).toFixed(2) + " GB";
        };
        const getFps = (stream) => {
          if (!stream) return null;
          const r = stream.r_frame_rate || stream.avg_frame_rate;
          if (!r) return null;
          const [num, den] = r.split("/").map(Number);
          if (!den) return null;
          const fps = num / den;
          return fps % 1 === 0 ? fps.toFixed(0) : fps.toFixed(3).replace(/\.?0+$/, "");
        };
        const getChannels = (stream) => {
          if (!stream) return null;
          const ch = stream.channels;
          if (!ch) return null;
          if (ch === 1) return "Mono";
          if (ch === 2) return "Stereo";
          if (ch === 6) return "5.1";
          if (ch === 8) return "7.1";
          return `${ch}ch`;
        };
        const getBitrate = (format) => {
          const br = format?.bit_rate;
          if (!br) return null;
          const kbps = Math.round(br / 1e3);
          return kbps >= 1e3 ? (kbps / 1e3).toFixed(1) + " Mbps" : kbps + " kbps";
        };
        const thumbName = `thumb-${Date.now()}-${index}.jpg`;
        const thumbPath = path.join(thumbDir, thumbName);
        const seekTime = duration ? Math.max(0, duration * 0.1) : 0;
        let thumbBase64 = null;
        try {
          await new Promise((resolve, reject) => {
            ffmpeg(filePath).seekInput(seekTime).frames(1).size("320x?").output(thumbPath).on("end", resolve).on("error", reject).run();
          });
          const thumbData = require("fs").readFileSync(thumbPath);
          thumbBase64 = `data:image/jpeg;base64,${thumbData.toString("base64")}`;
        } catch (thumbErr) {
          console.warn(`Thumbnail failed for ${filePath}:`, thumbErr.message);
        }
        const rawName = filePath.split("\\").pop();
        const ext = rawName.includes(".") ? rawName.split(".").pop().toUpperCase() : "";
        const baseName = rawName.includes(".") ? rawName.split(".").slice(0, -1).join(".") : rawName;
        results.push({
          id: index,
          title: baseName,
          outputName: baseName,
          container: ext || null,
          path: filePath,
          duration: formatDuration(duration),
          resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : null,
          videoCodec: videoStream?.codec_name?.toUpperCase() || null,
          fps: getFps(videoStream),
          audioCodec: audioStream?.codec_name?.toUpperCase() || null,
          channels: getChannels(audioStream),
          bitrate: getBitrate(metadata.format),
          size: formatSize(metadata.format.size),
          thumbnail: thumbBase64
        });
      } catch (err) {
        console.error(`Failed to process ${filePath}:`, err);
      }
    }
    return results;
  });
  const FORMAT_EXT = { av_mp4: "mp4", av_mkv: "mkv", av_webm: "webm", av_mov: "mov" };
  const CODEC_RF_TABLE = {
    x264: { high: 18, medium: 23, low: 30, potato: 51, lossless: 0 },
    x264_10bit: { high: 18, medium: 23, low: 30, potato: 51, lossless: 0 },
    x265: { high: 20, medium: 26, low: 34, potato: 51, lossless: 0 },
    x265_10bit: { high: 20, medium: 26, low: 34, potato: 51, lossless: 0 },
    x265_12bit: { high: 20, medium: 26, low: 34, potato: 51, lossless: 0 },
    svt_av1: { high: 28, medium: 38, low: 50, potato: 63, lossless: 1 },
    svt_av1_10bit: { high: 28, medium: 38, low: 50, potato: 63, lossless: 1 },
    vp8: { high: 5, medium: 15, low: 30, potato: 63, lossless: 0 },
    vp9: { high: 24, medium: 34, low: 46, potato: 63, lossless: 0 },
    vp9_10bit: { high: 24, medium: 34, low: 46, potato: 63, lossless: 0 },
    nvenc_h264: { high: 18, medium: 24, low: 32, potato: 51, lossless: 0 },
    nvenc_h265: { high: 20, medium: 28, low: 38, potato: 51, lossless: 0 },
    nvenc_av1: { high: 20, medium: 28, low: 38, potato: 51, lossless: 0 },
    qsv_h264: { high: 18, medium: 24, low: 32, potato: 51, lossless: 0 },
    qsv_h265: { high: 20, medium: 28, low: 38, potato: 51, lossless: 0 },
    qsv_av1: { high: 20, medium: 28, low: 38, potato: 51, lossless: 0 },
    vce_h264: { high: 18, medium: 24, low: 32, potato: 51, lossless: 0 },
    vce_h265: { high: 20, medium: 28, low: 38, potato: 51, lossless: 0 },
    vce_av1: { high: 20, medium: 28, low: 38, potato: 51, lossless: 0 },
    mf_h264: { high: 18, medium: 24, low: 32, potato: 51, lossless: 0 },
    mf_h265: { high: 20, medium: 28, low: 38, potato: 51, lossless: 0 },
    theora: { high: 8, medium: 6, low: 3, potato: 0, lossless: 10 }
  };
  function getResolutionArgs(resolutionKey, videoResolution) {
    const heightMap = { "4k": 2160, "1440p": 1440, "1080p": 1080, "720p": 720, "480p": 480 };
    const targetShort = heightMap[resolutionKey];
    if (!targetShort) return [];
    if (videoResolution) {
      const parts = videoResolution.split("x");
      if (parts.length === 2) {
        const srcW = parseInt(parts[0], 10);
        const srcH = parseInt(parts[1], 10);
        if (srcW > 0 && srcH > 0) {
          const isPortrait = srcH > srcW;
          let outW, outH;
          if (isPortrait) {
            outW = targetShort;
            outH = Math.round(srcH * (targetShort / srcW));
            if (outH % 2 !== 0) outH++;
          } else {
            outH = targetShort;
            outW = Math.round(srcW * (targetShort / srcH));
            if (outW % 2 !== 0) outW++;
          }
          return ["--width", String(outW), "--height", String(outH)];
        }
      }
    }
    return ["--maxHeight", String(targetShort), "--keep-display-aspect"];
  }
  function buildCliArgs(filePath, outputPath, settings, videoResolution) {
    const args = ["-i", filePath, "-o", outputPath];
    if (settings.format) args.push("-f", settings.format);
    let encoder = settings.encoder || "x265";
    const WEBM_VIDEO = /* @__PURE__ */ new Set(["vp8", "vp9", "vp9_10bit", "svt_av1", "svt_av1_10bit", "nvenc_av1", "qsv_av1", "vce_av1"]);
    const WEBM_AUDIO = /* @__PURE__ */ new Set(["vorbis", "opus"]);
    if (settings.format === "av_webm" && !WEBM_VIDEO.has(encoder)) {
      encoder = "vp9";
    }
    args.push("-e", encoder);
    if (settings.encoderSpeed) args.push("--encoder-preset", settings.encoderSpeed);
    const rfTable = CODEC_RF_TABLE[encoder] || CODEC_RF_TABLE.x265;
    const rfValue = settings.quality === "lossless" ? rfTable.lossless : settings.quality === "custom" ? settings.customQuality : rfTable[settings.quality] ?? rfTable.medium;
    args.push("-q", String(rfValue));
    if (settings.resolution && settings.resolution !== "source") {
      args.push(...getResolutionArgs(settings.resolution, videoResolution));
    }
    if (settings.fps && settings.fps !== "source") {
      const fpsMode = settings.fpsMode || "pfr";
      args.push("-r", settings.fps, `--${fpsMode}`);
    } else if (settings.fpsMode && settings.fpsMode !== "vfr") {
      args.push(`--${settings.fpsMode}`);
    }
    if (settings.hwDecoding && settings.hwDecoding !== "none") {
      args.push("--enable-hw-decoding", settings.hwDecoding);
    }
    if (settings.multiPass) {
      args.push("--multi-pass");
    }
    let audioCodec = settings.audioCodec || "av_aac";
    if (settings.format === "av_webm" && !WEBM_AUDIO.has(audioCodec) && !audioCodec.startsWith("copy")) {
      audioCodec = "opus";
    }
    args.push("-a", "1", "-E", audioCodec);
    if (!audioCodec.startsWith("copy")) {
      args.push("-B", String(settings.audioBitrate || "160"));
      args.push("-6", settings.audioMixdown || "stereo");
    }
    if (settings.audioSampleRate && settings.audioSampleRate !== "auto") {
      args.push("-R", settings.audioSampleRate);
    }
    if (settings.chapterMarkers !== false) {
      args.push("-m");
    } else {
      args.push("--no-markers");
    }
    if (settings.optimizeMP4 && settings.format === "av_mp4") {
      args.push("-O");
    }
    if (settings.deinterlace && settings.deinterlace !== "off") {
      if (settings.deinterlace.startsWith("bwdif")) {
        args.push(`--bwdif=${settings.deinterlace.replace("bwdif_", "")}`);
      } else {
        args.push(`--yadif=${settings.deinterlace.replace("yadif_", "")}`);
      }
    }
    if (settings.denoise && settings.denoise !== "off") {
      const parts = settings.denoise.split("_");
      const denoiseType = parts[0];
      const denoisePreset = parts.slice(1).join("_") || "medium";
      args.push(`--${denoiseType}=${denoisePreset}`);
    }
    if (settings.deblock && settings.deblock !== "off") {
      args.push(`--deblock=${settings.deblock}`);
    }
    if (settings.sharpen && settings.sharpen !== "off") {
      const parts = settings.sharpen.split("_");
      const sharpenType = parts[0];
      const sharpenPreset = parts.slice(1).join("_") || "medium";
      args.push(`--${sharpenType}=${sharpenPreset}`);
    }
    if (settings.grayscale) args.push("--grayscale");
    if (settings.rotate && settings.rotate !== "0") {
      const rotateMap = {
        "90": "angle=90:hflip=0",
        "180": "angle=180:hflip=0",
        "270": "angle=270:hflip=0",
        "hflip": "angle=0:hflip=1"
      };
      const rotateArg = rotateMap[settings.rotate];
      if (rotateArg) args.push(`--rotate=${rotateArg}`);
    }
    if (settings.hdrMetadata && settings.hdrMetadata !== "off") {
      args.push("--hdr-dynamic-metadata", settings.hdrMetadata);
    }
    if (settings.keepMetadata) {
      args.push("--keep-metadata");
    }
    if (settings.inlineParamSets) {
      args.push("--inline-parameter-sets");
    }
    const subMode = settings.subtitleMode || "none";
    const extFile = settings.subtitleExternalFile || "";
    if (extFile) {
      args.push("--srt-file", extFile);
      if (settings.subtitleBurn) {
        args.push("--srt-burn", "1");
      } else if (settings.subtitleDefault) {
        args.push("--srt-default", "1");
      }
    } else if (subMode === "first") {
      args.push("--subtitle", "1");
      if (settings.subtitleBurn) {
        args.push("--subtitle-burn", "1");
      } else if (settings.subtitleDefault) {
        args.push("--subtitle-default", "1");
      }
    } else if (subMode === "all") {
      args.push("--all-subtitles");
    } else if (subMode === "scan_forced") {
      args.push("--subtitle", "scan");
      if (settings.subtitleBurn) {
        args.push("--subtitle-burn", "1");
      } else if (settings.subtitleDefault) {
        args.push("--subtitle-default", "1");
      }
    }
    if (subMode !== "none" && !extFile && settings.subtitleLanguage && settings.subtitleLanguage !== "any") {
      args.push("--native-language", settings.subtitleLanguage);
    }
    return args;
  }
  electron.ipcMain.on("run-cli", (event, { filePath, settings, id, outputMode, customOutputDir, outputName, videoResolution }) => {
    const cliPath = getCLIPath();
    const fs = require("fs");
    const rawBase = outputName || filePath.split("\\").pop().split(".").slice(0, -1).join(".");
    const strippedBase = rawBase.replace(/_converted(\s*\(\d+\))?$/i, "").trimEnd();
    const convertedBase = strippedBase + "_converted";
    const ext = settings && FORMAT_EXT[settings.format] || "mkv";
    let outputDir;
    if (outputMode === "source") {
      outputDir = path.dirname(filePath);
    } else if (outputMode === "custom" && customOutputDir) {
      outputDir = customOutputDir;
    } else {
      outputDir = customOutputDir || electron.app.getPath("videos");
      if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    }
    let outputPath = path.join(outputDir, convertedBase + "." + ext);
    if (fs.existsSync(outputPath)) {
      let counter = 1;
      while (fs.existsSync(path.join(outputDir, convertedBase + " (" + counter + ")." + ext))) counter++;
      outputPath = path.join(outputDir, convertedBase + " (" + counter + ")." + ext);
    }
    const fallbackSettings = settings || { format: "av_mkv", encoder: "x265", encoderSpeed: "slow", quality: "high", fps: "source", resolution: "source" };
    let hbInputPath = filePath;
    if (process.platform === "win32" && /[^\x00-\x7F]/.test(filePath)) {
      const { extname } = require("path");
      const { tmpdir } = require("os");
      const asciiLink = path.join(tmpdir(), `gorex_encode_${id}_${Date.now()}${extname(filePath)}`);
      try {
        fs.linkSync(filePath, asciiLink);
        hbInputPath = asciiLink;
      } catch (_) {
      }
    }
    const args = buildCliArgs(hbInputPath, outputPath, fallbackSettings, videoResolution);
    console.log(`Running CLI: ${cliPath} ${args.join(" ")}`);
    const stderrLines = [];
    const child = child_process.spawn(cliPath, args);
    activeJobs.set(id, { child, outputPath });
    child.stdout.on("data", (data) => {
      const str = data.toString();
      let progressValue = null;
      const encodingMatches = [...str.matchAll(/Encoding: task (\d+) of (\d+).*?([\d.]+)\s*%/g)];
      if (encodingMatches.length > 0) {
        const last = encodingMatches[encodingMatches.length - 1];
        const pass = parseInt(last[1]);
        const passCount = parseInt(last[2]);
        const passPercent = parseFloat(last[3]);
        progressValue = (passPercent + (pass - 1) * 100) / passCount;
      }
      if (progressValue !== null && progressValue <= 100) {
        event.sender.send("cli-progress", { id, progress: progressValue });
      }
      event.sender.send("cli-output", str);
    });
    child.stderr.on("data", (data) => {
      const str = data.toString();
      stderrLines.push(str);
      event.sender.send("cli-error", str);
    });
    child.on("close", (code) => {
      if (hbInputPath !== filePath && fs.existsSync(hbInputPath)) {
        try {
          fs.unlinkSync(hbInputPath);
        } catch (_) {
        }
      }
      activeJobs.delete(id);
      event.sender.send("cli-exit", { id, code, outputPath, stderr: stderrLines.join("") });
    });
  });
  electron.ipcMain.on("stop-all-cli", () => {
    const fs = require("fs");
    for (const [jobId, { child, outputPath }] of activeJobs) {
      try {
        if (process.platform === "win32" && child.pid) {
          child_process.exec(`taskkill /F /T /PID ${child.pid}`, () => {
          });
        } else {
          child.kill();
        }
      } catch (_) {
      }
      if (outputPath) {
        try {
          if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        } catch (_) {
        }
      }
      activeJobs.delete(jobId);
    }
  });
  electron.ipcMain.on("pause-all-cli", () => {
    for (const { child } of activeJobs.values()) {
      if (child.pid) {
        child_process.exec(`powershell -Command "Suspend-Process -Id ${child.pid}"`);
      }
    }
  });
  electron.ipcMain.on("resume-all-cli", () => {
    for (const { child } of activeJobs.values()) {
      if (child.pid) {
        child_process.exec(`powershell -Command "Resume-Process -Id ${child.pid}"`);
      }
    }
  });
  electron.ipcMain.handle("get-gpu-info", async () => {
    const VENDOR_LABELS = { nvidia: "NVIDIA", amd: "AMD", intel: "Intel" };
    const priority = { nvidia: 3, amd: 2, intel: 1, unknown: 0 };
    const vendorOfName = (n) => {
      n = n.toLowerCase();
      if (n.includes("nvidia")) return "nvidia";
      if (n.includes("amd") || n.includes("radeon")) return "amd";
      if (n.includes("intel")) return "intel";
      return "unknown";
    };
    const getGpuNames = () => new Promise((res) => {
      const { platform } = process;
      if (platform === "win32") {
        const ps = "C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe";
        child_process.exec(
          `"${ps}" -NoProfile -NonInteractive -Command "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name"`,
          { timeout: 8e3, windowsHide: true },
          (err, stdout) => {
            if (!err && stdout.trim()) {
              return res(stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
            }
            child_process.exec("wmic path win32_VideoController get name /value", { timeout: 5e3, windowsHide: true }, (err2, stdout2) => {
              if (err2) return res([]);
              res(stdout2.split(/\r?\n/).filter((l) => /^Name=/i.test(l)).map((l) => l.replace(/^Name=/i, "").trim()).filter(Boolean));
            });
          }
        );
      } else if (platform === "darwin") {
        child_process.exec("system_profiler SPDisplaysDataType | grep 'Chipset Model' | awk -F': ' '{print $2}'", { timeout: 8e3 }, (err, stdout) => {
          if (!err && stdout.trim()) {
            return res(stdout.split(/\r?\n/).map((s) => s.trim()).filter(Boolean));
          }
          res([]);
        });
      } else {
        child_process.exec("lspci | grep -Ei 'vga|3d controller|display controller'", { timeout: 5e3 }, (err, stdout) => {
          if (!err && stdout.trim()) {
            return res(stdout.split(/\r?\n/).map((l) => l.replace(/^[\da-f:.]+\s+\w[^:]+:\s*/i, "").trim()).filter(Boolean));
          }
          res([]);
        });
      }
    });
    const names = await getGpuNames();
    let finalVendor = "unknown";
    if (names.length > 0) {
      let bestName = null;
      for (const name of names) {
        if (!bestName || priority[vendorOfName(name)] > priority[vendorOfName(bestName)]) {
          bestName = name;
        }
      }
      finalVendor = vendorOfName(bestName);
    }
    if (finalVendor === "unknown") {
      const VENDOR_IDS = { 4318: "nvidia", 4098: "amd", 32902: "intel" };
      try {
        const info = await electron.app.getGPUInfo("basic");
        const devices = info.gpuDevice || [];
        let best = null;
        for (const d of devices) {
          const v = VENDOR_IDS[d.vendorId] || "unknown";
          if (!best || priority[v] > priority[VENDOR_IDS[best.vendorId] || "unknown"]) best = d;
        }
        if (best) finalVendor = VENDOR_IDS[best.vendorId] || "unknown";
      } catch {
      }
    }
    const gpuList = names.length > 0 ? names : finalVendor !== "unknown" ? [`${VENDOR_LABELS[finalVendor]} GPU`] : [];
    const primaryGpu = gpuList.find((n) => vendorOfName(n) === finalVendor) || gpuList[0] || null;
    return { gpus: gpuList, vendor: finalVendor, primaryGpu };
  });
  electron.session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: ["*://*.youtube.com/*", "*://*.youtube-nocookie.com/*", "*://*.googlevideo.com/*", "*://*.ytimg.com/*"] },
    (details, callback) => {
      const headers = { ...details.requestHeaders };
      if (!headers["Referer"] && !headers["referer"]) {
        headers["Referer"] = "https://www.youtube.com/";
      }
      callback({ requestHeaders: headers });
    }
  );
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
