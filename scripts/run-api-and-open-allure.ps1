param(
  [string[]]$Modules = @(),
  [string]$Label = "",
  [int]$Keep = 20
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

function Resolve-ModuleSpecs {
  param([string]$ModuleName)

  $moduleSlug = Normalize-Slug $ModuleName
  if ($moduleSlug -eq "na") {
    return @()
  }

  $testsApiRoot = "tests/api"
  if (-not (Test-Path $testsApiRoot)) {
    throw "Tests directory not found: $testsApiRoot"
  }

  $allSpecs = Get-ChildItem -Path $testsApiRoot -Recurse -File -Filter "*.api.spec.ts"
  $folderScoped = @($allSpecs | Where-Object {
    $_.FullName -match ("[\\/]" + [Regex]::Escape($moduleSlug) + "[\\/]")
  })

  $moduleSpecs = if ($folderScoped.Count -gt 0) {
    $folderScoped
  } else {
    $allSpecs | Where-Object { $_.Name -like ("$moduleSlug-*.api.spec.ts") }
  }

  return @($moduleSpecs |
    Sort-Object FullName |
    ForEach-Object {
      $relative = Resolve-Path -Relative $_.FullName
      ($relative -replace '^[.][\\/]', '' -replace '\\', '/')
    } |
    Select-Object -Unique)
}

$allureResultsDir = "artifacts/reports/allure/results/latest"
$allureLegacyResultsDir = "allure-results"
$allureLogsDir = "artifacts/reports/allure/logs"

New-Item -ItemType Directory -Path $allureLogsDir -Force | Out-Null

if (Test-Path $allureResultsDir) {
  Remove-Item $allureResultsDir -Recurse -Force
}

if (Test-Path $allureLegacyResultsDir) {
  Remove-Item $allureLegacyResultsDir -Recurse -Force
}

$selectedModules = @($Modules | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | ForEach-Object { Normalize-Slug $_ })

$selectedSpecs = @()
if ($selectedModules.Count -gt 0) {
  foreach ($module in $selectedModules) {
    $moduleSpecs = @(Resolve-ModuleSpecs -ModuleName $module)
    if ($moduleSpecs.Count -eq 0) {
      throw "No API specs found for module '$module'."
    }
    $selectedSpecs += $moduleSpecs
  }
  $selectedSpecs = @($selectedSpecs | Sort-Object -Unique)
}

$runTimestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$labelSeed = if (-not [string]::IsNullOrWhiteSpace($Label)) {
  Normalize-Slug $Label
} elseif ($selectedModules.Count -gt 0) {
  ($selectedModules -join "-")
} else {
  "all-api"
}
$runLogPath = Join-Path $allureLogsDir ($runTimestamp + "_" + $labelSeed + ".log")

$cmdArgs = @("playwright", "test", "--project=api")
if ($selectedSpecs.Count -gt 0) {
  $cmdArgs += $selectedSpecs
}

Write-Host "Running:" ($cmdArgs -join " ")
Write-Host "Run log:" $runLogPath

$quotedArgs = $cmdArgs | ForEach-Object {
  if ($_ -match '\s') {
    '"' + $_ + '"'
  } else {
    $_
  }
}
$cmdLine = ("npx " + ($quotedArgs -join " ") + " > `"$runLogPath`" 2>&1")
cmd /c $cmdLine
$testExit = $LASTEXITCODE

if (Test-Path $runLogPath) {
  Get-Content $runLogPath
}

if (-not (Test-Path $allureResultsDir) -and -not (Test-Path $allureLegacyResultsDir)) {
  throw "No Allure result files were produced for this run. Check the test output and selected modules."
}

$suiteLabel = if (-not [string]::IsNullOrWhiteSpace($Label)) {
  $Label
} elseif ($selectedModules.Count -gt 0) {
  $selectedModules -join "-"
} else {
  "all-api"
}

& powershell -NoProfile -ExecutionPolicy Bypass -File "./scripts/allure-generate-run.ps1" -Suite "api" -Label $suiteLabel -Keep $Keep
if ($LASTEXITCODE -ne 0) {
  throw "Allure report generation failed."
}

& powershell -NoProfile -ExecutionPolicy Bypass -File "./scripts/allure-open-latest.ps1"
if ($LASTEXITCODE -ne 0) {
  throw "Opening Allure report failed."
}

exit $testExit
