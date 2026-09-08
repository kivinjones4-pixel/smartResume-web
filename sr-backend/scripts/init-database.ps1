param(
    [string]$EnvFile = (Join-Path $PSScriptRoot '../.env'),
    [string]$PsqlPath = 'psql',
    [switch]$CheckOnly,
    [switch]$SkipBase
)
$ErrorActionPreference = 'Stop'

# Read data only; never execute .env as PowerShell code.
$settings = @{}
if (!(Test-Path -LiteralPath $EnvFile -PathType Leaf)) { throw 'Environment file not found.' }
$lineNumber = 0
foreach ($raw in Get-Content -LiteralPath $EnvFile -Encoding UTF8) {
    $lineNumber++
    $line = $raw.Trim()
    if (!$line -or $line.StartsWith('#')) { continue }
    if ($line -notmatch '^([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$') { throw "Invalid environment format at line $lineNumber." }
    $key = $Matches[1]
    $value = $Matches[2].Trim()
    if ($value.StartsWith('"') -or $value.StartsWith("'")) {
        if ($value.Length -lt 2 -or $value[0] -ne $value[$value.Length - 1]) { throw "Unmatched quote at line $lineNumber." }
        $value = $value.Substring(1, $value.Length - 2)
    }
    $settings[$key] = $value
}
$mapping = [ordered]@{
    DB_HOST = 'PGHOST'; DB_PORT = 'PGPORT'; DB_USER = 'PGUSER'
    DB_PASSWORD = 'PGPASSWORD'; DB_NAME = 'PGDATABASE'; DB_SSLMODE = 'PGSSLMODE'
}
foreach ($key in $mapping.Keys) {
    $processValue = [Environment]::GetEnvironmentVariable($key, 'Process')
    if (![string]::IsNullOrWhiteSpace($processValue)) { $settings[$key] = $processValue }
    if ([string]::IsNullOrWhiteSpace($settings[$key])) { throw "Missing configuration: $key" }
}
if ($settings['DB_PASSWORD'] -match '^(\*+|YOUR_PASSWORD|CHANGE_ME)$') { throw 'Replace the DB_PASSWORD placeholder locally.' }
if ($settings['DB_PORT'] -notmatch '^\d+$' -or [long]$settings['DB_PORT'] -lt 1 -or [long]$settings['DB_PORT'] -gt 65535) { throw 'Invalid DB_PORT.' }
if ($settings['DB_SSLMODE'] -notin @('disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full')) { throw 'Invalid DB_SSLMODE.' }
if ($settings.ContainsKey('AI_EMBEDDING_DIMENSIONS') -and $settings['AI_EMBEDDING_DIMENSIONS'] -ne '1536') {
    throw 'Project SQL requires AI_EMBEDDING_DIMENSIONS=1536.'
}
$files = @()
if (!$SkipBase) { $files += 'init.sql' }
$files += @('20260804_add_resume_access_settings.sql', '20260805_add_visitor_ai_daily_usage.sql', 'init_knowledge_rag.sql', 'init_hybrid_search.sql')
foreach ($file in $files) {
    if (!(Test-Path -LiteralPath (Join-Path $PSScriptRoot $file) -PathType Leaf)) { throw "Missing SQL file: $file" }
}
Write-Output 'Database configuration is present. Values are not displayed.'
Write-Output ('SQL order: ' + ($files -join ' -> '))
if ($CheckOnly) {
    Write-Output 'Offline check passed; no connection or SQL execution was attempted.'
    return
}
$psql = Get-Command $PsqlPath -CommandType Application -ErrorAction SilentlyContinue
if (!$psql) { throw 'psql not found. Install PostgreSQL client tools or specify -PsqlPath.' }
$saved = @{}
try {
    # Credentials stay out of command-line arguments. Restore all changed variables.
    # Neon poolers reject search_path in startup options. SQL uses the database's default schema.
    $pgSettings = @{ PGCONNECT_TIMEOUT = '15'; PGCLIENTENCODING = 'UTF8'; PGOPTIONS = ''; PGSERVICE = ''; PGSERVICEFILE = '' }
    foreach ($key in $mapping.Keys) { $pgSettings[$mapping[$key]] = $settings[$key] }
    foreach ($key in $pgSettings.Keys) {
        $saved[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
        [Environment]::SetEnvironmentVariable($key, $pgSettings[$key], 'Process')
    }
    foreach ($file in $files) {
        Write-Output "Executing $file"
        & $psql.Source -X -w -v ON_ERROR_STOP=1 -f (Join-Path $PSScriptRoot $file)
        if ($LASTEXITCODE -ne 0) { throw "SQL failed: $file. Earlier files may have committed; later files were not executed." }
    }
    Write-Output 'Database initialization completed.'
}
finally {
    foreach ($key in $saved.Keys) { [Environment]::SetEnvironmentVariable($key, $saved[$key], 'Process') }
}
