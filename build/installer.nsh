; ==============================================================================
; Gorex - custom NSIS MUI2 theme
; Included by electron-builder BEFORE MUI2 page macros are expanded.
; ==============================================================================

; -- Typography ----------------------------------------------------------------
!define MUI_FONT     "Segoe UI"
!define MUI_FONTSIZE "9"

; -- Welcome page --------------------------------------------------------------
!define MUI_WELCOMEPAGE_TITLE "Welcome to Gorex"
!define MUI_WELCOMEPAGE_TEXT "GPU-accelerated video converter with a modern interface.$\r$\n$\r$\nConvert local files or grab video straight from YouTube, TikTok, Twitter and more - all in one beautiful app.$\r$\n$\r$\nClick Next to continue."

; -- Directory page ------------------------------------------------------------
!define MUI_PAGE_HEADER_TEXT    "Installation folder"
!define MUI_PAGE_HEADER_SUBTEXT "Choose where to install Gorex."

; -- Finish page ---------------------------------------------------------------
!define MUI_FINISHPAGE_TITLE "Gorex is ready"
!define MUI_FINISHPAGE_TEXT "Installation complete.$\r$\n$\r$\nLaunch Gorex to start converting and downloading videos."

; -- Uninstaller ---------------------------------------------------------------
!define MUI_UNWELCOMEPAGE_TITLE "Uninstall Gorex"
!define MUI_UNWELCOMEPAGE_TEXT "This wizard will remove Gorex from your computer.$\r$\n$\r$\nClick Next to continue."

!define MUI_UNFINISHPAGE_TITLE "Gorex has been removed"
!define MUI_UNFINISHPAGE_TEXT "Gorex has been successfully uninstalled from your computer."

; -- Abort confirmation --------------------------------------------------------
!define MUI_ABORTWARNING_TEXT "Cancel Gorex installation?"

; -- Branding strip (bottom of window) ----------------------------------------
!define MUI_BRANDINGTEXT "Gorex - by Akhmatyarov"
