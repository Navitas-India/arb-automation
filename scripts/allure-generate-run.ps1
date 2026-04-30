param(
  [string]$Suite = "api",
  [string]$Label = "",
  [int]$Keep = 10,
  [switch]$NoArchive
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Normalize-Slug {
  param([string]$Value)
  if ([string]::IsNullOrWhiteSpace($Value)) {
    return "na"
  }
  return (($Value -replace "[^a-zA-Z0-9._-]", "-").Trim("-")).ToLowerInvariant()
}

$allureRoot = "artifacts/reports/allure"
$resultsDir = Join-Path $allureRoot "results/latest"
$latestDir = Join-Path $allureRoot "latest"
$runsDir = Join-Path $allureRoot "runs"
$logsDir = Join-Path $allureRoot "logs"
$latestMarker = ".allure-latest"
$runIndexPath = Join-Path $allureRoot "run-index.jsonl"

New-Item -ItemType Directory -Path $latestDir -Force | Out-Null
New-Item -ItemType Directory -Path $runsDir -Force | Out-Null
New-Item -ItemType Directory -Path $logsDir -Force | Out-Null

if (-not (Test-Path $resultsDir)) {
  $legacyResultsDir = "allure-results"
  if (Test-Path $legacyResultsDir) {
    Write-Host "Using legacy Allure results directory: $legacyResultsDir"
    $resultsDir = $legacyResultsDir
  } else {
    throw "Allure results directory not found: $resultsDir. Run tests first."
  }
}

allure generate $resultsDir --clean -o $latestDir
if ($LASTEXITCODE -ne 0) {
  throw "Allure generate failed."
}

Write-Host "Generated latest report: $latestDir"

if ($NoArchive) {
  exit 0
}

$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$branch = "detached"
try {
  $branchCandidate = (git branch --show-current 2>$null).Trim()
  if (-not [string]::IsNullOrWhiteSpace($branchCandidate)) {
    $branch = $branchCandidate
  }
} catch {
  $branch = "detached"
}

$suiteSlug = Normalize-Slug $Suite
$labelSlug = Normalize-Slug $Label
$branchSlug = Normalize-Slug $branch

$runId = "$timestamp" + "_" + "$suiteSlug" + "_" + "$labelSlug" + "_" + "$branchSlug"
$runDir = Join-Path $runsDir $runId

Copy-Item -Path $latestDir -Destination $runDir -Recurse -Force
Set-Content -Path $latestMarker -Value $runDir -NoNewline

Write-Host "Archived report: $runDir"
Write-Host "Latest marker updated: $latestMarker"
Write-Host "Run ID: $runId"

$runEntry = [ordered]@{
  runId = $runId
  timestampUtc = (Get-Date).ToUniversalTime().ToString("o")
  suite = $Suite
  label = $Label
  branch = $branch
  reportDir = $runDir
  latestReportDir = $latestDir
}

($runEntry | ConvertTo-Json -Compress) | Add-Content -Path $runIndexPath
Write-Host "Run index updated: $runIndexPath"

if ($Keep -gt 0 -and (Test-Path $runsDir)) {
  $oldRuns = Get-ChildItem -Path $runsDir -Directory |
    Sort-Object Name -Descending |
    Select-Object -Skip $Keep

  foreach ($run in $oldRuns) {
    Remove-Item -Path $run.FullName -Recurse -Force
    Write-Host "Pruned old report: $($run.FullName)"
  }
}
