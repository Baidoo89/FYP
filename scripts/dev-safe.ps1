$ErrorActionPreference = 'Continue'

# Stop stale Next.js/Node processes that can hold .next/trace locks on Windows.
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

if (Test-Path .next) {
  Remove-Item .next -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host 'Starting development server on http://localhost:3000 ...'
$env:NODE_OPTIONS = ''
npx next dev
