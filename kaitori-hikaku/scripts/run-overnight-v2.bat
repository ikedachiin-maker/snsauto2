@echo off
chcp 65001 > nul
echo ========================================
echo   買取比較くん - 定価一括取得 v2（夜間実行）
echo ========================================
echo.
echo 開始時刻: %date% %time%
echo.

if not exist logs mkdir logs

set LOGFILE=logs\fetch-prices-v2-%date:~0,4%%date:~5,2%%date:~8,2%.log

echo ログファイル: %LOGFILE%
echo.

python scripts\fetch-retail-prices-v2.py > %LOGFILE% 2>&1

echo.
echo ========================================
echo   実行完了: %date% %time%
echo ========================================
echo.
echo 次のステップ:
echo   npm run merge-prices
echo   npm run dev
echo.
pause
