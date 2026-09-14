# Crea automáticamente toda la estructura de "Horarios Inteligentes con IO"
# Uso (en PowerShell): .\setup.ps1

$ErrorActionPreference = "Stop"
$PROJECT = "horarios-inteligentes"

Write-Host "Creando carpeta raíz del proyecto..."
New-Item -ItemType Directory -Force -Path $PROJECT | Out-Null
Set-Location $PROJECT

# 1) FRONTEND (React + Vite + Tailwind)
Write-Host "Creando frontend con React (Vite)..."
npm create vite@latest frontend -- --template react
Set-Location frontend
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
New-Item -ItemType Directory -Force -Path src/components, src/pages, src/services | Out-Null
Set-Location ..

# 2) BACKEND (Node.js + Express)
Write-Host "Creando backend con Node.js..."
New-Item -ItemType Directory -Force -Path backend/src/routes, backend/src/controllers, backend/src/config | Out-Null
Set-Location backend
npm init -y
npm install express cors dotenv @supabase/supabase-js
New-Item -ItemType File -Force -Path src/server.js | Out-Null
Set-Location ..

# 3) OPTIMIZER (Python + PuLP)
Write-Host "Creando módulo de optimización en Python..."
New-Item -ItemType Directory -Force -Path optimizer | Out-Null
New-Item -ItemType File -Force -Path optimizer/model.py, optimizer/solver.py, optimizer/data_loader.py | Out-Null
@"
pulp
supabase
python-dotenv
"@ | Out-File -Encoding utf8 optimizer/requirements.txt

# 4) DOCS
Write-Host "Creando carpeta de documentación..."
New-Item -ItemType Directory -Force -Path docs | Out-Null

# 5) README
@"
# Horarios Inteligentes con IO

Proyecto de curso - Investigacion de Operaciones
Universidad Mariano Galvez de Guatemala

## Estructura
- frontend/   -> React + Tailwind (Data Entry y calendario)
- backend/    -> Node.js + Express (API REST)
- optimizer/  -> Python + PuLP (motor de optimizacion)
- docs/       -> Documento de analisis y diagramas
"@ | Out-File -Encoding utf8 README.md

Write-Host ""
Write-Host "Estructura creada con exito dentro de la carpeta '$PROJECT'" -ForegroundColor Green