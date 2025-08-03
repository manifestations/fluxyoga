#!/bin/bash

# GitHub Repository Setup Script
# Updates repository URLs after upload to manifestations/fluxyoga

echo "🔧 Updating repository URLs for manifestations/fluxyoga..."

# Update package.json
echo "📦 Updating package.json..."
sed -i 's|"url": "git+https://github.com/manifestations/fluxyoga.git"|"url": "git+https://github.com/manifestations/fluxyoga.git"|g' package.json
sed -i 's|"homepage": "https://github.com/manifestations/fluxyoga#readme"|"homepage": "https://github.com/manifestations/fluxyoga#readme"|g' package.json
sed -i 's|"url": "https://github.com/manifestations/fluxyoga/issues"|"url": "https://github.com/manifestations/fluxyoga/issues"|g' package.json

# Update README.md
echo "📖 Updating README.md..."
sed -i 's|https://github.com/manifestations/fluxyoga|https://github.com/manifestations/fluxyoga|g' README.md

# Update CONTRIBUTING.md
echo "🤝 Updating CONTRIBUTING.md..."
sed -i 's|https://github.com/manifestations/fluxyoga|https://github.com/manifestations/fluxyoga|g' CONTRIBUTING.md

# Update other documentation files
echo "📄 Updating other documentation..."
sed -i 's|manifestations/fluxyoga|manifestations/fluxyoga|g' *.md

echo "✅ Repository URLs updated successfully!"
echo ""
echo "🚀 Ready to commit and push to GitHub:"
echo "git add ."
echo "git commit -m 'Update repository URLs to manifestations/fluxyoga'"
echo "git push"
