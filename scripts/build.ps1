param([string]$Go='go',[string]$Version='0.1.0-preview.1',[string]$WebBuild='')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
if(!$WebBuild){$WebBuild=Join-Path $root 'web'}
$canonical=Join-Path $root 'web'
Push-Location $WebBuild
try {
 if([IO.Path]::GetFullPath($WebBuild) -ne [IO.Path]::GetFullPath($canonical)){
  foreach($file in Get-ChildItem -LiteralPath $canonical -File -Recurse){
   $rel=[IO.Path]::GetRelativePath($canonical,$file.FullName)
   if($rel -match '^(node_modules|dist)[\\/]'){continue}
   if($rel -eq 'src/Screen.tsx' -or $rel -eq 'src\Screen.tsx'){continue}
   $copy=Join-Path $WebBuild $rel
   if(!(Test-Path -LiteralPath $copy) -or (Get-FileHash -LiteralPath $file.FullName).Hash -ne (Get-FileHash -LiteralPath $copy).Hash){throw "Browser source differs: $rel"}
  }
 }
 npm ci --ignore-scripts
 if($LASTEXITCODE){throw 'Locked browser dependency install failed'}
 npm test
 if($LASTEXITCODE){throw 'Cryptographic tests failed'}
 npm run build
 if($LASTEXITCODE){throw 'PWA build failed'}
 if([IO.Path]::GetFullPath($WebBuild) -ne [IO.Path]::GetFullPath($canonical)){
  $target=[IO.Path]::GetFullPath((Join-Path $canonical 'dist'))
  if($target -ne ([IO.Path]::GetFullPath($canonical)+[IO.Path]::DirectorySeparatorChar+'dist')){throw 'Invalid generated output path'}
  if(Test-Path -LiteralPath $target){
   $entries=@(Get-Item -LiteralPath $target)+@(Get-ChildItem -LiteralPath $target -Recurse -Force)
   if(@($entries|Where-Object{$_.Attributes -band [IO.FileAttributes]::ReparsePoint}).Count){throw 'Refuse linked generated output'}
   Remove-Item -LiteralPath $target -Recurse -Force
  }
  Copy-Item -LiteralPath (Join-Path $WebBuild 'dist') -Destination $target -Recurse
  Copy-Item -LiteralPath (Join-Path $WebBuild 'src/Screen.tsx') -Destination (Join-Path $canonical 'src/Screen.tsx')
 }
} finally {Pop-Location}
Push-Location $root
try {
 New-Item -ItemType Directory -Force dist | Out-Null
 $env:CGO_ENABLED='0'
 & $Go test -buildvcs=false ./...
 if($LASTEXITCODE){throw 'Host tests failed'}
 & $Go vet ./...
 if($LASTEXITCODE){throw 'Host static analysis failed'}
 & $Go build -buildvcs=false -trimpath -ldflags "-s -w -X main.version=$Version" -o dist/one-authenticator.exe .
 if($LASTEXITCODE){throw 'Windows build failed'}
 $sum=(Get-FileHash dist/one-authenticator.exe).Hash.ToLowerInvariant()
 "$sum  one-authenticator.exe" | Set-Content -LiteralPath dist/SHA256SUMS.txt -Encoding ascii
} finally {Pop-Location}
