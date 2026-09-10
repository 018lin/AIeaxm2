$ErrorActionPreference = 'Stop'

$mysqlHome = $env:SCAN_GRADING_MYSQL_HOME
if (-not $mysqlHome) {
  $mysqlHome = 'D:\mysql\mysql-8.4.11-winx64'
}

$dataDir = $env:SCAN_GRADING_MYSQL_DATA
if (-not $dataDir) {
  $dataDir = 'D:\mysql\scan-grading-dev-data'
}

$port = $env:SCAN_GRADING_MYSQL_PORT
if (-not $port) {
  $port = '3307'
}

$mysqld = Join-Path $mysqlHome 'bin\mysqld.exe'
$pidPath = Join-Path $dataDir "mysql-$port.pid"
$errorLog = Join-Path $dataDir "mysql-$port.err"

if (-not (Test-Path -LiteralPath $mysqld)) {
  throw "mysqld.exe not found: $mysqld"
}

if (-not (Test-Path -LiteralPath $dataDir)) {
  throw "MySQL data directory not found: $dataDir"
}

$listener = Get-NetTCPConnection -LocalPort ([int]$port) -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  Write-Host "MySQL is already listening on port $port."
  exit 0
}

$existing = Get-CimInstance Win32_Process |
  Where-Object { $_.Name -eq 'mysqld.exe' -and $_.CommandLine -like "*$dataDir*" }

if ($existing) {
  Write-Host "MySQL is already running for $dataDir. PID: $($existing.ProcessId)"
  exit 0
}

$args = @(
  '--no-defaults',
  "--basedir=$mysqlHome",
  "--datadir=$dataDir",
  "--port=$port",
  '--bind-address=127.0.0.1',
  '--character-set-server=utf8mb4',
  '--collation-server=utf8mb4_0900_ai_ci',
  '--default-storage-engine=INNODB',
  "--log-error=$errorLog",
  "--pid-file=$pidPath"
)

$process = Start-Process -FilePath $mysqld -ArgumentList $args -WindowStyle Hidden -PassThru
Write-Host "Started MySQL on port $port. PID: $($process.Id)"

Start-Sleep -Seconds 3
$listener = Get-NetTCPConnection -LocalPort ([int]$port) -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
  throw "MySQL did not start on port $port. Check log: $errorLog"
}
