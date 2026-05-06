@echo off
echo ============================================
echo  Dental Clinic - Clean Setup Script
echo ============================================
echo.

echo [1/3] Removing old/broken node_modules...
if exist node_modules (
    rmdir /s /q node_modules
    echo Done - node_modules removed.
) else (
    echo node_modules not found, skipping.
)

echo.
echo [2/3] Running fresh npm install...
call npm install --no-audit --no-fund
if errorlevel 1 (
    echo.
    echo ERROR: npm install failed. Please check your internet connection.
    pause
    exit /b 1
)

echo.
echo [3/3] Starting development server...
echo.
echo ============================================
echo  SUCCESS! Opening http://localhost:3000
echo ============================================
echo.
start http://localhost:3000
call npm run dev

pause
