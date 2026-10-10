param(
    [string]$Port = 'COM3',
    [string]$ApiUrl = 'http://127.0.0.1:8766/api/state'
)
$ErrorActionPreference = 'Stop'

function Clean-Field([object]$value, [int]$limit) {
    if ($null -eq $value) { return '-' }
    $t = [string]$value
    $t = $t -replace '[\r\n|]', ' ' -replace '[^\x20-\x7E]', '?'
    $t = $t.Trim()
    if ([string]::IsNullOrEmpty($t)) { return '-' }
    if ($t.Length -gt $limit) { $t = $t.Substring(0, $limit - 1) + '~' }
    return $t
}

$serial = $null
try {
    try {
        $null = Invoke-RestMethod -Uri $ApiUrl -TimeoutSec 3
    } catch {
        throw "Laptop DND app not running. First open start.bat in the repo root, then rerun START_BRIDGE.bat."
    }
    $serial = [System.IO.Ports.SerialPort]::new($Port, 115200, [System.IO.Ports.Parity]::None, 8, [System.IO.Ports.StopBits]::One)
    $serial.DtrEnable = $true
    $serial.RtsEnable = $false
    $serial.NewLine = [Environment]::NewLine
    $serial.WriteTimeout = 2000
    $serial.Open()
    Write-Host "USB display connected on $Port. Keep this window open during the game." -ForegroundColor Green
    Start-Sleep -Seconds 2
    $lastSent = ''
    $lastAt = [DateTime]::MinValue
    while ($true) {
        try {
            $state = Invoke-RestMethod -Uri $ApiUrl -TimeoutSec 3
            $actor = $null
            foreach ($candidate in @($state.combatants)) {
                if ($null -ne $candidate -and $candidate.id -eq $state.activeId) {
                    $actor = $candidate
                    break
                }
            }
            $name = if ($null -ne $actor) { $actor.name } else { 'READY' }
            $buffs = if ($null -ne $actor) { @($actor.buffs) -join ', ' } else { '-' }
            $debuffs = if ($null -ne $actor) { @($actor.debuffs) -join ', ' } else { '-' }
            $total = if ($null -ne $state.lastRoll) { $state.lastRoll.total } else { '--' }
            $formula = if ($null -ne $state.lastRoll) { $state.lastRoll.formula } else { 'Waiting for a roll' }
            $parts = @(
                'DND1',
                (Clean-Field $state.round 5),
                (Clean-Field $name 36),
                (Clean-Field $total 18),
                (Clean-Field $formula 55),
                (Clean-Field $buffs 100),
                (Clean-Field $debuffs 100)
            )
            $frame = $parts -join '|'
            if ($frame -ne $lastSent -or ([DateTime]::UtcNow - $lastAt).TotalSeconds -ge 2) {
                $serial.WriteLine($frame)
                $lastSent = $frame
                $lastAt = [DateTime]::UtcNow
            }
        } catch {
            Write-Host "Waiting for laptop app: $($_.Exception.Message)" -ForegroundColor Yellow
        }
        Start-Sleep -Milliseconds 350
    }
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host 'Close Arduino Serial Monitor / PlatformIO monitor; only one program can use COM3.' -ForegroundColor Yellow
    exit 1
} finally {
    if ($null -ne $serial) {
        if ($serial.IsOpen) { $serial.Close() }
        $serial.Dispose()
    }
}
