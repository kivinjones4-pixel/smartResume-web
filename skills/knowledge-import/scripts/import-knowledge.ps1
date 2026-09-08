param(
    [string]$BackendPath = (Join-Path $PSScriptRoot '../../../sr-backend'),
    [string]$EnvFile,
    [switch]$CheckOnly
)
$ErrorActionPreference = 'Stop'
$backend = (Resolve-Path -LiteralPath $BackendPath).Path
if (!$EnvFile) { $EnvFile = Join-Path $backend '.env' }
$saved = @{}
$importExit = 0
try {
    if (!(Test-Path -LiteralPath $EnvFile -PathType Leaf)) { throw 'Environment file not found; specify -EnvFile or create backend .env.' }
    $lineNumber = 0
    foreach ($raw in Get-Content -LiteralPath $EnvFile -Encoding UTF8) {
        $lineNumber++
        $line = $raw.Trim()
        if (!$line -or $line.StartsWith('#')) { continue }
        if ($line -notmatch '^([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') { throw "Invalid environment format at line $lineNumber (expected KEY=value)." }
        $key = $Matches[1]
        $value = $Matches[2].Trim()
        if ($value.StartsWith('"') -or $value.StartsWith("'")) {
            if ($value.Length -lt 2 -or $value[0] -ne $value[$value.Length - 1]) { throw "Unmatched quote at line $lineNumber." }
            $value = $value.Substring(1, $value.Length - 2)
        }
        if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($key, 'Process'))) {
            if (!$saved.ContainsKey($key)) { $saved[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
            [Environment]::SetEnvironmentVariable($key, $value, 'Process')
        }
    }
    $missing = @('AI_EMBEDDING_API_KEY','AI_EMBEDDING_BASE_URL','AI_EMBEDDING_MODEL') | Where-Object {
        [string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($_, 'Process'))
    }
    if ($missing) { throw "Missing configuration: $($missing -join ', ')" }
    Write-Output 'Embedding required variables are present. Values are not displayed.'
    if (!$CheckOnly) {
        Push-Location $backend
        try { & go run ./cmd/knowledge-import; $importExit = $LASTEXITCODE }
        finally { Pop-Location }
    }
}
finally {
    foreach ($key in $saved.Keys) { [Environment]::SetEnvironmentVariable($key, $saved[$key], 'Process') }
}
if ($importExit -ne 0) { exit $importExit }
