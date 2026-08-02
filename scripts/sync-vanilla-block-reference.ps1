param(
  [string]$Jar = ".vanilla-reference\26.2\client.jar",
  [string]$Output = "public\vanilla-26.2"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem
$jarPath = (Resolve-Path -LiteralPath $Jar).Path
$outputPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Output))
$workspacePath = [System.IO.Path]::GetFullPath((Get-Location).Path)
if (-not $outputPath.StartsWith($workspacePath, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Output must remain inside the workspace."
}

New-Item -ItemType Directory -Force -Path $outputPath | Out-Null
$textureRoot = Join-Path $outputPath "textures"
New-Item -ItemType Directory -Force -Path $textureRoot | Out-Null
$zip = [System.IO.Compression.ZipFile]::OpenRead($jarPath)
try {
  $blockstates = [ordered]@{}
  $models = [ordered]@{}
  foreach ($entry in $zip.Entries) {
    if ($entry.FullName -match '^assets/minecraft/blockstates/(.+)\.json$') {
      $reader = New-Object System.IO.StreamReader($entry.Open())
      try { $blockstates[$Matches[1]] = $reader.ReadToEnd() } finally { $reader.Dispose() }
      continue
    }
    if ($entry.FullName -match '^assets/minecraft/models/block/(.+)\.json$') {
      $reader = New-Object System.IO.StreamReader($entry.Open())
      try { $models[$Matches[1]] = $reader.ReadToEnd() } finally { $reader.Dispose() }
      continue
    }
    if ($entry.FullName -match '^assets/minecraft/textures/block/(.+)\.png$') {
      $relative = $Matches[1] + ".png"
      $target = Join-Path $textureRoot $relative
      New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
      [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true)
    }
  }
  $blockstateJson = ($blockstates.GetEnumerator() | ForEach-Object { '"' + $_.Key + '":' + $_.Value }) -join ','
  $modelJson = ($models.GetEnumerator() | ForEach-Object { '"' + $_.Key + '":' + $_.Value }) -join ','
  $catalog = '{"version":"26.2","dataVersion":4903,"blockstates":{' + $blockstateJson + '},"models":{' + $modelJson + '}}'
  [System.IO.File]::WriteAllText((Join-Path $outputPath "catalog.json"), $catalog, (New-Object System.Text.UTF8Encoding($false)))
} finally {
  $zip.Dispose()
}

Write-Output "Generated $($blockstates.Count) blockstates, $($models.Count) models, and vanilla block textures in $outputPath"
