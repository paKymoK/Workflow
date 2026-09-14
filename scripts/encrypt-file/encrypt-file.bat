@echo off
setlocal

rem Runs EncryptFile.java directly (JDK 11+ single-file source launch, no build step).
rem Prefers JAVA_HOME if set; falls back to the JDK 17 install used by this repo's backend.

set "JAVA_BIN=java"
if defined JAVA_HOME (
    set "JAVA_BIN=%JAVA_HOME%\bin\java.exe"
) else if exist "C:\Users\PC\.jdks\jbr-17.0.14\bin\java.exe" (
    set "JAVA_BIN=C:\Users\PC\.jdks\jbr-17.0.14\bin\java.exe"
)

if "%~1"=="" (
    echo Usage: %~nx0 ^<input-file^> [output-file.txt]
    echo.
    echo   AES-GCM encrypts input-file with the app's shared key and writes the result
    echo   as base64 text to output-file.txt ^(default: ^<input-file^>.b64.txt^).
    echo   Paste that text into the "Upload from encrypted text" panel on the
    echo   Chunked Upload page.
    exit /b 1
)

"%JAVA_BIN%" "%~dp0EncryptFile.java" %*
exit /b %ERRORLEVEL%
