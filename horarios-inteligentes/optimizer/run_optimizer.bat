@echo off
set PYTHONIOENCODING=utf-8
chcp 65001 > nul
if exist "..\..\.venv\Scripts\python.exe" (
    "..\..\.venv\Scripts\python.exe" solver.py
) else if exist "venv\Scripts\python.exe" (
    "venv\Scripts\python.exe" solver.py
) else (
    python solver.py
)
