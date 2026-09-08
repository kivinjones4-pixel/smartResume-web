param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^[a-z0-9]+(?:-[a-z0-9]+)*$')]
    [string]$ChangeId,
    [string]$ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '../../..')).Path
)
$ErrorActionPreference = 'Stop'
$target = Join-Path $ProjectRoot "specs/changes/$ChangeId"
if (Test-Path -LiteralPath $target) { throw "Change already exists: $ChangeId" }
$documents = [ordered]@{
    'proposal.md' = "# $ChangeId`n`nStatus: draft`n`n## Why`nTODO: problem and evidence`n`n## What Changes`nTODO: scope and non-goals`n"
    'design.md' = "# $ChangeId design`n`nStatus: draft`n`n## Context`nTODO: current behavior`n`n## Decisions`nTODO: choices and alternatives`n`n## Risks`nTODO: failure behavior, migration and rollback`n"
    'spec.md' = "# $ChangeId specification`n`nStatus: draft`n`n## ADDED REQ-001`nTODO: requirement`n`n### REQ-001-S1`n- Given TODO: precondition`n- When TODO: action`n- Then TODO: observable outcome`n"
    'task.md' = "# $ChangeId tasks`n`nStatus: draft`n`n## Implementation`n- [ ] TODO: scoped work (REQ-001-S1)`n`n## Verification`n- [ ] TODO: verify success, failure and permissions`n`n## Evidence`nNot run.`n"
}
New-Item -ItemType Directory -Path $target | Out-Null
foreach ($entry in $documents.GetEnumerator()) {
    [IO.File]::WriteAllText((Join-Path $target $entry.Key), $entry.Value, (New-Object Text.UTF8Encoding($false)))
}
Write-Output "Created specs/changes/$ChangeId. Fill TODO markers before review."
