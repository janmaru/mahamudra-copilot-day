param(
  [Parameter(Position = 0)]
  [string]$Prompt = "recupera contesto",

  [switch]$NonInteractive,

  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$repoRoot = $PSScriptRoot
$workspaceRoot = Split-Path -Path $repoRoot -Parent
$agentName = "docs-analyst"
$modelName = "claude-haiku-4.5"
$agentFile = Join-Path $HOME ".copilot\agents\$agentName.agent.md"
$bootstrapCommand = "Set-Location `"$workspaceRoot\.github\agents`"; .\Sync-AgentProfiles.ps1 -InstallGlobal"

if (-not (Get-Command copilot -ErrorAction SilentlyContinue)) {
  throw "The 'copilot' CLI command is not available in PATH."
}

if (-not (Test-Path $agentFile)) {
  throw "Agent profile not found: $agentFile`nBootstrap it from the repo manifest with:`n$bootstrapCommand"
}

$copilotArgs = @(
  "--agent", $agentName,
  "--model", $modelName,
  "--name", "$agentName session",
  "-C", $repoRoot
)

if ($NonInteractive) {
  $copilotArgs += @("--prompt", $Prompt)
} else {
  $copilotArgs += @("--interactive", $Prompt)
}

Write-Host ""
Write-Host "=== DOCS AGENT LAUNCHER ===" -ForegroundColor Cyan
Write-Host "Agent : $agentName" -ForegroundColor Yellow
Write-Host "Model : $modelName" -ForegroundColor Yellow
Write-Host "Repo  : $repoRoot" -ForegroundColor Yellow
Write-Host "Mode  : $(if ($NonInteractive) { 'non-interactive' } else { 'interactive' })" -ForegroundColor Yellow
Write-Host "Prompt: $Prompt" -ForegroundColor Yellow
Write-Host ""

if ($DryRun) {
  $renderedArgs = $copilotArgs | ForEach-Object {
    if ($_ -match "\s") { '"{0}"' -f $_ } else { $_ }
  }
  Write-Host "Dry run command:" -ForegroundColor Green
  Write-Host ("copilot " + ($renderedArgs -join " ")) -ForegroundColor Green
  return
}

& copilot @copilotArgs
$exitCode = $LASTEXITCODE

if ($exitCode -ne 0) {
  exit $exitCode
}
