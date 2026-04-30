param(
  [string]$StoryFilter = "usermanagement",
  [string]$SpecPath = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

Write-Host "API cycle start"
Write-Host "Story filter: $StoryFilter"
if ($SpecPath) {
  Write-Host "Spec target: $SpecPath"
} else {
  Write-Host "Spec target: all API specs"
}

npm run generate:api -- $StoryFilter
if ($LASTEXITCODE -ne 0) {
  throw "API generation failed."
}

if ($SpecPath) {
  npm run test:api:raw -- $SpecPath
} else {
  npm run test:api:raw
}
$testExit = $LASTEXITCODE

$reportLabel = $StoryFilter
if ($SpecPath) {
  $reportLabel = [System.IO.Path]::GetFileNameWithoutExtension($SpecPath)
}

npm run allure:generate:run -- --suite api --label $reportLabel
if ($LASTEXITCODE -ne 0) {
  throw "Allure generation failed."
}

npm run allure:open:latest
if ($LASTEXITCODE -ne 0) {
  throw "Failed to open latest Allure report."
}

exit $testExit
