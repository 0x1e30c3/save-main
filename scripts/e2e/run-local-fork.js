#!/usr/bin/env node
const { execSync, spawn } = require('child_process');
const path = require('path');

// This script runs the Foundry unit tests locally.

function runForgeTests() {
  console.log('Running forge tests...');
  try {
    const { execSync } = require('child_process');
    execSync('cd evm && forge test', { stdio: 'inherit' });
  } catch (err) {
    console.error('forge tests failed');
    process.exit(1);
  }
}

function main() {
  console.log('Running local forge tests (no network fork).');
  runForgeTests();
}

main();
