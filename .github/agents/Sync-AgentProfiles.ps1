param(
  [switch]$Check,
  [switch]$InstallGlobal
)

$ErrorActionPreference = "Stop"

$manifestPath = Join-Path $PSScriptRoot "agents.manifest.json"
$repoTargetDir = $PSScriptRoot
$globalTargetDir = Join-Path $HOME ".copilot\agents"

if (-not (Test-Path $manifestPath)) {
  throw "Manifest not found: $manifestPath"
}

$manifest = Get-Content -Path $manifestPath -Raw | ConvertFrom-Json -Depth 10

function Format-InlineArray {
  param(
    [Parameter(Mandatory = $true)]
    [object[]]$Items
  )

  $renderedItems = foreach ($item in $Items) {
    $escaped = [string]$item -replace "'", "''"
    "'$escaped'"
  }

  return "[" + ($renderedItems -join ", ") + "]"
}

function Format-ScalarValue {
  param(
    [Parameter(Mandatory = $true)]
    [AllowNull()]
    [object]$Value
  )

  if ($Value -is [bool]) {
    return $Value.ToString().ToLowerInvariant()
  }

  if ($Value -is [int] -or $Value -is [long] -or $Value -is [double] -or $Value -is [decimal]) {
    return [string]$Value
  }

  return [string]$Value
}

function Add-FrontMatterLine {
  param(
    [Parameter(Mandatory = $true)]
    [System.Collections.Generic.List[string]]$Lines,
    [Parameter(Mandatory = $true)]
    [string]$Key,
    [Parameter(Mandatory = $true)]
    [AllowNull()]
    [object]$Value,
    [int]$Indent = 0
  )

  $prefix = (" " * $Indent) + $Key + ":"

  if ($Value -is [System.Collections.IEnumerable] -and -not ($Value -is [string])) {
    $items = @($Value)

    if ($items.Count -eq 0) {
      $Lines.Add("$prefix []")
      return
    }

    $allStrings = $true
    foreach ($item in $items) {
      if ($item -isnot [string]) {
        $allStrings = $false
        break
      }
    }

    if ($allStrings) {
      $Lines.Add("$prefix $(Format-InlineArray -Items $items)")
      return
    }

    $Lines.Add($prefix)
    foreach ($item in $items) {
      if ($item.PSObject.Properties.Count -eq 0) {
        $Lines.Add((" " * ($Indent + 2)) + "- " + (Format-ScalarValue -Value $item))
        continue
      }

      $firstProperty = $true
      foreach ($property in $item.PSObject.Properties) {
        $itemIndent = " " * ($Indent + 2)
        $propertyIndent = " " * ($Indent + 4)
        $scalar = Format-ScalarValue -Value $property.Value

        if ($firstProperty) {
          $Lines.Add("$itemIndent- $($property.Name): $scalar")
          $firstProperty = $false
        } else {
          $Lines.Add("$propertyIndent$($property.Name): $scalar")
        }
      }
    }

    return
  }

  $Lines.Add("$prefix $(Format-ScalarValue -Value $Value)")
}

function New-AgentFileContent {
  param(
    [Parameter(Mandatory = $true)]
    [pscustomobject]$Agent
  )

  $lines = [System.Collections.Generic.List[string]]::new()
  $lines.Add("---")

  foreach ($property in $Agent.frontMatter.PSObject.Properties) {
    Add-FrontMatterLine -Lines $lines -Key $property.Name -Value $property.Value
  }

  $lines.Add("---")

  foreach ($line in $Agent.body) {
    $lines.Add([string]$line)
  }

  return ($lines -join "`r`n") + "`r`n"
}

function Sync-AgentFile {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path,
    [Parameter(Mandatory = $true)]
    [string]$Content
  )

  if ($Check) {
    if (-not (Test-Path $Path)) {
      throw "Missing generated file: $Path"
    }

    $existing = Get-Content -Path $Path -Raw
    if ($existing -cne $Content) {
      throw "Generated content is out of sync: $Path"
    }

    return
  }

  $parent = Split-Path -Path $Path -Parent
  if (-not (Test-Path $parent)) {
    New-Item -ItemType Directory -Path $parent -Force | Out-Null
  }

  $utf8NoBom = [System.Text.UTF8Encoding]::new($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}

foreach ($agent in $manifest.agents) {
  $content = New-AgentFileContent -Agent $agent
  $repoPath = Join-Path $repoTargetDir $agent.fileName
  Sync-AgentFile -Path $repoPath -Content $content

  if ($InstallGlobal) {
    if (-not $Check -and -not (Test-Path $globalTargetDir)) {
      New-Item -ItemType Directory -Path $globalTargetDir -Force | Out-Null
    }

    $globalPath = Join-Path $globalTargetDir $agent.fileName
    Sync-AgentFile -Path $globalPath -Content $content
  }
}

if ($Check) {
  Write-Host "Agent profiles are in sync." -ForegroundColor Green
} elseif ($InstallGlobal) {
  Write-Host "Agent profiles rendered in repo and installed globally." -ForegroundColor Green
} else {
  Write-Host "Agent profiles rendered in repo." -ForegroundColor Green
}
