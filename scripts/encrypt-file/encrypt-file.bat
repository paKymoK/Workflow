@echo off
setlocal

rem Runs encrypt-file.ps1 - pure Windows PowerShell + the built-in CNG crypto library (bcrypt.dll),
rem no Java or any other extra install required. Works on any Windows machine with PowerShell 5.1
rem (ships by default on Windows 10/11).

if "%~1"=="" (
    echo Usage: %~nx0 ^<input-file^> [output-file.txt]
    echo.
    echo   AES-GCM encrypts input-file with the app's shared key and writes the result
    echo   as base64 text to output-file.txt ^(default: ^<input-file^>.b64.txt^).
    echo   Paste that text into the "Upload from encrypted text" panel on the
    echo   Chunked Upload page.
    exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0encrypt-file.ps1" %*
exit /b %ERRORLEVEL%
