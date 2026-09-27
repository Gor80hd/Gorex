; The legacy GorexSetup uninstaller deletes its entire installation directory.
; Never execute it during migration: user videos may be stored in that folder.
!macro NSIS_HOOK_PREINSTALL
  ReadRegStr $0 HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Gorex" "InstallLocation"
  StrCmp $0 "" gorex_legacy_machine
  IfFileExists "$0\Uninstall Gorex.vbs" 0 gorex_legacy_machine
  IfFileExists "$0\Gorex.exe" 0 gorex_legacy_machine
  IfFileExists "$0.gorex-v2-backup" gorex_legacy_backup_exists

  MessageBox MB_YESNO|MB_ICONQUESTION "An older Gorex installation was found at:$\r$\n$0$\r$\n$\r$\nMove it to $0.gorex-v2-backup before installing Gorex 3? Its files, videos and settings will be preserved. / Найдена старая версия Gorex. Перенести ее в резервную папку? Файлы и настройки сохранятся." /SD IDNO IDNO gorex_legacy_machine
  ClearErrors
  Rename "$0" "$0.gorex-v2-backup"
  IfErrors 0 gorex_legacy_moved
    MessageBox MB_OK|MB_ICONSTOP "Could not move the old Gorex folder. Close the old app and retry. / Не удалось перенести старую папку Gorex. Закройте старое приложение и повторите установку." /SD IDOK
    Abort
  gorex_legacy_moved:
    DeleteRegKey HKCU "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Gorex"
    Goto gorex_legacy_machine

  gorex_legacy_backup_exists:
    MessageBox MB_OK|MB_ICONEXCLAMATION "A previous Gorex backup already exists at $0.gorex-v2-backup. The old installation was left untouched. / Резервная папка уже существует. Старая версия не изменена." /SD IDOK

  gorex_legacy_machine:
    ReadRegStr $1 HKLM "SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\Gorex" "InstallLocation"
    StrCmp $1 "" gorex_legacy_done
    IfFileExists "$1\Uninstall Gorex.vbs" 0 gorex_legacy_done
    MessageBox MB_OK|MB_ICONINFORMATION "A system-wide older Gorex installation was found at $1. It remains installed because this installer does not have administrator privileges. Do not run its uninstaller if it contains your videos. / Найдена общесистемная старая версия Gorex. Она останется установленной; ее деинсталлятор может удалить видео из папки программы." /SD IDOK
  gorex_legacy_done:
!macroend
