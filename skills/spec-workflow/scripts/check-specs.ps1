param([string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path)
$ErrorActionPreference = 'Stop'
$issues = New-Object 'System.Collections.Generic.List[string]'
foreach ($relative in @('AGENTS.md', 'specs/README.md', 'specs/baseline/spec.md')) {
    $file = Join-Path $ProjectRoot $relative
    if (!(Test-Path -LiteralPath $file -PathType Leaf) -or !(Get-Content -LiteralPath $file -Raw)) { $issues.Add("Missing or empty: $relative") }
}
$changes = Join-Path $ProjectRoot 'specs/changes'
if (Test-Path -LiteralPath $changes) {
    foreach ($dir in Get-ChildItem -LiteralPath $changes -Directory) {
        foreach ($name in @('proposal.md','design.md','task.md','spec.md')) {
            $file = Join-Path $dir.FullName $name
            if (!(Test-Path -LiteralPath $file)) { $issues.Add("Missing: $($dir.Name)/$name"); continue }
            $body = Get-Content -LiteralPath $file -Raw -Encoding UTF8
            if ([string]::IsNullOrWhiteSpace($body)) { $issues.Add("Empty: $($dir.Name)/$name") }
            if ($body -match 'TODO:') { $issues.Add("Unfilled template: $($dir.Name)/$name") }
        }
    }
}
$skills = Join-Path $ProjectRoot 'skills'
if (!(Test-Path -LiteralPath $skills)) { $issues.Add('Missing skills directory') }
else {
    foreach ($dir in Get-ChildItem -LiteralPath $skills -Directory) {
        $file = Join-Path $dir.FullName 'SKILL.md'
        if (!(Test-Path -LiteralPath $file)) { $issues.Add("Missing SKILL.md: $($dir.Name)"); continue }
        $body = Get-Content -LiteralPath $file -Raw -Encoding UTF8
        if ($body -notmatch '(?s)^---\r?\n(.*?)\r?\n---') { $issues.Add("Missing frontmatter: $($dir.Name)"); continue }
        $front = $Matches[1]
        if ($front -notmatch '(?m)^name:\s*([a-z0-9-]+)\s*$') { $issues.Add("Invalid skill name: $($dir.Name)") }
        elseif ($Matches[1] -ne $dir.Name) { $issues.Add("Skill name/folder mismatch: $($dir.Name)") }
        if ($front -notmatch '(?m)^description:\s*\S.+$') { $issues.Add("Missing description: $($dir.Name)") }
        if (($body -split '\n').Count -gt 500) { $issues.Add("SKILL.md exceeds 500 lines: $($dir.Name)") }
    }
}
if ($issues.Count) { $issues | ForEach-Object { Write-Output "ERROR: $_" }; exit 1 }
Write-Output 'PASS: spec and skill structure. Business behavior was not tested.'
