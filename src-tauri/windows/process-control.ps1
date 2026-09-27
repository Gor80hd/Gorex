$ErrorActionPreference = 'Stop'

Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

public static class GorexThreadControl {
    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern IntPtr OpenThread(uint desiredAccess, bool inheritHandle, uint threadId);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern uint SuspendThread(IntPtr thread);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern uint ResumeThread(IntPtr thread);

    [DllImport("kernel32.dll", SetLastError = true)]
    public static extern bool CloseHandle(IntPtr handle);
}
'@

# yt-dlp and TwitchDownloaderCLI can spawn FFmpeg. Include descendants so a
# paused parent does not leave its converter running in the background.
$processes = @(Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId)
$targetIds = New-Object 'System.Collections.Generic.List[uint32]'
$targetIds.Add([uint32]$GorexRootProcessId)
for ($index = 0; $index -lt $targetIds.Count; $index++) {
    $parentId = $targetIds[$index]
    foreach ($child in $processes) {
        $childId = [uint32]$child.ProcessId
        if ([uint32]$child.ParentProcessId -eq $parentId -and -not $targetIds.Contains($childId)) {
            $targetIds.Add($childId)
        }
    }
}

foreach ($targetId in $targetIds) {
    $process = Get-Process -Id ([int]$targetId) -ErrorAction SilentlyContinue
    if ($null -eq $process) { continue }
    foreach ($thread in @($process.Threads)) {
        $handle = [GorexThreadControl]::OpenThread(0x0002, $false, [uint32]$thread.Id)
        if ($handle -eq [IntPtr]::Zero) { continue }
        try {
            $result = if ($GorexControlAction -eq 'pause') {
                [GorexThreadControl]::SuspendThread($handle)
            } else {
                [GorexThreadControl]::ResumeThread($handle)
            }
            if ($result -eq [uint32]::MaxValue) {
                throw "Could not $GorexControlAction thread $($thread.Id) in process $targetId"
            }
        } finally {
            [void][GorexThreadControl]::CloseHandle($handle)
        }
    }
}
