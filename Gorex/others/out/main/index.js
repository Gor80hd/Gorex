"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const child_process = require("child_process");
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1024,
    height: 768,
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
  utils.electronApp.setAppUserModelId("com.handbrake.webui");
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
  electron.ipcMain.handle("select-files", async () => {
    const { canceled, filePaths } = await electron.dialog.showOpenDialog({
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "Videos", extensions: ["mp4", "mkv", "avi", "mov"] }
      ]
    });
    return canceled ? [] : filePaths;
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
        const duration = metadata.format.duration;
        const formatDuration = (s) => {
          const hrs = Math.floor(s / 3600);
          const mins = Math.floor(s % 3600 / 60);
          const secs = Math.floor(s % 60);
          return `${hrs > 0 ? hrs + ":" : ""}${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
        };
        const thumbName = `thumb-${Date.now()}-${index}.jpg`;
        const thumbPath = path.join(thumbDir, thumbName);
        await new Promise((resolve, reject) => {
          ffmpeg(filePath).screenshots({
            timestamps: ["10%"],
            folder: thumbDir,
            filename: thumbName,
            size: "320x180"
          }).on("end", resolve).on("error", reject);
        });
        results.push({
          id: index,
          title: filePath.split("\\").pop(),
          path: filePath,
          meta: `${videoStream?.codec_name || "unknown"}, ${videoStream?.width}x${videoStream?.height}, ${formatDuration(duration)}`,
          size: (metadata.format.size / (1024 * 1024 * 1024)).toFixed(2) + " GB",
          thumbnail: `file://${thumbPath}`
        });
      } catch (err) {
        console.error(`Failed to process ${filePath}:`, err);
      }
    }
    return results;
  });
  electron.ipcMain.on("run-cli", (event, { filePath, preset, id }) => {
    const cliPath = "e:\\Sites\\HandBrake\\build\\HandBrakeCLI.exe";
    const outputDir = path.join(electron.app.getPath("userData"), "output");
    if (!require("fs").existsSync(outputDir)) require("fs").mkdirSync(outputDir);
    const fileName = filePath.split("\\").pop().split(".").slice(0, -1).join(".") + ".mp4";
    const outputPath = path.join(outputDir, fileName);
    const args = [
      "-i",
      filePath,
      "-o",
      outputPath,
      "--preset",
      preset
    ];
    console.log(`Running CLI: ${cliPath} ${args.join(" ")}`);
    const child = child_process.spawn(cliPath, args);
    child.stdout.on("data", (data) => {
      const str = data.toString();
      const progressMatch = str.match(/([\d.]+)\s*%/);
      if (progressMatch) {
        event.sender.send("cli-progress", { id, progress: parseFloat(progressMatch[1]) });
      }
      event.sender.send("cli-output", str);
    });
    child.stderr.on("data", (data) => {
      event.sender.send("cli-error", data.toString());
    });
    child.on("close", (code) => {
      event.sender.send("cli-exit", { id, code, outputPath });
    });
  });
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
