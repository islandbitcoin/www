@echo off
setlocal enabledelayedexpansion

echo Island Bitcoin - One-Click Deployment Script (Windows)
echo ======================================================

:check_npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm is not installed. Please install Node.js first.
    pause
    exit /b 1
)

:customize
set /p customize="Would you like to customize the site configuration? (y/n): "
if /i "%customize%"=="y" (
    if not exist ".env" copy ".env.example" ".env"
    
    set /p site_name="Site name (default: Island Bitcoin): "
    set /p tagline="Site tagline (default: Bitcoin in Paradise): "
    set /p location="Community location (default: Caribbean): "
    set /p primary_color="Primary color hex (default: #FF6B35): "
    set /p accent_color="Accent color hex (default: #00A5CF): "
    
    echo Configuration updated!
)

:install_deps
echo Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Error installing dependencies
    pause
    exit /b 1
)

:build
echo Building project...
call npm run build
if %errorlevel% neq 0 (
    echo Error building project
    pause
    exit /b 1
)

:menu
echo.
echo Select deployment platform:
echo 1) Vercel
echo 2) Netlify
echo 3) Static files only
echo 4) Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto deploy_vercel
if "%choice%"=="2" goto deploy_netlify
if "%choice%"=="3" goto static_files
if "%choice%"=="4" goto end
goto menu

:deploy_vercel
echo Deploying to Vercel...
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Vercel CLI...
    call npm i -g vercel
)

if not exist "vercel.json" (
    echo Creating vercel.json...
    (
        echo {
        echo   "buildCommand": "npm run build",
        echo   "outputDirectory": "dist",
        echo   "framework": "vite",
        echo   "rewrites": [
        echo     { "source": "/(.*)", "destination": "/index.html" }
        echo   ]
        echo }
    ) > vercel.json
)

call vercel --prod
goto success

:deploy_netlify
echo Deploying to Netlify...
where netlify >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Netlify CLI...
    call npm i -g netlify-cli
)

if not exist "netlify.toml" (
    echo Creating netlify.toml...
    (
        echo [build]
        echo   command = "npm run build"
        echo   publish = "dist"
        echo.
        echo [[redirects]]
        echo   from = "/*"
        echo   to = "/index.html"
        echo   status = 200
    ) > netlify.toml
)

call netlify deploy --prod --dir=dist
goto success

:static_files
echo Build complete! Files are in the 'dist' directory.
goto success

:success
echo.
echo Deployment complete!
echo Don't forget to:
echo - Update your DNS settings if using a custom domain
echo - Configure your Nostr relays in the app settings
echo - Join the Island Bitcoin community!
pause
goto end

:end
exit /b 0