$ErrorActionPreference = "Stop"
$Project = Split-Path -Parent $MyInvocation.MyCommand.Path
$Backend = Join-Path $Project "backend"
$Frontend = Join-Path $Project "frontend"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Fundação Manuel Cruz - Iniciando Sistema de Gestão" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path (Join-Path $Backend "pom.xml"))) {
    Write-Host "[ERRO] backend\pom.xml não encontrado." -ForegroundColor Red
    exit 1
}
if (-not (Test-Path (Join-Path $Frontend "package.json"))) {
    Write-Host "[ERRO] frontend\package.json não encontrado." -ForegroundColor Red
    exit 1
}

$MvnCommand = if (Test-Path (Join-Path $Backend "mvnw.cmd")) { ".\mvnw.cmd" } else { "mvn" }

Write-Host "Iniciando backend Spring Boot (Java 21) em http://localhost:8080 ..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", "Set-Location '$Backend'; $MvnCommand spring-boot:run"
)

Start-Sleep -Seconds 3

Write-Host "Iniciando frontend Next.js em http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell.exe -ArgumentList @(
    "-NoExit",
    "-ExecutionPolicy", "Bypass",
    "-Command", "Set-Location '$Frontend'; npm run dev"
)

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "[SUCESSO] Backend e Frontend iniciados em janelas separadas!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Painel Geral:      http://localhost:3000" -ForegroundColor White
Write-Host "Painel Financeiro: http://localhost:3000/financeiro" -ForegroundColor White
Write-Host "Swagger / API:     http://localhost:8080/api/v1/financial/summary?month=10&year=2026" -ForegroundColor White
Write-Host "Health Check:      http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host ""

