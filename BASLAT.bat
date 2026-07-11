@echo off
title EstetiX - Gelistirme Sunucusu
cd /d "%~dp0"
echo ============================================================
echo   EstetiX gelistirme sunucusu baslatiliyor...
echo   Birkac saniye bekleyin, asagida su satir cikacak:
echo   Local:  http://localhost:5173/
echo.
echo   O satir cikinca tarayicida http://localhost:5173 ac.
echo   ONEMLI: Bu pencereyi KAPATMA (acik kaldikca calisir).
echo   Durdurmak icin: Ctrl+C
echo ============================================================
echo.
call npm run dev
echo.
echo Sunucu durdu. Cikmak icin bir tusa basin...
pause >nul
