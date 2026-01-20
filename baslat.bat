@echo off
echo ========================================
echo    IS TAKIP SISTEMI BASLATILIYOR...
echo ========================================
echo.

cd /d "%~dp0"

echo Node.js kontrol ediliyor...
node --version >nul 2>&1
if errorlevel 1 (
    echo HATA: Node.js yuklu degil!
    echo Lutfen nodejs.org adresinden Node.js yukleyin.
    pause
    exit /b 1
)

echo.
echo Baglanti kontrol ediliyor...
if not exist "node_modules" (
    echo Ilk kurulum yapiliyor... (Bu sadece bir kere olacak)
    call npm install
)

echo.
echo Uygulama baslatiliyor...
echo Tarayici otomatik acilacak: http://localhost:3000
echo.
echo KAPATMAK ICIN: Bu pencereyi kapatin veya Ctrl+C basin
echo.

timeout /t 3 /nobreak >nul
start http://localhost:3000

npm run dev

pause
