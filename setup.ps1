# ============================================================
# Dental Clinic - Clean Windows Setup Script (PowerShell)
# RIGHT-CLICK this file → "Run with PowerShell"
# ============================================================

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Dental Clinic - Windows Setup Script" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Delete broken node_modules (handles Windows long paths)
Write-Host "[1/3] Removing old/broken node_modules..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    try {
        # Use robocopy mirror trick to handle deep paths on Windows
        $emptyDir = "$env:TEMP\empty_for_mirror_$(Get-Random)"
        New-Item -ItemType Directory -Path $emptyDir -Force | Out-Null
        & robocopy $emptyDir "node_modules" /MIR /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
        Remove-Item -Path $emptyDir -Recurse -Force -ErrorAction SilentlyContinue
        Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✓ node_modules removed" -ForegroundColor Green
    } catch {
        Write-Host "   Trying alternative removal..." -ForegroundColor Yellow
        Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "   ✓ Done" -ForegroundColor Green
    }
} else {
    Write-Host "   node_modules not found, skipping." -ForegroundColor Gray
}

# Also remove .next build cache
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "   ✓ .next cache removed" -ForegroundColor Green
}

# Step 2: Fresh npm install
Write-Host ""
Write-Host "[2/3] Running fresh npm install..." -ForegroundColor Yellow
Write-Host "   (this may take 1-2 minutes)" -ForegroundColor Gray
Write-Host ""

& npm install --no-audit --no-fund

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "   npm install had issues, trying with --ignore-scripts..." -ForegroundColor Yellow
    & npm install --no-audit --no-fund --ignore-scripts
}

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: npm install failed." -ForegroundColor Red
    Write-Host "Please check your internet connection and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "   ✓ Dependencies installed!" -ForegroundColor Green

# Step 3: Start dev server
Write-Host ""
Write-Host "[3/3] Starting development server..." -ForegroundColor Yellow
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  SUCCESS! Opening http://localhost:3000" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

Start-Process "http://localhost:3000"
& npm run dev
