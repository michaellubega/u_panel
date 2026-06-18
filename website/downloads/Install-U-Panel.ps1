# Runs the U-Panel Windows installer from a local folder on the hard disk.#
# Usage:
#   Right-click Install-U-Panel.ps1 -> Run with PowerShell
#   Or double-click Install-U-Panel.bat in the same folder as the setup .exe

param(
    [string]$SetupExe = ""
)

$ErrorActionPreference = "Stop"

$scriptDir = if ($PSScriptRoot) {
    $PSScriptRoot
} else {
    Split-Path -Parent $MyInvocation.MyCommand.Path
}

function Find-SetupExe {
    param([string]$Directory)

    $patterns = @(
        "U-Panel-*-windows-setup.exe",
        "U-Panel-*-windows-setup (1).exe",
        "*windows-setup*.exe"
    )

    foreach ($pattern in $patterns) {
        $match = Get-ChildItem -LiteralPath $Directory -Filter $pattern -File -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 1
        if ($match) { return $match.FullName }
    }

    return $null
}

if ([string]::IsNullOrWhiteSpace($SetupExe)) {
    $SetupExe = Find-SetupExe -Directory $scriptDir
    if (-not $SetupExe) {
        $downloads = Join-Path $env:USERPROFILE "Downloads"
        if (Test-Path -LiteralPath $downloads) {
            $SetupExe = Find-SetupExe -Directory $downloads
        }
    }
} elseif (-not (Test-Path -LiteralPath $SetupExe)) {
    throw "Installer not found: $SetupExe"
}

if (-not $SetupExe) {
    throw @"
Could not find U-Panel setup .exe.

Place this script in the same folder as U-Panel-*-windows-setup.exe
(for example your Downloads folder), then run Install-U-Panel.bat again.
"@
}

$localDir = Join-Path $env:LOCALAPPDATA "U-Panel\Install"
New-Item -ItemType Directory -Force -Path $localDir | Out-Null

$localSetup = Join-Path $localDir (Split-Path $SetupExe -Leaf)
Write-Host "Copying installer to local disk: $localSetup"
Copy-Item -LiteralPath $SetupExe -Destination $localSetup -Force

Write-Host "Starting U-Panel setup from your local hard disk..."
$process = Start-Process -FilePath $localSetup -PassThru -Wait
exit $process.ExitCode
