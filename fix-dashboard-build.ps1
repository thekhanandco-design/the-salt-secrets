$ErrorActionPreference = 'Stop'

$target = Join-Path (Get-Location) 'src/app/admin/page.tsx'
if (-not (Test-Path $target)) {
  throw "File not found: $target. Run this script from your project root."
}

$content = Get-Content -Path $target -Raw
$replacement = @'
function countryFlag(name: string) {
  const codes: Record<string, string> = {
    Pakistan: "PK",
    "United States": "US",
    "United Kingdom": "GB",
    China: "CN",
    India: "IN",
    Germany: "DE",
    France: "FR",
    Canada: "CA",
    Australia: "AU",
    "United Arab Emirates": "AE",
    "Saudi Arabia": "SA",
    Netherlands: "NL",
    Spain: "ES",
    Italy: "IT",
    Portugal: "PT",
    Japan: "JP",
    Singapore: "SG",
    Brazil: "BR",
    Mexico: "MX",
    Turkey: "TR",
  };

  const code = codes[name];
  return code
    ? String.fromCodePoint(...code.split("").map((char) => 127397 + char.charCodeAt(0)))
    : "🌐";
}
'@

$pattern = '(?s)function\s+countryFlag\s*\(name:\s*string\)\s*\{.*?\n\}'
if ($content -notmatch $pattern) {
  throw 'countryFlag function was not found. Please upload src/app/admin/page.tsx for a full-file repair.'
}

$backup = "$target.backup-before-country-fix"
Copy-Item $target $backup -Force
$content = [regex]::Replace($content, $pattern, $replacement, 1)
Set-Content -Path $target -Value $content -Encoding utf8

Write-Host "Fixed: $target" -ForegroundColor Green
Write-Host "Backup: $backup" -ForegroundColor Yellow
Write-Host "Now run: Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue" -ForegroundColor Cyan
Write-Host "Then run: npm run dev" -ForegroundColor Cyan
