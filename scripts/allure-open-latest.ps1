param(
  [string]$RunId = "",
  [switch]$ListRuns,
  [int]$Limit = 20,
  [switch]$NoLaunch
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$latestDir = $null
$latestMarker = ".allure-latest"
$allureRoot = "artifacts/reports/allure"
$latestReportDir = Join-Path $allureRoot "latest"
$runsDir = Join-Path $allureRoot "runs"

if ($ListRuns) {
  if (-not (Test-Path $runsDir)) {
    Write-Host "No archived report runs found."
    exit 0
  }

  $runs = Get-ChildItem -Path $runsDir -Directory |
    Sort-Object Name -Descending |
    Select-Object -First $Limit

  if (-not $runs) {
    Write-Host "No archived report runs found."
    exit 0
  }

  Write-Host "Available Allure runs (latest first):"
  foreach ($run in $runs) {
    Write-Host ("- " + $run.Name)
  }
  exit 0
}

if (-not [string]::IsNullOrWhiteSpace($RunId)) {
  if (-not (Test-Path $runsDir)) {
    throw "Runs directory not found: $runsDir"
  }

  $runMatch = Get-ChildItem -Path $runsDir -Directory |
    Where-Object { $_.Name -eq $RunId } |
    Select-Object -First 1

  if (-not $runMatch) {
    throw "Run ID not found in archived reports: $RunId"
  }

  $latestDir = $runMatch.FullName
}

if (-not $latestDir -and (Test-Path $latestMarker)) {
  $fromMarker = (Get-Content $latestMarker -Raw).Trim()
  if ($fromMarker -and (Test-Path $fromMarker)) {
    $latestDir = $fromMarker
  }
}

if (-not $latestDir -and (Test-Path $latestReportDir)) {
  $latestDir = $latestReportDir
}

if (-not $latestDir) {
  $candidate = Get-ChildItem -Directory -Filter "allure-report-*" |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1
  if ($candidate) {
    $latestDir = $candidate.Name
  }
}

if (-not $latestDir -and (Test-Path "allure-report")) {
  $latestDir = "allure-report"
}

if (-not $latestDir) {
  throw "No Allure report directory found. Run tests and generate a report first."
}

Write-Host "Opening latest report: $latestDir"

if ($NoLaunch) {
  exit 0
}

allure open $latestDir
