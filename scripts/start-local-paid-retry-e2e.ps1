param([int]$Port = 3001)

function Read-EnvValue([string]$Path, [string]$Name) {
  $line = Get-Content -LiteralPath $Path | Where-Object { $_ -match "^$Name=" } | Select-Object -First 1
  if ($null -eq $line) { return $null }
  return $line.Substring($Name.Length + 1).Trim().Trim('"').Trim("'")
}

function Read-RazorpayE2EValue([string]$Name) {
  # A genuine test credential supplied to this launch process takes precedence.
  # The checked-in development .env may intentionally contain placeholders.
  $processValue = [Environment]::GetEnvironmentVariable($Name, 'Process')
  if ($processValue) { return $processValue }
  return Read-EnvValue '.env' $Name
}

$databaseUrl = Read-EnvValue '.env.test.local' 'DATABASE_URL'
$directUrl = Read-EnvValue '.env.test.local' 'DIRECT_URL'
foreach ($value in @($databaseUrl, $directUrl)) {
  if (-not $value) { throw 'Missing local test database configuration.' }
  $uri = [uri]$value
  if ($uri.Host -ne '127.0.0.1' -or $uri.Port -ne 5433 -or $uri.AbsolutePath.Trim('/') -ne 'sivora_test') {
    throw 'Refusing to start E2E mode against a non-local test database.'
  }
}

$keyId = Read-RazorpayE2EValue 'RAZORPAY_KEY_ID'
if (-not $keyId -or $keyId -notmatch '^rzp_test_' -or $keyId.ToLower().Contains('xxxx') -or $keyId.ToLower().Contains('change_me')) {
  throw 'A genuine Razorpay test-mode public key is required.'
}
foreach ($name in @('RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET')) {
  $value = Read-RazorpayE2EValue $name
  if (-not $value -or $value.ToLower().Contains('xxxx') -or $value.ToLower().Contains('change_me')) { throw "A genuine $name is required for local E2E mode." }
  Set-Item -Path "Env:$name" -Value $value
}

$env:DATABASE_URL = $databaseUrl
$env:DIRECT_URL = $directUrl
$env:NEXT_PUBLIC_RAZORPAY_KEY_ID = $keyId

& npm.cmd run dev -- --port $Port
