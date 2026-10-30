@echo off
chcp 65001 >nul
cd /d "%~dp0"
python serve-workbench.py
if errorlevel 1 pause
