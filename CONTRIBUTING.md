# Contributing to FluxYoga

Thank you for your interest in contributing to FluxYoga! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 18.0.0 or higher
- Python 3.10+
- Git
- Basic knowledge of React, TypeScript, and Electron

### Development Setup
1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/manifestations/fluxyoga.git
   cd fluxyoga
   ```
3. Clone the required sd-scripts dependency:
   ```bash
   git clone https://github.com/kohya-ss/sd-scripts.git
   ```
4. Install dependencies:
   ```bash
   npm install
   cd sd-scripts
   pip install -r requirements.txt
   cd ..
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

## 📝 Code Style

### TypeScript Guidelines
- Use strict TypeScript configuration
- Define interfaces for all data structures
- Add JSDoc comments for public APIs
- Prefer `const` over `let` when possible
- Use descriptive variable and function names

### React Guidelines
- Use functional components with hooks
- Implement proper error boundaries
- Follow Material-UI design patterns
- Keep components focused and reusable
- Use proper TypeScript props interfaces

### File Structure
```
src/
├── components/           # React components
│   ├── common/          # Reusable components
│   ├── training/        # Training-specific components
│   └── settings/        # Settings components
├── services/            # Business logic and API calls
├── types/               # TypeScript definitions
├── styles/              # Styling and themes
└── utils/               # Utility functions
```

## 🧪 Testing

### Running Tests
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

### Writing Tests
- Write unit tests for utility functions
- Test React components with React Testing Library
- Mock external dependencies
- Aim for meaningful test coverage

## 🐛 Bug Reports

### Before Submitting
- Check existing issues to avoid duplicates
- Test with the latest version
- Gather relevant system information

### Bug Report Template
```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. Windows 11]
- Node.js version: [e.g. 18.17.0]
- App version: [e.g. 1.0.0]
- GPU: [e.g. RTX 4090]
```

## 💡 Feature Requests

### Before Submitting
- Check if the feature already exists
- Consider if it fits the project's scope
- Think about potential implementation challenges

### Feature Request Template
```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

## 🔄 Pull Requests

### Process
1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Make your changes
4. Write or update tests
5. Run the test suite
6. Commit your changes:
   ```bash
   git commit -m "Add amazing feature"
   ```
7. Push to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
8. Open a Pull Request

### Pull Request Guidelines
- **Title**: Use a clear, descriptive title
- **Description**: Explain what changes you made and why
- **Testing**: Describe how you tested your changes
- **Screenshots**: Include screenshots for UI changes
- **Breaking Changes**: Clearly mark any breaking changes

### PR Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Tests pass locally
- [ ] Added tests for new functionality
- [ ] Manual testing completed

## Screenshots
If applicable, add screenshots of your changes.

## Checklist
- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] Any dependent changes have been merged and published
```

## 🎨 Design Guidelines

### UI/UX Principles
- **Simplicity**: Keep interfaces clean and focused
- **Consistency**: Follow Material-UI design system
- **Accessibility**: Ensure WCAG 2.1 compliance
- **Performance**: Optimize for responsiveness
- **Dark/Light Themes**: Support both theme modes

### Color Palette
- Primary: Material-UI default blue
- Secondary: Complementary colors
- Error: Red variants for errors
- Warning: Orange/yellow for warnings
- Success: Green for success states

## 📚 Documentation

### Code Documentation
- Add JSDoc comments for all public functions
- Include parameter and return type descriptions
- Provide usage examples for complex functions

### README Updates
- Update README.md for new features
- Include screenshots for UI changes
- Update installation instructions if needed

## 🏷️ Release Process

### Versioning
We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Notes
- Document all changes in CHANGELOG.md
- Include migration guides for breaking changes
- Highlight new features and improvements

## 🤝 Community

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers get started
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md)

### Communication
- **Issues**: Bug reports and feature requests
- **Discussions**: General questions and ideas
- **Discord**: Real-time community chat (if available)

## 📊 Performance Guidelines

### Optimization
- Minimize bundle size
- Optimize React renders with useMemo/useCallback
- Lazy load components when appropriate
- Profile performance with React DevTools

### Memory Management
- Clean up event listeners and timeouts
- Properly dispose of resources
- Monitor memory usage in Electron

## 🔒 Security

### Reporting Security Issues
- **DO NOT** create public issues for security vulnerabilities
- Email security issues to: security@fluxyoga.dev
- Provide detailed reproduction steps
- Allow time for response before public disclosure

### Security Guidelines
- Validate all user inputs
- Sanitize file paths and commands
- Use secure defaults
- Regular dependency updates

## 📋 Checklist for Contributors

Before submitting your contribution:

- [ ] Code follows project style guidelines
- [ ] Tests pass and new tests are added
- [ ] Documentation is updated
- [ ] CHANGELOG.md is updated
- [ ] Commit messages are clear and descriptive
- [ ] PR description explains the changes
- [ ] No console errors or warnings
- [ ] Performance impact is considered
- [ ] Security implications are reviewed

## 🙏 Recognition

Contributors will be:
- Listed in the project README
- Mentioned in release notes
- Given credit in the application's about page
- Invited to join the core team (for significant contributions)

Thank you for contributing to FluxYoga! 🚀
