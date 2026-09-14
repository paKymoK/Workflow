@echo off
setlocal

rem Runs ChunkedUploadCli.java directly (JDK 11+ single-file source launch, no build step).
rem Prefers JAVA_HOME if set; falls back to the JDK 17 install used by this repo's backend.

set "JAVA_BIN=java"
if defined JAVA_HOME (
    set "JAVA_BIN=%JAVA_HOME%\bin\java.exe"
) else if exist "C:\Users\PC\.jdks\jbr-17.0.14\bin\java.exe" (
    set "JAVA_BIN=C:\Users\PC\.jdks\jbr-17.0.14\bin\java.exe"
)

if "%~1"=="" (
    echo Usage: %~nx0 ^<file^> [--base-url URL] [--token TOKEN]
    echo.
    echo   Requires a JDK 11+ runtime and an access token: pass --token ^<jwt^> or set
    echo   WORKFLOW_ACCESS_TOKEN ^(copy it from the app's Session Storage in DevTools
    echo   while logged in^). Base URL defaults to WORKFLOW_API_BASE_URL or
    echo   http://localhost:8080.
    exit /b 1
)

"%JAVA_BIN%" "%~dp0ChunkedUploadCli.java" %*
exit /b %ERRORLEVEL%
