// ─── Gorex Content Script ─────────────────────────────────────────────────────
// 1. Injects a floating notification overlay on any supported video page.
// 2. On YouTube watch pages: injects a compact icon bar below the player with
//    format picker panel, audio options, and queue display.
//
// Uses Shadow DOM for both components so YouTube cannot override any styles.

;(function () {
    if (window.__gorexContentScriptLoaded) return
    window.__gorexContentScriptLoaded = true

    // ── Helpers ────────────────────────────────────────────────────────────────
    function escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
    }
    function fmtBytes(b) {
        if (!b) return ''
        if (b >= 1073741824) return (b / 1073741824).toFixed(1) + ' GB'
        if (b >= 1048576)    return (b / 1048576).toFixed(1) + ' MB'
        if (b >= 1024)       return (b / 1024).toFixed(0) + ' KB'
        return b + ' B'
    }
    function fmtTime(secs) {
        const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = Math.floor(secs % 60)
        return h > 0
            ? `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`
            : `${m}:${String(s).padStart(2,'0')}`
    }
    function parseTime(str) {
        if (!str?.trim()) return null
        const p = str.trim().split(':').map(Number)
        if (p.some(isNaN)) return null
        if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2]
        if (p.length === 2) return p[0] * 60 + p[1]
        return p[0] || 0
    }
    function isContextAlive() {
        try { return !!chrome.runtime?.id } catch { return false }
    }

    // ── Shadow DOM helper: inject styles synchronously ─────────────────────────
    const GOREX_CSS = `
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* ── Overlay ── */
        #gorex-queue-overlay {
            width: 300px; background: #1c1c1c;
            border: 1px solid rgba(255,255,255,.1); border-radius: 4px;
            box-shadow: 0 4px 24px rgba(0,0,0,.7);
            font-family: system-ui, -apple-system, sans-serif; font-size: 13px; color: #e2e8f0;
            overflow: hidden; transition: opacity .25s ease, transform .25s ease;
        }
        #gorex-queue-overlay.gorex-hidden   { display: none; }
        #gorex-queue-overlay.gorex-fade-out { opacity: 0; transform: translateY(6px); pointer-events: none; }
        #gorex-queue-overlay.gorex-slide-in { animation: gorex-slide-in .2s cubic-bezier(.22,1,.36,1) both; }
        @keyframes gorex-slide-in { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        .gorex-overlay-header { display:flex; align-items:center; justify-content:space-between; padding:11px 16px; border-bottom:1px solid rgba(255,255,255,.07); }
        .gorex-overlay-logo { display:flex; align-items:center; gap:7px; font-weight:600; font-size:12px; letter-spacing:.04em; color:rgba(255,255,255,.5); text-transform:uppercase; }
        .gorex-close-btn { background:none; border:none; color:rgba(255,255,255,.3); cursor:pointer; padding:3px; display:flex; align-items:center; border-radius:3px; transition:color .15s,background .15s; }
        .gorex-close-btn:hover { color:rgba(255,255,255,.75); background:rgba(255,255,255,.08); }
        .gorex-queue-body { padding:8px 0; max-height:220px; overflow-y:auto; display:flex; flex-direction:column; }
        .gorex-queue-body::-webkit-scrollbar { width:3px; }
        .gorex-queue-body::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:2px; }
        .gorex-toast { display:flex; align-items:center; gap:10px; padding:9px 16px; color:#86efac; animation:gorex-fade-in .15s ease; }
        @keyframes gorex-fade-in { from{opacity:0;} to{opacity:1;} }
        .gorex-toast-text { font-size:13px; color:rgba(255,255,255,.8); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .gorex-queue-row { display:flex; flex-direction:column; gap:5px; padding:8px 16px; }
        .gorex-row-top { display:flex; align-items:center; justify-content:space-between; gap:10px; }
        .gorex-row-title { flex:1; font-size:13px; color:rgba(255,255,255,.75); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .gorex-row-progress { font-size:11px; font-weight:600; color:#3ea6ff; flex-shrink:0; }
        .gorex-row-meta { font-size:11px; color:#a78bfa; }
        .gorex-row-bar { height:2px; background:rgba(255,255,255,.07); border-radius:1px; overflow:hidden; position:relative; }
        .gorex-bar-fill { height:100%; background:#3ea6ff; border-radius:1px; transition:width .4s ease; }
        .gorex-bar-indeterminate { position:absolute; left:0; top:0; height:100%; width:40%; background:#a78bfa; border-radius:1px; animation:gorex-indeterminate 1.4s ease-in-out infinite; }
        @keyframes gorex-indeterminate { 0%{transform:translateX(-100%);} 100%{transform:translateX(350%);} }
        .gorex-bar-pulse { height:100%; width:100%; background:rgba(167,139,250,.35); border-radius:1px; animation:gorex-pulse 2s ease-in-out infinite; }
        @keyframes gorex-pulse { 0%,100%{opacity:.3;} 50%{opacity:.9;} }
        .gorex-remove-btn { background:none; border:none; color:rgba(255,255,255,.2); cursor:pointer; font-size:14px; line-height:1; padding:0 0 0 6px; flex-shrink:0; transition:color .15s; }
        .gorex-remove-btn:hover { color:rgba(255,255,255,.7); }
        .gorex-overlay-footer { padding:9px 16px; border-top:1px solid rgba(255,255,255,.07); }
        .gorex-overlay-footer.hidden { display:none; }
        .gorex-offline-msg { display:flex; align-items:center; gap:7px; font-size:12px; color:#f87171; }

        /* ── Bar ── */
        #gorex-bar {
            font-family: system-ui, -apple-system, sans-serif; font-size:13px; color:#f1f5f9;
            position:relative; display:flex; align-items:center; padding:6px 0; margin:2px 0 8px;
        }
        #grx-trigger-row { display:flex; align-items:center; gap:4px; flex-shrink:0; }

        .grx-icon-btn {
            display:inline-flex; align-items:center; gap:10px; padding:13px 26px;
            background:rgba(255,255,255,.08); border:1px solid transparent; border-radius:3px;
            color:rgba(255,255,255,.65); font-size:14px; font-weight:500;
            font-family:system-ui,-apple-system,sans-serif;
            cursor:pointer; white-space:nowrap; position:relative; line-height:1;
            transition:color .12s,background .12s,border-color .12s;
        }
        .grx-icon-btn:hover { color:#fff; background:rgba(255,255,255,.12); }
        .grx-icon-btn-active { color:#fff; background:rgba(255,255,255,.13); border-color:rgba(255,255,255,.11); }
        .grx-icon-btn svg { flex-shrink:0; }
        .grx-q-badge {
            display:inline-flex; align-items:center; justify-content:center;
            min-width:16px; height:16px; padding:0 4px; border-radius:2px;
            font-size:10px; font-weight:600; background:#3ea6ff; color:#0f0f0f; margin-left:2px; line-height:1;
        }

        /* ── Panels ── */
        .grx-panel {
            display:none; flex-direction:column; position:absolute; bottom:calc(100% + 6px); left:0;
            z-index:9999; width:340px; background:#1c1c1c; border:1px solid rgba(255,255,255,.1);
            border-radius:4px; box-shadow:0 8px 32px rgba(0,0,0,.75),0 2px 8px rgba(0,0,0,.4);
            overflow:hidden; animation:grx-popup-in .13s cubic-bezier(.2,0,.38,1) both;
            font-family:system-ui,-apple-system,sans-serif; color:#f1f5f9;
        }
        @keyframes grx-popup-in { from{opacity:0;transform:translateY(4px);} to{opacity:1;transform:translateY(0);} }
        #grx-panel-queue { left:auto; right:0; }
        .grx-panel-header { display:flex; align-items:center; justify-content:space-between; padding:13px 18px 11px; border-bottom:1px solid rgba(255,255,255,.07); }
        .grx-panel-title { font-size:11px; font-weight:600; color:rgba(255,255,255,.38); text-transform:uppercase; letter-spacing:.08em; user-select:none; }
        .grx-panel-footer { display:flex; align-items:center; justify-content:flex-end; gap:8px; padding:12px 16px 14px; border-top:1px solid rgba(255,255,255,.07); }
        .grx-status { flex:1; font-size:12px; color:transparent; transition:color .2s; display:flex; align-items:center; gap:6px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .grx-status-loading { color:#93c5fd; } .grx-status-ok { color:#86efac; } .grx-status-err { color:#f87171; }
        .grx-status-spin { display:inline-flex; animation:grx-spin .75s linear infinite; }
        @keyframes grx-spin { to { transform:rotate(360deg); } }

        /* ── Buttons ── */
        .grx-btn {
            display:inline-flex; align-items:center; gap:9px; padding:12px 26px;
            border:none; border-radius:3px; font-size:14px; font-weight:500;
            font-family:system-ui,-apple-system,sans-serif;
            cursor:pointer; white-space:nowrap; flex-shrink:0; line-height:1;
            transition:background .12s,opacity .12s;
        }
        .grx-btn:disabled { opacity:.3; cursor:not-allowed; pointer-events:none; }
        .grx-btn svg { flex-shrink:0; }
        .grx-btn-primary { background:#3ea6ff; color:#0f0f0f; }
        .grx-btn-primary:hover:not(:disabled) { background:#5ab5ff; }
        .grx-btn-secondary { background:rgba(255,255,255,.09); color:rgba(255,255,255,.8); border:1px solid rgba(255,255,255,.08); }
        .grx-btn-secondary:hover:not(:disabled) { background:rgba(255,255,255,.13); }

        /* ── Formats ── */
        .grx-loading { display:flex; align-items:center; gap:10px; padding:16px 18px; color:rgba(255,255,255,.35); font-size:13px; }
        .grx-spinner { width:14px; height:14px; border:2px solid rgba(255,255,255,.1); border-top-color:#3ea6ff; border-radius:50%; flex-shrink:0; animation:grx-spin .7s linear infinite; }
        .grx-msg { padding:16px 18px; font-size:13px; color:rgba(255,255,255,.35); display:flex; align-items:center; gap:8px; }
        .grx-msg-error { color:#f87171; } .grx-msg-warn { color:#fbbf24; }
        .grx-formats { display:flex; flex-direction:column; max-height:260px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.1) transparent; }
        .grx-formats::-webkit-scrollbar { width:3px; }
        .grx-formats::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:1px; }
        .grx-fmt-radio { display:none; }
        .grx-fmt-item {
            display:flex; align-items:center; gap:12px; padding:10px 18px;
            cursor:pointer; user-select:none; border-left:2px solid transparent;
            background:transparent; width:100%; text-align:left;
            transition:background .1s;
        }
        .grx-fmt-item:hover { background:rgba(255,255,255,.05); }
        .grx-fmt-selected { background:rgba(62,166,255,.07); border-left-color:#3ea6ff; }
        .grx-fmt-dot { width:14px; height:14px; border-radius:50%; border:2px solid rgba(255,255,255,.2); flex-shrink:0; transition:border-color .12s,background .12s; position:relative; }
        .grx-fmt-selected .grx-fmt-dot { border-color:#3ea6ff; background:#3ea6ff; }
        .grx-fmt-selected .grx-fmt-dot::after { content:''; position:absolute; inset:2px; background:#1c1c1c; border-radius:50%; }
        .grx-fmt-left { display:flex; align-items:center; gap:8px; flex:1; min-width:0; }
        .grx-fmt-right { display:flex; align-items:center; gap:10px; flex-shrink:0; }
        .grx-fmt-info { display:flex; align-items:center; gap:8px; pointer-events:none; flex:1; }
        .grx-badge { flex-shrink:0; padding:2px 5px; border-radius:2px; font-size:9px; font-weight:700; letter-spacing:.05em; line-height:1.4; text-transform:uppercase; }
        .grx-badge-best { background:rgba(62,166,255,.18); color:#3ea6ff; border:1px solid rgba(62,166,255,.28); }
        .grx-badge-hd { background:rgba(255,255,255,.08); color:rgba(255,255,255,.45); border:1px solid rgba(255,255,255,.1); }
        .grx-badge-4k { background:rgba(251,191,36,.13); color:#fbbf24; border:1px solid rgba(251,191,36,.22); }
        .grx-fmt-name { font-size:13px; color:rgba(255,255,255,.85); font-weight:500; }
        .grx-fmt-res { font-size:14px; font-weight:600; color:#f1f5f9; min-width:46px; }
        .grx-fmt-ext { font-size:12px; color:rgba(255,255,255,.32); font-weight:500; }
        .grx-fmt-size { font-size:12px; color:rgba(255,255,255,.26); min-width:52px; text-align:right; }

        /* ── Audio ── */
        .grx-panel-body-padded { padding:14px 18px 10px; display:flex; flex-direction:column; gap:14px; }
        .grx-row-2 { display:flex; gap:10px; }
        .grx-field { flex:1; min-width:0; }
        .grx-lbl { display:flex; align-items:center; gap:5px; font-size:10px; font-weight:600; color:rgba(255,255,255,.28); text-transform:uppercase; letter-spacing:.08em; margin-bottom:6px; user-select:none; }
        .grx-sel { width:100%; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); border-radius:3px; color:#f1f5f9; font-size:13px; font-family:system-ui,-apple-system,sans-serif; padding:7px 10px; cursor:pointer; outline:none; transition:border-color .15s; appearance:auto; }
        .grx-sel:focus { border-color:rgba(62,166,255,.5); }
        .grx-trim-block { display:flex; flex-direction:column; gap:7px; }
        .grx-trim-row { display:flex; align-items:center; gap:7px; }
        .grx-trim-lbl { font-size:12px; color:rgba(255,255,255,.28); flex-shrink:0; min-width:16px; }
        .grx-time-in { width:70px; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.1); border-radius:3px; color:#f1f5f9; font-size:13px; font-family:system-ui,-apple-system,sans-serif; padding:7px 9px; outline:none; transition:border-color .15s; text-align:center; }
        .grx-time-in:focus { border-color:rgba(62,166,255,.5); }
        .grx-time-in::placeholder { color:rgba(255,255,255,.14); }
        .grx-sync-btn { background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.09); border-radius:3px; color:rgba(255,255,255,.32); cursor:pointer; padding:6px 9px; display:inline-flex; align-items:center; transition:background .15s,color .15s; flex-shrink:0; line-height:1; }
        .grx-sync-btn:hover { background:rgba(255,255,255,.11); color:rgba(255,255,255,.8); }

        /* ── Queue ── */
        .grx-queue-list { padding:6px 0 10px; display:flex; flex-direction:column; max-height:280px; overflow-y:auto; scrollbar-width:thin; scrollbar-color:rgba(255,255,255,.08) transparent; }
        .grx-queue-list::-webkit-scrollbar { width:3px; }
        .grx-queue-list::-webkit-scrollbar-thumb { background:rgba(255,255,255,.1); border-radius:1px; }
        .grx-empty { padding:20px 18px; font-size:13px; color:rgba(255,255,255,.26); }
        .grx-q-item { padding:10px 18px; display:flex; flex-direction:column; gap:7px; border-bottom:1px solid rgba(255,255,255,.05); }
        .grx-q-item:last-child { border-bottom:none; }
        .grx-q-row { display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .grx-q-title { font-size:13px; color:rgba(255,255,255,.78); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; line-height:1.4; }
        .grx-q-lbl { display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; flex-shrink:0; color:rgba(255,255,255,.3); }
        .grx-qs-downloading,.grx-qs-converting,.grx-qs-encoding { color:#3ea6ff; }
        .grx-qs-done { color:#4ade80; } .grx-qs-error { color:#f87171; }
        .grx-qs-ready,.grx-qs-format_select { color:#fbbf24; }
        .grx-qs-downloading-subs { color:#a78bfa; }
        .grx-q-bar { height:2px; background:rgba(255,255,255,.07); border-radius:1px; overflow:hidden; }
        .grx-q-fill { height:100%; background:#3ea6ff; border-radius:1px; transition:width .6s ease; min-width:3px; }
    `

    function attachStyles(shadow) {
        const style = document.createElement('style')
        style.textContent = GOREX_CSS
        shadow.appendChild(style)
    }

    // ── Gorex Logo ─────────────────────────────────────────────────────────────
    const GOREX_LOGO_SVG = `<svg width="16" height="16" viewBox="0 0 1024 1024" fill="none">
        <path d="M475 47C479 46 487 46 490 46C610 48 717 120 761 233C786 300 787 375 759 441L598 441C612 423 622 407 629 385C640 347 638 305 619 270C599 235 569 207 530 196C491 184 450 189 414 208C378 228 356 260 345 299C326 370 361 440 426 472C444 482 462 486 483 488C445 527 405 565 368 604C346 596 316 575 298 560C240 510 204 439 198 362C192 281 216 207 269 146C324 82 392 53 475 47Z" fill="#a78bfa"/>
        <path d="M600 482C658 483 708 504 750 545C798 591 826 655 827 722C828 789 802 854 755 902C724 933 680 961 637 971C599 980 545 977 504 977L347 977C348 948 347 916 347 886L348 760C348 730 343 691 368 670C375 665 382 661 390 659C402 657 468 658 480 660L481 835C514 835 548 837 581 835C635 833 679 783 681 730C682 700 671 671 650 649C637 635 621 625 603 620C582 614 546 615 523 615C487 615 451 614 415 614C434 593 456 572 476 552C518 509 535 485 600 482Z" fill="#a78bfa"/>
    </svg>`

    // ── Bootstrap Icons (inline SVG) ───────────────────────────────────────────
    const BI = {
        download: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
            <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
        </svg>`,
        music: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M9 13c0 1.105-1.12 2-2.5 2S4 14.105 4 13s1.12-2 2.5-2 2.5.895 2.5 2z"/>
            <path fill-rule="evenodd" d="M9 3v10H8V3h1z"/>
            <path d="M8 2.82a1 1 0 0 1 .804-.98l3-.6A1 1 0 0 1 13 2.22V4L8 5V2.82z"/>
        </svg>`,
        queue: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2 3a.5.5 0 0 0 .5.5h11a.5.5 0 0 0 0-1h-11A.5.5 0 0 0 2 3zm2-2a.5.5 0 0 0 .5.5h7a.5.5 0 0 0 0-1h-7A.5.5 0 0 0 4 1zm2.765 5.576A.5.5 0 0 0 6 7v5a.5.5 0 0 0 .765.424l4-2.5a.5.5 0 0 0 0-.848l-4-2.5zM1.5 14.5A1.5 1.5 0 0 1 0 13V6a1.5 1.5 0 0 1 1.5-1.5h13A1.5 1.5 0 0 1 16 6v7a1.5 1.5 0 0 1-1.5 1.5h-13z"/>
        </svg>`,
        check: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.736 3.97a.733.733 0 0 1 1.047 0c.286.289.29.756.01 1.05L7.88 12.01a.733.733 0 0 1-1.065.02L3.217 8.384a.757.757 0 0 1 0-1.06.733.733 0 0 1 1.047 0l3.052 3.093 5.4-6.425a.247.247 0 0 1 .02-.022Z"/>
        </svg>`,
        x: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
        </svg>`,
        arrow: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>`,
        scissors: `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
            <path d="M3.5 3.5c-.614-.884-.074-1.962.858-2.5L8 7.226 11.642 1c.932.538 1.472 1.616.858 2.5L8.81 8.61l1.556 2.661a2.5 2.5 0 1 1-.794.637L8 9.73l-1.572 2.177a2.5 2.5 0 1 1-.794-.637L7.19 8.61 3.5 3.5zm2.5 10a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0zm7 0a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0z"/>
        </svg>`,
        clockwise: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>`,
        end: `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
            <path d="M12.5 4a.5.5 0 0 0-1 0v3.248L5.233 3.612C4.693 3.3 4 3.678 4 4.308v7.384c0 .63.692 1.01 1.233.697L11.5 8.753V12a.5.5 0 0 0 1 0V4z"/>
        </svg>`,
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PART 1 — Floating notification overlay (all supported sites)
    // Uses Shadow DOM: overlayHost (fixed) → overlayShadow → #gorex-queue-overlay
    // ═══════════════════════════════════════════════════════════════════════════

    let overlay           = null
    let overlayHost       = null
    let hideTimer         = null
    let hideInnerTimer    = null
    let overlayQueueItems = []
    const pendingTitles   = new Map()  // urlKey → browser title (set instantly on add)

    // Stable URL key: YouTube uses video ID, other sites use host+path (strips tracking params)
    function urlKey(url) {
        if (!url) return null
        try {
            const u = new URL(url)
            const v = u.searchParams.get('v')
            if (v) return 'yt:' + v   // YouTube watch: stable regardless of &t=, &feature= etc.
            return u.hostname + u.pathname
        } catch { return url }
    }

    function getPageTitle() {
        // Try YouTube-specific title element first, fallback to document.title
        const ytTitle = document.querySelector('ytd-watch-metadata h1')?.textContent?.trim()
                     || document.querySelector('#above-the-fold h1')?.textContent?.trim()
        if (ytTitle) return ytTitle
        return document.title.replace(/ [-–|].+$/, '').trim() || document.title
    }

    function getOrCreateOverlay() {
        if (overlay) return overlay

        overlayHost = document.createElement('div')
        overlayHost.id = 'gorex-overlay-host'
        overlayHost.style.cssText = 'all:initial;position:fixed;bottom:20px;right:20px;z-index:2147483647;'
        const shadow = overlayHost.attachShadow({ mode: 'open' })
        attachStyles(shadow)

        overlay = document.createElement('div')
        overlay.id = 'gorex-queue-overlay'
        overlay.innerHTML = `
            <div class="gorex-overlay-header">
                <div class="gorex-overlay-logo">
                    ${GOREX_LOGO_SVG}
                    <span>Gorex</span>
                </div>
                <button class="gorex-close-btn" id="gorex-close-btn" title="Скрыть">
                    ${BI.x}
                </button>
            </div>
            <div id="gorex-queue-body" class="gorex-queue-body"></div>
            <div id="gorex-overlay-footer" class="gorex-overlay-footer hidden">
                <div class="gorex-offline-msg">
                    ${BI.x}
                    Gorex не запущен
                </div>
            </div>
        `
        shadow.appendChild(overlay)
        document.body.appendChild(overlayHost)

        overlay.querySelector('#gorex-close-btn').addEventListener('click', () => {
            clearTimeout(hideTimer)
            clearTimeout(hideInnerTimer)
            overlay.classList.add('gorex-fade-out')
            hideInnerTimer = setTimeout(() => {
                overlay.classList.add('gorex-hidden')
                overlay.classList.remove('gorex-fade-out')
                stopOverlayPolling()
            }, 280)
        })

        // Event delegation for remove buttons (rows are recreated on each poll)
        overlay.querySelector('#gorex-queue-body').addEventListener('click', (e) => {
            const btn = e.target.closest('.gorex-remove-btn')
            if (!btn) return
            const id = parseInt(btn.dataset.id)
            overlayQueueItems = overlayQueueItems.filter(i => i.id !== id)
            updateOverlayBody()
            if (!isContextAlive()) return
            chrome.runtime.sendMessage({ type: 'GOREX_REMOVE_FROM_QUEUE', id }).catch?.(() => {})
        })

        return overlay
    }

    function showOverlay() {
        const el = getOrCreateOverlay()
        clearTimeout(hideTimer)
        clearTimeout(hideInnerTimer)
        hideTimer = null
        hideInnerTimer = null
        if (el.classList.contains('gorex-hidden')) {
            el.classList.remove('gorex-hidden', 'gorex-fade-out', 'gorex-slide-in')
            void el.offsetWidth  // force reflow to re-trigger animation
            el.classList.add('gorex-slide-in')
        } else {
            el.classList.remove('gorex-fade-out')  // reverse mid-fade smoothly via CSS transition
        }
    }

    function updateOverlayBody() {
        if (!overlay) return
        const body = overlay.querySelector('#gorex-queue-body')

        const active = overlayQueueItems.filter(v =>
            ['ready', 'format_select', 'downloading', 'encoding', 'converting', 'downloading_subs', 'downloading-subs'].includes(v.status)
        )

        // Clean up pendingTitles for finished items
        overlayQueueItems.forEach(v => {
            if (v.status === 'done' || v.status === 'error') pendingTitles.delete(urlKey(v.url))
        })

        // Stable key: use urlKey (strips tracking params) so pending→real transition matches
        const rowKey = item => urlKey(item.url) || (item.id != null ? 'i:' + item.id : null)

        // Index existing rows by key
        const existing = new Map()
        body.querySelectorAll('.gorex-queue-row[data-key]').forEach(r => existing.set(r.dataset.key, r))

        const activeKeys = new Set()

        active.forEach((item, idx) => {
            const key       = rowKey(item)
            const isPending = item._pending === true
            const progress  = Math.round(item.progress || 0)
            const title     = item.title || pendingTitles.get(urlKey(item.url)) || item.url || 'Без названия'
            const barType   = isPending ? 'indeterminate'
                            : item.status === 'format_select' ? 'pulse' : 'fill'
            const metaText  = isPending ? 'Получение метаданных...'
                            : item.status === 'format_select' ? 'В очереди...' : ''
            const showProg  = !isPending && item.status !== 'format_select'
            const showDel   = !isPending && item.id != null

            activeKeys.add(key)

            let row = existing.get(key)

            if (row) {
                // ── Update existing row in-place (no DOM removal = no flicker) ──

                // Title
                const titleEl = row.querySelector('.gorex-row-title')
                if (titleEl && titleEl.textContent !== title) titleEl.textContent = title

                // Progress label
                let progEl = row.querySelector('.gorex-row-progress')
                if (showProg) {
                    if (!progEl) {
                        progEl = document.createElement('span')
                        progEl.className = 'gorex-row-progress'
                        row.querySelector('.gorex-row-top').insertBefore(progEl, row.querySelector('.gorex-remove-btn'))
                    }
                    progEl.textContent = progress + '%'
                } else {
                    progEl?.remove()
                }

                // Bar
                const barEl  = row.querySelector('.gorex-row-bar')
                const barInner = barEl?.firstElementChild
                if (barType === 'fill') {
                    if (barInner?.classList.contains('gorex-bar-fill')) {
                        barInner.style.width = progress + '%'
                    } else if (barEl) {
                        barEl.innerHTML = `<div class="gorex-bar-fill" style="width:${progress}%"></div>`
                    }
                } else if (barType === 'pulse') {
                    if (!barInner?.classList.contains('gorex-bar-pulse') && barEl)
                        barEl.innerHTML = '<div class="gorex-bar-pulse"></div>'
                } else {
                    if (!barInner?.classList.contains('gorex-bar-indeterminate') && barEl)
                        barEl.innerHTML = '<div class="gorex-bar-indeterminate"></div>'
                }

                // Meta text
                let metaEl = row.querySelector('.gorex-row-meta')
                if (metaText) {
                    if (!metaEl) {
                        metaEl = document.createElement('span')
                        metaEl.className = 'gorex-row-meta'
                        row.appendChild(metaEl)
                    }
                    if (metaEl.textContent !== metaText) metaEl.textContent = metaText
                } else {
                    metaEl?.remove()
                }

                // Remove button
                let delBtn = row.querySelector('.gorex-remove-btn')
                if (showDel) {
                    if (!delBtn) {
                        delBtn = document.createElement('button')
                        delBtn.className = 'gorex-remove-btn'
                        delBtn.title = 'Удалить'
                        delBtn.textContent = '✕'
                        row.querySelector('.gorex-row-top').appendChild(delBtn)
                    }
                    delBtn.dataset.id = item.id
                } else {
                    delBtn?.remove()
                }
            } else {
                // ── Create new row ──
                const barHtml = barType === 'indeterminate'
                    ? '<div class="gorex-bar-indeterminate"></div>'
                    : barType === 'pulse'
                        ? '<div class="gorex-bar-pulse"></div>'
                        : `<div class="gorex-bar-fill" style="width:${progress}%"></div>`
                row = document.createElement('div')
                row.className  = 'gorex-queue-row'
                row.dataset.key = key
                row.innerHTML  = `
                    <div class="gorex-row-top">
                        <span class="gorex-row-title">${escapeHtml(title)}</span>
                        ${showProg ? `<span class="gorex-row-progress">${progress}%</span>` : ''}
                        ${showDel  ? `<button class="gorex-remove-btn" data-id="${item.id}" title="Удалить">✕</button>` : ''}
                    </div>
                    <div class="gorex-row-bar">${barHtml}</div>
                    ${metaText ? `<span class="gorex-row-meta">${metaText}</span>` : ''}
                `
            }

            // Ensure correct order
            const target = body.children[idx]
            if (target !== row) body.insertBefore(row, target || null)
        })

        // Remove stale rows
        existing.forEach((row, key) => { if (!activeKeys.has(key)) row.remove() })

        // Only auto-hide when queue is truly empty
        if (active.length === 0) scheduleHide(3000)
        else clearTimeout(hideTimer)
    }

    function scheduleHide(delay) {
        clearTimeout(hideTimer)
        clearTimeout(hideInnerTimer)
        hideTimer = setTimeout(() => {
            if (!overlay) return
            overlay.classList.add('gorex-fade-out')
            hideInnerTimer = setTimeout(() => {
                if (overlay?.classList.contains('gorex-fade-out')) {
                    overlay.classList.add('gorex-hidden')
                    overlay.classList.remove('gorex-fade-out')
                    stopOverlayPolling()
                }
            }, 280)
        }, delay)
    }

    let overlayPollInterval = null
    function startOverlayPolling() {
        stopOverlayPolling()
        overlayPollInterval = setInterval(() => {
            if (!overlay || overlay.classList.contains('gorex-hidden')) {
                stopOverlayPolling(); return
            }
            if (!isContextAlive()) { stopOverlayPolling(); return }
            chrome.runtime.sendMessage({ type: 'GOREX_GET_QUEUE' }, (resp) => {
                if (chrome.runtime.lastError) return
                const footer = overlay?.querySelector('#gorex-overlay-footer')
                if (resp?.ok) {
                    overlayQueueItems = resp.data?.queue || []
                    updateOverlayBody()
                    footer?.classList.add('hidden')
                } else {
                    footer?.classList.remove('hidden')
                }
            })
        }, 1500)
    }
    function stopOverlayPolling() {
        if (overlayPollInterval) { clearInterval(overlayPollInterval); overlayPollInterval = null }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PART 2 — YouTube compact icon bar + format picker
    // Uses Shadow DOM: barHost (in YT flow) → barShadow → #gorex-bar
    // ═══════════════════════════════════════════════════════════════════════════

    const isYT      = () => location.hostname === 'www.youtube.com' || location.hostname === 'youtu.be'
    const isYTWatch = () => isYT() && /^\/watch(\?|$)/.test(location.pathname)

    let barHost        = null
    let barShadow      = null
    let barObserver    = null
    let barQueueTimer  = null
    let barActivePanel = null
    let barFormatsCache = null
    let barFetching    = false
    let barLastQueue   = []
    let barSelectedFid = null

    // Helper: query inside bar shadow
    const BS  = (id)  => barShadow?.getElementById(id)
    const BSQ = (sel) => barShadow?.querySelector(sel)
    const BSQA = (sel) => barShadow?.querySelectorAll(sel) || []

    // ── Inject the bar ─────────────────────────────────────────────────────────
    function injectPlayerBar() {
        if (!isYTWatch()) return
        if (document.getElementById('gorex-bar-host')) return

        const target = document.querySelector('ytd-watch-metadata')
                    || document.querySelector('#above-the-fold')
                    || document.querySelector('#info-contents')
        if (!target) {
            watchForTarget('ytd-watch-metadata, #above-the-fold', injectPlayerBar)
            return
        }

        barHost = document.createElement('div')
        barHost.id = 'gorex-bar-host'
        barShadow = barHost.attachShadow({ mode: 'open' })
        attachStyles(barShadow)

        const bar = document.createElement('div')
        bar.id = 'gorex-bar'
        bar.innerHTML = `
            <!-- ── Trigger icon row ── -->
            <div id="grx-trigger-row">
                <button class="grx-icon-btn" data-panel="video" title="Скачать видео">
                    ${BI.download}
                    <span>Видео</span>
                </button>
                <button class="grx-icon-btn" data-panel="audio" title="Скачать аудио">
                    ${BI.music}
                    <span>Аудио</span>
                </button>
            </div>

            <!-- ── Video format popup ── -->
            <div id="grx-panel-video" class="grx-panel" style="display:none">
                <div class="grx-panel-header">
                    <span class="grx-panel-title">Качество видео</span>
                    <span id="grx-video-status" class="grx-status"></span>
                </div>
                <div id="grx-formats" class="grx-formats">
                    <div class="grx-loading">
                        <span class="grx-spinner"></span>
                        Получение форматов…
                    </div>
                </div>
                <div class="grx-panel-body-padded" style="border-top:1px solid rgba(255,255,255,.07)">
                    <div class="grx-trim-block">
                        <label class="grx-lbl">${BI.scissors} Обрезка</label>
                        <div class="grx-trim-row">
                            <span class="grx-trim-lbl">С</span>
                            <button class="grx-sync-btn" id="grx-v-goto-start" title="Начало (0:00)">⏮</button>
                            <input type="text" id="grx-v-from" class="grx-time-in" placeholder="0:00">
                            <button class="grx-sync-btn" id="grx-v-sync-from" title="Текущая позиция">
                                ${BI.clockwise}
                            </button>
                            <span class="grx-trim-lbl">По</span>
                            <button class="grx-sync-btn" id="grx-v-sync-to" title="Текущая позиция">
                                ${BI.clockwise}
                            </button>
                            <input type="text" id="grx-v-to" class="grx-time-in" placeholder="конец">
                            <button class="grx-sync-btn" id="grx-v-goto-end" title="Конец видео">
                                ${BI.end}
                            </button>
                        </div>
                    </div>
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:rgba(255,255,255,.65);margin-top:4px">
                        <input type="checkbox" id="grx-convert-cb" style="accent-color:#3ea6ff;width:14px;height:14px;cursor:pointer">
                        Конвертировать
                    </label>
                </div>
                <div class="grx-panel-footer">
                    <button id="grx-dl-now" class="grx-btn grx-btn-primary" disabled>
                        ${BI.download}
                        Скачать
                    </button>
                </div>
            </div>

            <!-- ── Audio popup ── -->
            <div id="grx-panel-audio" class="grx-panel" style="display:none">
                <div class="grx-panel-header">
                    <span class="grx-panel-title">Аудио</span>
                    <span id="grx-audio-status" class="grx-status"></span>
                </div>
                <div class="grx-panel-body-padded">
                    <div class="grx-row-2">
                        <div class="grx-field">
                            <label class="grx-lbl">Формат</label>
                            <select class="grx-sel" id="grx-ext">
                                <option value="mp3">MP3</option>
                                <option value="m4a">M4A (AAC)</option>
                                <option value="opus">Opus</option>
                                <option value="wav">WAV</option>
                            </select>
                        </div>
                        <div class="grx-field">
                            <label class="grx-lbl">Качество</label>
                            <select class="grx-sel" id="grx-aq">
                                <option value="0">320 kbps</option>
                                <option value="2" selected>192 kbps</option>
                                <option value="5">128 kbps</option>
                                <option value="9">64 kbps</option>
                            </select>
                        </div>
                    </div>
                    <div class="grx-trim-block">
                        <label class="grx-lbl">${BI.scissors} Обрезка</label>
                        <div class="grx-trim-row">
                            <span class="grx-trim-lbl">С</span>
                            <button class="grx-sync-btn" id="grx-goto-start" title="Начало (0:00)">⏮</button>
                            <input type="text" id="grx-from" class="grx-time-in" placeholder="0:00">
                            <button class="grx-sync-btn" id="grx-sync-from" title="Текущая позиция">
                                ${BI.clockwise}
                            </button>
                            <span class="grx-trim-lbl">По</span>
                            <button class="grx-sync-btn" id="grx-sync-to" title="Текущая позиция">
                                ${BI.clockwise}
                            </button>
                            <input type="text" id="grx-to" class="grx-time-in" placeholder="конец">
                            <button class="grx-sync-btn" id="grx-goto-end" title="Конец видео">
                                ${BI.end}
                            </button>
                        </div>
                    </div>
                </div>
                <div class="grx-panel-footer">
                    <button id="grx-dl-audio" class="grx-btn grx-btn-primary">
                        ${BI.download}
                        Скачать
                    </button>
                </div>
            </div>

        `
        barShadow.appendChild(bar)
        target.parentNode.insertBefore(barHost, target)
        bindBarEvents(bar)
        startBarQueuePoll()

        // Close panels on outside click (composedPath works across Shadow DOM)
        document.addEventListener('click', (e) => {
            if (!barShadow || !barActivePanel) return
            const path = e.composedPath()
            const onBtn   = path.some(el => el?.classList?.contains?.('grx-icon-btn'))
            const onPanel = path.some(el => el?.classList?.contains?.('grx-panel'))
            if (!onBtn && !onPanel) {
                BSQA('.grx-panel').forEach(p => { p.style.display = 'none' })
                BSQA('.grx-icon-btn').forEach(b => b.classList.remove('grx-icon-btn-active'))
                barActivePanel = null
            }
        }, true)
    }

    function bindBarEvents(bar) {
        bar.querySelectorAll('.grx-icon-btn[data-panel]').forEach(btn =>
            btn.addEventListener('click', () => barTogglePanel(btn.dataset.panel))
        )
        bar.querySelector('#grx-dl-now')?.addEventListener('click', () => barVideoAction())
        bar.querySelector('#grx-dl-audio')?.addEventListener('click', () => barAudioAction())
        // Audio trim buttons
        bar.querySelector('#grx-goto-start')?.addEventListener('click', () => {
            if (BS('grx-from')) BS('grx-from').value = '0:00'
        })
        bar.querySelector('#grx-sync-from')?.addEventListener('click', () => {
            const v = document.querySelector('video')
            if (v) BS('grx-from').value = fmtTime(Math.floor(v.currentTime))
        })
        bar.querySelector('#grx-sync-to')?.addEventListener('click', () => {
            const v = document.querySelector('video')
            if (v) BS('grx-to').value = fmtTime(Math.floor(v.currentTime))
        })
        bar.querySelector('#grx-goto-end')?.addEventListener('click', () => {
            const v = document.querySelector('video')
            if (v) BS('grx-to').value = fmtTime(Math.floor(v.duration || 0))
        })
        // Video trim buttons
        bar.querySelector('#grx-v-goto-start')?.addEventListener('click', () => {
            if (BS('grx-v-from')) BS('grx-v-from').value = '0:00'
        })
        bar.querySelector('#grx-v-sync-from')?.addEventListener('click', () => {
            const v = document.querySelector('video')
            if (v) BS('grx-v-from').value = fmtTime(Math.floor(v.currentTime))
        })
        bar.querySelector('#grx-v-sync-to')?.addEventListener('click', () => {
            const v = document.querySelector('video')
            if (v) BS('grx-v-to').value = fmtTime(Math.floor(v.currentTime))
        })
        bar.querySelector('#grx-v-goto-end')?.addEventListener('click', () => {
            const v = document.querySelector('video')
            if (v) BS('grx-v-to').value = fmtTime(Math.floor(v.duration || 0))
        })
    }

    // ── Panel toggle ───────────────────────────────────────────────────────────
    function barTogglePanel(panelId) {
        if (!barShadow) return

        if (barActivePanel === panelId) {
            BSQA('.grx-panel').forEach(p => { p.style.display = 'none' })
            BSQA('.grx-icon-btn').forEach(b => b.classList.remove('grx-icon-btn-active'))
            barActivePanel = null
            return
        }

        barActivePanel = panelId
        BSQA('.grx-panel').forEach(p => { p.style.display = 'none' })
        BSQA('.grx-icon-btn').forEach(b => b.classList.remove('grx-icon-btn-active'))

        const panel = BS(`grx-panel-${panelId}`)
        const btn   = BSQ(`.grx-icon-btn[data-panel="${panelId}"]`)
        if (panel) panel.style.display = 'flex'
        btn?.classList.add('grx-icon-btn-active')

        if (panelId === 'video') barLoadFormats()
        if (panelId === 'queue') barRenderQueuePanel(barLastQueue)
    }

    // ── Video: fetch formats ───────────────────────────────────────────────────
    function barLoadFormats() {
        const container = BS('grx-formats')
        if (!container) return
        if (barFormatsCache) { barRenderFormats(container, barFormatsCache); return }
        if (barFetching) return
        barFetching = true
        container.innerHTML = `<div class="grx-loading"><span class="grx-spinner"></span> Получение форматов…</div>`
        chrome.runtime.sendMessage({ type: 'GOREX_GET_FORMATS', url: location.href }, resp => {
            barFetching = false
            if (chrome.runtime.lastError || !resp) {
                container.innerHTML = `<div class="grx-msg grx-msg-error">${BI.x} Ошибка связи с расширением</div>`
                return
            }
            if (!resp.ok) {
                const offline = resp.error === 'APP_OFFLINE'
                container.innerHTML = `<div class="grx-msg ${offline ? 'grx-msg-warn' : 'grx-msg-error'}">${BI.x} ${escapeHtml(offline ? 'Gorex не запущен — откройте приложение' : (resp.error || 'Ошибка'))}</div>`
                return
            }
            barFormatsCache = resp.data
            barSelectedFid = null
            barRenderFormats(container, resp.data)
        })
    }

    function barRenderFormats(container, data) {
        const formats  = data.formats || []
        const byHeight = new Map()
        for (const f of formats) {
            if (!f.height) continue
            const ex = byHeight.get(f.height)
            if (!ex || (f.tbr || 0) > (ex.tbr || 0)) byHeight.set(f.height, f)
        }
        const sorted = [...byHeight.values()].sort((a, b) => (b.height || 0) - (a.height || 0))

        let html = ''

        html += `<label class="grx-fmt-item ${barSelectedFid === null ? 'grx-fmt-selected' : ''}" data-fid="">
            <input type="radio" name="grx-fmt" value="" ${barSelectedFid === null ? 'checked' : ''} class="grx-fmt-radio">
            <span class="grx-fmt-dot"></span>
            <span class="grx-fmt-left">
                <span class="grx-fmt-name">Лучшее качество</span>
                <span class="grx-badge grx-badge-best">BEST</span>
            </span>
        </label>`

        for (const f of sorted) {
            const size  = f.filesize ? `<span class="grx-fmt-size">${fmtBytes(f.filesize)}</span>` : '<span class="grx-fmt-size"></span>'
            const badge = f.height >= 2160 ? `<span class="grx-badge grx-badge-4k">4K</span>`
                        : f.height >= 1080 ? `<span class="grx-badge grx-badge-hd">HD</span>` : ''
            const isSelected = barSelectedFid === f.format_id
            html += `<label class="grx-fmt-item ${isSelected ? 'grx-fmt-selected' : ''}" data-fid="${escapeHtml(f.format_id)}">
                <input type="radio" name="grx-fmt" value="${escapeHtml(f.format_id)}" ${isSelected ? 'checked' : ''} class="grx-fmt-radio">
                <span class="grx-fmt-dot"></span>
                <span class="grx-fmt-left">
                    <span class="grx-fmt-res">${f.height}p</span>
                    ${badge}
                </span>
                <span class="grx-fmt-right">
                    <span class="grx-fmt-ext">${(f.ext || 'mp4').toUpperCase()}</span>
                    ${size}
                </span>
            </label>`
        }

        container.innerHTML = html

        container.querySelectorAll('.grx-fmt-radio').forEach(radio => {
            radio.addEventListener('change', () => {
                barSelectedFid = radio.value || null
                container.querySelectorAll('.grx-fmt-item').forEach(item => {
                    item.classList.toggle('grx-fmt-selected', item.dataset.fid === (barSelectedFid ?? ''))
                })
            })
        })

        const dlBtn = BS('grx-dl-now')
        if (dlBtn) dlBtn.disabled = false
    }

    // ── Video action ────────────────────────────────────────────────────────────
    async function barVideoAction() {
        const fromStr  = BS('grx-v-from')?.value?.trim()
        const toStr    = BS('grx-v-to')?.value?.trim()
        const clipStart = fromStr ? parseTime(fromStr) : null
        const clipEnd   = toStr   ? parseTime(toStr)   : null
        const convertAfterDownload = BS('grx-convert-cb')?.checked ?? false
        await barQuickAdd({
            audioOnly: false,
            ...(barSelectedFid ? { formatId: barSelectedFid } : {}),
            clipStart,
            clipEnd,
            convertAfterDownload,
        }, 'grx-video-status')
    }

    // ── Audio action ────────────────────────────────────────────────────────────
    async function barAudioAction() {
        const ext      = BS('grx-ext')?.value   || 'mp3'
        const aq       = BS('grx-aq')?.value    || '2'
        const fromStr  = BS('grx-from')?.value?.trim()
        const toStr    = BS('grx-to')?.value?.trim()
        const clipStart = fromStr ? parseTime(fromStr) : null
        const clipEnd   = toStr   ? parseTime(toStr)   : null
        await barQuickAdd({ audioOnly: true, audioFormat: ext, audioQuality: aq, clipStart, clipEnd }, 'grx-audio-status')
    }

    // ── Common add-to-queue ────────────────────────────────────────────────────
    async function barQuickAdd(opts, statusId) {
        const url      = location.href
        const title    = getPageTitle()
        const statusEl = statusId ? BS(statusId) : null
        const allBtns  = BSQA('button')

        // Immediately show overlay with browser title before API responds
        pendingTitles.set(urlKey(url), title)
        overlayQueueItems = overlayQueueItems.filter(i => i.url !== url)
        overlayQueueItems.push({ url, title, status: 'ready', progress: 0, _pending: true })
        showOverlay()
        updateOverlayBody()
        startOverlayPolling()

        allBtns.forEach(b => { b.disabled = true })
        if (statusEl) {
            statusEl.innerHTML = `<span class="grx-status-spin">${BI.arrow}</span> Добавление…`
            statusEl.className = 'grx-status grx-status-loading'
        }

        try {
            await new Promise((resolve, reject) => {
                chrome.runtime.sendMessage(
                    { type: 'GOREX_ADD_TO_QUEUE', payload: { url, ...opts } },
                    resp => {
                        if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message))
                        else if (resp?.ok) resolve()
                        else reject(new Error(resp?.error || 'Ошибка'))
                    }
                )
            })
            if (statusEl) {
                statusEl.innerHTML = `${BI.check} Добавлено`
                statusEl.className = 'grx-status grx-status-ok'
            }
            // Close the current panel — queue is shown in overlay
            BSQA('.grx-panel').forEach(p => { p.style.display = 'none' })
            BSQA('.grx-icon-btn').forEach(b => b.classList.remove('grx-icon-btn-active'))
            barActivePanel = null
        } catch (e) {
            // Remove the optimistic item on failure
            overlayQueueItems = overlayQueueItems.filter(i => i.url !== url)
            pendingTitles.delete(urlKey(url))
            updateOverlayBody()
            const msg = e.message?.includes('OFFLINE') ? 'Gorex не запущен' : (e.message || 'Ошибка')
            if (statusEl) {
                statusEl.innerHTML = `${BI.x} ${escapeHtml(msg)}`
                statusEl.className = 'grx-status grx-status-err'
            }
        } finally {
            allBtns.forEach(b => { b.disabled = false })
            if (!barFormatsCache) {
                const dlBtn = BS('grx-dl-now')
                if (dlBtn) dlBtn.disabled = true
            }
            setTimeout(() => {
                if (statusEl) { statusEl.innerHTML = ''; statusEl.className = 'grx-status' }
            }, 3000)
        }
    }

    // ── Queue polling ──────────────────────────────────────────────────────────
    function startBarQueuePoll() {
        stopBarQueuePoll()
        barPollQueue()
        barQueueTimer = setInterval(barPollQueue, 3000)
    }
    function stopBarQueuePoll() {
        if (barQueueTimer) { clearInterval(barQueueTimer); barQueueTimer = null }
    }

    function barPollQueue() {
        if (!isContextAlive()) { stopBarQueuePoll(); return }
        try {
            chrome.runtime.sendMessage({ type: 'GOREX_GET_QUEUE' }, resp => {
                if (chrome.runtime.lastError) return
                barLastQueue = resp?.ok ? (resp.data?.queue || []) : []
            })
        } catch { stopBarQueuePoll() }
    }

    const Q_LABELS = {
        ready: 'Ожидание', format_select: 'Выбор формата',
        downloading: 'Загрузка', 'downloading-subs': 'Субтитры',
        converting: 'Конвертация', encoding: 'Кодирование',
        done: 'Готово', error: 'Ошибка',
    }

    function barRenderQueuePanel(queue) {
        const el = BS('grx-queue-list')
        if (!el) return
        if (!queue?.length) {
            el.innerHTML = '<div class="grx-empty">Очередь пуста</div>'
            return
        }
        el.innerHTML = queue.map(item => {
            const lbl    = Q_LABELS[item.status] || item.status
            const prog   = ['downloading','converting','encoding','downloading-subs'].includes(item.status)
                ? Math.round(item.progress || 0) : null
            const isDone  = item.status === 'done'
            const isError = item.status === 'error'
            return `
                <div class="grx-q-item">
                    <div class="grx-q-row">
                        <span class="grx-q-title">${escapeHtml(item.title || item.url || 'Без названия')}</span>
                        <span class="grx-q-lbl grx-qs-${escapeHtml(item.status)}">
                            ${isDone ? BI.check : isError ? BI.x : ''}
                            ${escapeHtml(lbl)}${prog !== null ? ' ' + prog + '%' : ''}
                        </span>
                    </div>
                    ${prog !== null ? `<div class="grx-q-bar"><div class="grx-q-fill" style="width:${prog}%"></div></div>` : ''}
                </div>
            `
        }).join('')
    }

    // ── MutationObserver helper ────────────────────────────────────────────────
    function watchForTarget(selector, callback) {
        if (barObserver) barObserver.disconnect()
        barObserver = new MutationObserver(() => {
            if (document.querySelector(selector)) {
                barObserver.disconnect(); barObserver = null; callback()
            }
        })
        barObserver.observe(document.documentElement, { childList: true, subtree: true })
    }

    function removePlayerBar() {
        stopBarQueuePoll()
        if (barObserver) { barObserver.disconnect(); barObserver = null }
        document.getElementById('gorex-bar-host')?.remove()
        barHost        = null
        barShadow      = null
        barFormatsCache = null
        barFetching    = false
        barActivePanel = null
        barLastQueue   = []
        barSelectedFid = null
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PART 3 — SPA navigation handling (YouTube pushState)
    // ═══════════════════════════════════════════════════════════════════════════

    window.addEventListener('yt-navigate-finish', () => {
        removePlayerBar()
        if (isYTWatch()) setTimeout(injectPlayerBar, 350)
    })

    let lastHref = location.href
    new MutationObserver(() => {
        if (location.href !== lastHref) {
            lastHref = location.href
            if (isYT()) {
                removePlayerBar()
                if (isYTWatch()) setTimeout(injectPlayerBar, 350)
            }
        }
    }).observe(document, { subtree: true, childList: true })

    // ═══════════════════════════════════════════════════════════════════════════
    // PART 4 — Message listener (from background service worker)
    // ═══════════════════════════════════════════════════════════════════════════

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === 'GOREX_QUEUED') {
            // Save browser title immediately so overlay shows it before Gorex responds
            const title = msg.title || getPageTitle()
            if (msg.url) pendingTitles.set(urlKey(msg.url), title)

            // Add optimistic item if not already in queue (e.g. added via popup)
            if (msg.url && !overlayQueueItems.find(i => i.url === msg.url)) {
                overlayQueueItems.push({ url: msg.url, title, status: 'ready', progress: 0, _pending: true })
            }

            showOverlay()
            updateOverlayBody()
            startOverlayPolling()
        }
    })

    // ═══════════════════════════════════════════════════════════════════════════
    // Initial injection
    // ═══════════════════════════════════════════════════════════════════════════

    if (isYTWatch()) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => setTimeout(injectPlayerBar, 700))
        } else {
            setTimeout(injectPlayerBar, 700)
        }
    }
})()
