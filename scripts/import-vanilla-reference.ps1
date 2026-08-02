param(
    [Parameter(Position = 0)]
    [string]$Version = "26.2",

    [Parameter(Position = 1)]
    [string]$ClientJar,

    [string]$ReferenceRoot = ".vanilla-reference"
)

$ErrorActionPreference = "Stop"

function Get-FullPath([string]$Path, [string]$Base) {
    if ([System.IO.Path]::IsPathRooted($Path)) {
        return [System.IO.Path]::GetFullPath($Path)
    }
    return [System.IO.Path]::GetFullPath((Join-Path $Base $Path))
}

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$referenceRootPath = Get-FullPath $ReferenceRoot $projectRoot
$versionRoot = Join-Path $referenceRootPath $Version
$storedJar = Join-Path $versionRoot "client.jar"
$extractRoot = Join-Path $versionRoot "extracted"

New-Item -ItemType Directory -Force -Path $versionRoot | Out-Null
New-Item -ItemType Directory -Force -Path $extractRoot | Out-Null

if (-not $ClientJar) {
    $legacyJar = Join-Path $referenceRootPath "$Version-client.jar"
    if (Test-Path -LiteralPath $storedJar) {
        $ClientJar = $storedJar
    } elseif (Test-Path -LiteralPath $legacyJar) {
        $ClientJar = $legacyJar
    } else {
        Write-Host "Finding the official Minecraft $Version client..."
        $manifest = Invoke-RestMethod -Uri "https://piston-meta.mojang.com/mc/game/version_manifest_v2.json"
        $versionInfo = $manifest.versions | Where-Object { $_.id -eq $Version } | Select-Object -First 1
        if (-not $versionInfo) {
            throw "Minecraft version '$Version' was not found in Mojang's version manifest."
        }
        $details = Invoke-RestMethod -Uri $versionInfo.url
        if (-not $details.downloads.client.url) {
            throw "Mojang's metadata did not include a client download for '$Version'."
        }
        Invoke-WebRequest -Uri $details.downloads.client.url -OutFile $storedJar
        $actualHash = (Get-FileHash -LiteralPath $storedJar -Algorithm SHA1).Hash.ToLowerInvariant()
        if ($details.downloads.client.sha1 -and $actualHash -ne $details.downloads.client.sha1.ToLowerInvariant()) {
            throw "The downloaded client did not match Mojang's published SHA-1 hash."
        }
        $ClientJar = $storedJar
    }
}

$clientJarPath = Get-FullPath $ClientJar $projectRoot
if (-not (Test-Path -LiteralPath $clientJarPath -PathType Leaf)) {
    throw "Client JAR not found: $clientJarPath"
}

if ($clientJarPath -ne $storedJar) {
    Copy-Item -LiteralPath $clientJarPath -Destination $storedJar -Force
    $clientJarPath = $storedJar
}

Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive = [System.IO.Compression.ZipFile]::OpenRead($clientJarPath)
$prefixes = @(
    "assets/minecraft/items/",
    "assets/minecraft/models/item/",
    "assets/minecraft/models/block/",
    "assets/minecraft/blockstates/",
    "assets/minecraft/textures/item/",
    "assets/minecraft/textures/block/",
    "assets/minecraft/atlases/",
    "assets/minecraft/equipment/",
    "assets/minecraft/models/equipment/",
    "assets/minecraft/textures/entity/equipment/"
)

$extractedCount = 0
$createdDirectories = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)
try {
    foreach ($entry in $archive.Entries) {
        if (-not $entry.Name) { continue }
        $entryPath = $entry.FullName.Replace("\", "/")
        $selected = $false
        foreach ($prefix in $prefixes) {
            if ($entryPath.StartsWith($prefix, [System.StringComparison]::Ordinal)) {
                $selected = $true
                break
            }
        }
        if (-not $selected) { continue }

        $destination = [System.IO.Path]::GetFullPath((Join-Path $extractRoot $entryPath))
        $safeRoot = [System.IO.Path]::GetFullPath($extractRoot) + [System.IO.Path]::DirectorySeparatorChar
        if (-not $destination.StartsWith($safeRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            throw "Unsafe path in client archive: $entryPath"
        }

        if (Test-Path -LiteralPath $destination -PathType Leaf) {
            $existingFile = Get-Item -LiteralPath $destination
            if ($existingFile.Length -eq $entry.Length) {
                $extractedCount++
                continue
            }
        }

        $destinationDirectory = Split-Path -Parent $destination
        if ($createdDirectories.Add($destinationDirectory) -and -not (Test-Path -LiteralPath $destinationDirectory)) {
            [System.IO.Directory]::CreateDirectory($destinationDirectory) | Out-Null
        }
        [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $destination, $true)
        $extractedCount++
    }
} finally {
    $archive.Dispose()
}

& node (Join-Path $PSScriptRoot "build-vanilla-index.mjs") $Version $referenceRootPath
if ($LASTEXITCODE -ne 0) {
    throw "The vanilla reference index could not be generated."
}

Write-Host "Vanilla $Version reference ready: $extractedCount files extracted."
Write-Host "Index: $(Join-Path $versionRoot 'index.json')"
