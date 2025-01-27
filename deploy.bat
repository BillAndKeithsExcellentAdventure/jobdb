@echo off
setlocal

REM Check if the project name is supplied as a command-line argument
if "%1"=="" (
    REM Prompt the user for the project name if not supplied
    set /p projectName=Enter the project name: 
) else (
    set projectName=%1
)

REM Define the source and destination directories
set sourceDir=%~dp0dist
set destDir=%~dp0..\%projectName%\node_modules\jobdb\dist

REM Check if the source directory exists
if not exist "%sourceDir%" (
    echo Source directory "%sourceDir%" does not exist.
    exit /b 1
)

REM Check if the destination directory exists, create it if it doesn't
if not exist "%destDir%" (
    echo Destination directory "%destDir%" does not exist. Exiting...
    exit /b 1
)

REM Copy the contents of the dist folder to the destination directory
xcopy /e /i /y "%sourceDir%\*" "%destDir%"

echo Files copied successfully to "%destDir%".
pause
endlocal