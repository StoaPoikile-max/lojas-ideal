@echo off
cd /d "%~dp0"
where git >nul 2>nul
if errorlevel 1 (
  echo O Git nao esta instalado neste computador. Baixe em https://git-scm.com e rode este arquivo de novo.
  pause
  exit /b 1
)
if not exist .git (
  git init -b main
  git remote add origin https://github.com/StoaPoikile-max/lojas-ideal.git
)
git add -A
git commit -m "Atualiza o site da Lojas Ideal"
git push -u origin main
echo.
echo Pronto. Se apareceu "main -^> main" acima, o site foi enviado ao GitHub.
pause
