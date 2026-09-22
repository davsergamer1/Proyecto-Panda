@echo off
set PYTHONIOENCODING=utf-8
chcp 65001 > nul
if exist "..\..\.venv\Scripts\python.exe" (
    "..\..\.venv\Scripts\python.exe" solver.py
) else if exist "venv\Scripts\python.exe" (
    "venv\Scripts\python.exe" solver.py
) else if exist "%LOCALAPPDATA%\Python\bin\python.exe" (
    "%LOCALAPPDATA%\Python\bin\python.exe" solver.py
) else if exist "%USERPROFILE%\AppData\Local\Python\bin\python.exe" (
    "%USERPROFILE%\AppData\Local\Python\bin\python.exe" solver.py
) else (
    py -3 solver.py || python solver.py
)
