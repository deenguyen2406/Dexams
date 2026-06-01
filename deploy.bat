@echo off
echo ==============================================
echo      DEXAMS - DEPLOY CODE LEN GITHUB
echo ==============================================
echo.

REM Kiem tra trang thai git
git status -s
echo.

echo Dang them cac thay doi vao staging...
git add .

set /p commit_msg="Nhap noi dung commit (Mac dinh: 'Cap nhat he thong'): "
if "%commit_msg%"=="" set commit_msg=Cap nhat he thong

echo.
echo Dang commit voi noi dung: "%commit_msg%"
git commit -m "%commit_msg%"
echo.

echo Dang day code len Github...
git push

echo.
if %errorlevel% neq 0 (
    echo [LOI] Day code that bai! Vui long kiem tra lai ket noi hoac conflict.
) else (
    echo [THANH CONG] Da day code len Github hoan tat!
)
echo.
pause
