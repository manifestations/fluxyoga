# GitHub Repository Setup Script (PowerShell)
# Updates repository URLs after upload to manifestations/fluxyoga

Write-Host "🔧 Updating repository URLs for manifestations/fluxyoga..." -ForegroundColor Blue

# Update package.json
Write-Host "📦 Updating package.json..." -ForegroundColor Green
(Get-Content package.json) -replace '"url": "git\+https://github\.com/manifestations/fluxyoga\.git"', '"url": "git+https://github.com/manifestations/fluxyoga.git"' | Set-Content package.json
(Get-Content package.json) -replace '"homepage": "https://github\.com/manifestations/fluxyoga#readme"', '"homepage": "https://github.com/manifestations/fluxyoga#readme"' | Set-Content package.json
(Get-Content package.json) -replace '"url": "https://github\.com/manifestations/fluxyoga/issues"', '"url": "https://github.com/manifestations/fluxyoga/issues"' | Set-Content package.json

# Update README.md
Write-Host "📖 Updating README.md..." -ForegroundColor Green
(Get-Content README.md) -replace 'https://github\.com/manifestations/fluxyoga', 'https://github.com/manifestations/fluxyoga' | Set-Content README.md

# Update CONTRIBUTING.md
Write-Host "🤝 Updating CONTRIBUTING.md..." -ForegroundColor Green
(Get-Content CONTRIBUTING.md) -replace 'https://github\.com/manifestations/fluxyoga', 'https://github.com/manifestations/fluxyoga' | Set-Content CONTRIBUTING.md

# Update other documentation files
Write-Host "📄 Updating other documentation..." -ForegroundColor Green
Get-ChildItem *.md | ForEach-Object {
    (Get-Content $_.FullName) -replace 'manifestations/fluxyoga', 'manifestations/fluxyoga' | Set-Content $_.FullName
}

Write-Host "✅ Repository URLs updated successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Ready to commit and push to GitHub:" -ForegroundColor Yellow
Write-Host "git add ." -ForegroundColor Cyan
Write-Host "git commit -m 'Update repository URLs to manifestations/fluxyoga'" -ForegroundColor Cyan
Write-Host "git push" -ForegroundColor Cyan
