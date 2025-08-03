#!/usr/bin/env node

/**
 * Alpha Release Test Script
 * Verifies core functionality for FluxYoga v1.0.0-alpha
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

console.log(`${BLUE}FluxYoga v1.0.0-alpha Test Suite${RESET}`);
console.log('=' .repeat(40));

let passed = 0;
let failed = 0;

function test(name, testFn) {
  try {
    testFn();
    console.log(`${GREEN}✓${RESET} ${name}`);
    passed++;
  } catch (error) {
    console.log(`${RED}✗${RESET} ${name}: ${error.message}`);
    failed++;
  }
}

// Test 1: Package.json version
test('Package version is 1.0.0-alpha', () => {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  if (pkg.version !== '1.0.0-alpha') {
    throw new Error(`Expected 1.0.0-alpha, got ${pkg.version}`);
  }
});

// Test 2: Required files exist
test('Core documentation files exist', () => {
  const requiredFiles = [
    'README.md',
    'LICENSE',
    'CONTRIBUTING.md',
    'CHANGELOG.md',
    '.gitignore'
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Missing required file: ${file}`);
    }
  }
});

// Test 3: Source structure
test('Source code structure is correct', () => {
  const requiredDirs = [
    'src',
    'src/components',
    'src/services',
    'src/types'
  ];
  
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      throw new Error(`Missing required directory: ${dir}`);
    }
  }
});

// Test 4: TypeScript compilation
test('TypeScript compiles without errors', () => {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('TypeScript compilation failed');
  }
});

// Test 5: Key components exist
test('Core components are present', () => {
  const coreComponents = [
    'src/App.tsx',
    'src/services/GPUDetection.ts',
    'src/components/training/SimpleTrainingForm.tsx',
    'src/components/gpu/GPUInfoCard.tsx'
  ];
  
  for (const component of coreComponents) {
    if (!fs.existsSync(component)) {
      throw new Error(`Missing core component: ${component}`);
    }
  }
});

// Test 6: Build succeeds
test('Production build succeeds', () => {
  try {
    execSync('npm run build', { stdio: 'pipe' });
  } catch (error) {
    throw new Error('Production build failed');
  }
});

// Test 7: sd-scripts is excluded
test('sd-scripts directory is properly excluded', () => {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (!gitignore.includes('sd-scripts/')) {
    throw new Error('sd-scripts not properly excluded in .gitignore');
  }
});

// Test 8: Alpha documentation
test('Alpha limitations are documented', () => {
  const readme = fs.readFileSync('README.md', 'utf8');
  if (!readme.includes('Alpha Release Notice')) {
    throw new Error('Alpha notice missing from README');
  }
  
  if (!readme.includes('Alpha Release Limitations')) {
    throw new Error('Alpha limitations section missing from README');
  }
});

console.log('\n' + '=' .repeat(40));
console.log(`${BLUE}Test Results:${RESET}`);
console.log(`${GREEN}Passed: ${passed}${RESET}`);
console.log(`${failed > 0 ? RED : GREEN}Failed: ${failed}${RESET}`);

if (failed === 0) {
  console.log(`\n${GREEN}🎉 All tests passed! FluxYoga v1.0.0-alpha is ready for release.${RESET}`);
  process.exit(0);
} else {
  console.log(`\n${RED}❌ ${failed} test(s) failed. Please fix issues before release.${RESET}`);
  process.exit(1);
}
