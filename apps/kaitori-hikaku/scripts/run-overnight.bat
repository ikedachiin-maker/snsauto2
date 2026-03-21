@echo off
chcp 65001 > nul
echo ========================================
echo   買取比較くん - 定価一括取得（夜間実行）
echo ========================================
echo.
echo 開始時刻: %date% %time%
echo 対象: 約1,682商品（定価なし）
echo 予想所要時間: 1.5〜2時間
echo.
echo ログファイル: logs\fetch-prices-%date:~0,4%%date:~5,2%%date:~8,2%.log
echo.

if not exist logs mkdir logs

python scripts\fetch-retail-prices-bulk.py > logs\fetch-prices-%date:~0,4%%date:~5,2%%date:~8,2%.log 2>&1

echo.
echo ========================================
echo   実行完了: %date% %time%
echo ========================================
echo.
echo 結果を確認してください:
echo   1. logs\fetch-prices-%date:~0,4%%date:~5,2%%date:~8,2%.log
echo   2. data\json\retail_prices_found.json
echo.
echo 次のステップ:
echo   npm run merge-prices
echo.
pause
