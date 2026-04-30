param(
  [string]$Project = "",
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$PlaywrightArgs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$isCi = ($env:CI -eq "true")

$cmdArgs = @("playwright", "test")
if (-not [string]::IsNullOrWhiteSpace($Project)) {
  $cmdArgs += @("--project=$Project")
}
if ($PlaywrightArgs) {
  $cmdArgs += $PlaywrightArgs
}

Write-Host "Running:" ($cmdArgs -join " ")
& npx @cmdArgs
$testExit = $LASTEXITCODE

if (-not $isCi) {
  try {
    $playwrightReportIndex = "playwright-report/index.html"
    if (Test-Path $playwrightReportIndex) {
      Start-Process $playwrightReportIndex | Out-Null
      Write-Host "Opened Playwright web report in default browser."
    } else {
      Write-Warning "Playwright report not found at $playwrightReportIndex"
    }
  } catch {
    Write-Warning ("Could not open Playwright report: " + $_.Exception.Message)
  }
}

exit $testExit
