$ErrorActionPreference = 'Stop'
& node (Join-Path $PSScriptRoot 'install.mjs') @args
exit $LASTEXITCODE
