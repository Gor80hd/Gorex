// Shared bridge and theme logic for BPRESS Hybrid UI
const body = document.body;

// Logic for bridge calls
const callBridge = async (method, param = null) => {
    try {
        if (window.chrome?.webview?.hostObjects?.bridge) {
            const bridge = window.chrome.webview.hostObjects.bridge;
            if (param !== null) {
                await bridge[method](param);
            } else {
                await bridge[method]();
            }
        }
    } catch (err) {
        console.error('Bridge call failed:', err);
    }
};

// Theme Synchronization (called from C#)
window.setTheme = (isDark) => {
    console.log("Setting theme, dark:", isDark);
    if (isDark) {
        body.classList.add('dark-theme');
    } else {
        body.classList.remove('dark-theme');
    }
};

console.log("BPRESS Bridge JS Loaded");

