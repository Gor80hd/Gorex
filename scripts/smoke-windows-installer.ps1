$ErrorActionPreference = 'Stop'

$installer = Get-ChildItem 'src-tauri/target/release/bundle/nsis' -Filter '*.exe' | Select-Object -First 1
if ($null -eq $installer) { throw 'NSIS installer was not built' }

$target = Join-Path $env:RUNNER_TEMP 'GorexTauriInstallSmoke'
$installation = Start-Process -FilePath $installer.FullName -ArgumentList @('/S', "/D=$target") -Wait -PassThru
if ($installation.ExitCode -ne 0) { throw "Installer exited with $($installation.ExitCode)" }

foreach ($name in @('Gorex.exe', 'ffmpeg.exe', 'ffprobe.exe', 'yt-dlp.exe', 'deno.exe', 'TwitchDownloaderCLI.exe')) {
    $found = Get-ChildItem $target -Filter $name -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($null -eq $found) { throw "Installed package is missing $name" }
}

$uninstaller = Get-ChildItem $target -Filter '*uninstall*.exe' -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
if ($null -eq $uninstaller) { throw 'Installed package is missing the uninstaller' }
$removal = Start-Process -FilePath $uninstaller.FullName -ArgumentList '/S' -Wait -PassThru
if ($removal.ExitCode -ne 0) { throw "Uninstaller exited with $($removal.ExitCode)" }

Write-Host "NSIS install and uninstall smoke passed: $($installer.Name)"
