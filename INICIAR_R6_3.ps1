$ErrorActionPreference = "Stop"
$Project = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Project "backend"
$Frontend = Join-Path $Project "frontend"

if (-not (Test-Path (Join-Path $Backend "pom.xml"))) {
    Write-Host "[ERRO] backend\\pom.xml nao encontrado." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $Frontend "package.json"))) {
    Write-Host "[ERRO] frontend\\package.json nao encontrado." -ForegroundColor Red
    exit 1
}

Write-Host "Iniciando backend Java em http://localhost:8080 ..." -ForegroundColor Cyan
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", "Set-Location '$Backend'; mvn spring-boot:run -Dspring-boot.run.profiles=r63"
)

Start-Sleep -Seconds 3

Write-Host "Iniciando frontend Next.js em http://localhost:3000 ..." -ForegroundColor Cyan
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", "Set-Location '$Frontend'; npm run dev"
)

Write-Host "" 
Write-Host "[OK] Duas janelas foram abertas." -ForegroundColor Green
Write-Host "Frontend: http://localhost:3000/financeiro"
Write-Host "Backend : http://localhost:8080/api/v1/financial/summary?month=9&year=2026"
