# Contributing to DVPeasy

Thank you for your interest in contributing to DVPeasy! This document provides guidelines for contributing to the project.

## Reporting bugs

If you find a bug, please [open an issue](https://github.com/tristan-mcdonald/dvpeasy/issues) with:

- A clear description of the problem
- Steps to reproduce the issue
- Expected vs actual behaviour
- Browser and wallet information
- Network you were using (Sepolia, Polygon, etc.)

## Suggesting features

Feature requests are welcome! Please [open an issue](https://github.com/tristan-mcdonald/dvpeasy/issues) describing:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## Development setup

### Prerequisites

- **Node.js** 23.11.x (use `nvm use` with the included `.nvmrc`)
- **Yarn 4** (enable with `corepack enable`)
- **MetaMask** or another Ethereum wallet
- **Test ETH** for testnets

### Getting started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/dvpeasy.git
   cd dvpeasy
   ```
3. Install dependencies:
   ```bash
   corepack enable
   yarn install
   ```
4. (Optional) Create a `.env` file with your Alchemy API key:
   ```env
   VITE_ALCHEMY_API_KEY=your-api-key-here
   ```
5. Start the development server:
   ```bash
   yarn dev
   ```

## Pull request process

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Make your changes following the code style guidelines below
3. Run linting to check code quality:
   ```bash
   yarn lint
   ```
4. Fix any linting issues:
   ```bash
   yarn lint:fix
   ```
5. Ensure the build passes:
   ```bash
   yarn build
   ```
6. (Optional) Run e2e tests:
   ```bash
   yarn pretest:e2e:playwright
   yarn pretest:e2e:synpress
   yarn test:e2e
   ```
7. Commit your changes with a clear commit message
8. Push to your fork and open a pull request

## Code style guidelines

This project uses ESLint with TypeScript support. Key style requirements:

- **Single quotes** for strings
- **Trailing commas** in multi-line arrays and objects
- **Semicolons** at end of statements
- **Space before function parentheses**: `function name () {}`
- **Alphabetically ordered imports**:
  ```typescript
  import a from 'package';
  import { b, g, v } from 'other-package';
  import t from 'another-package';
  ```
- **Verbose variable names**: avoid single-letter variables
- **JSDoc comments** for functions in JavaScript files
- **Periods at end of comments**

### Code organization

Functions should be organised into manager objects that handle similar responsibilities. This keeps code maintainable and strictly tied to context.

### What to avoid

- Over-engineering or adding unnecessary features
- Adding comments that reference previous state (e.g., "replaced with...")
- Creating documentation files unless explicitly requested
- Adding emojis unless requested

## Pre-commit hooks

This repository uses pre-commit hooks to enforce code quality. To set them up:

1. Install pre-commit:
   ```bash
   brew install pre-commit  # macOS
   # or
   pip install pre-commit
   ```
2. Install the hooks:
   ```bash
   pre-commit install
   ```

The hooks will run ESLint with `--max-warnings=0`, so warnings will fail the commit.

## Questions?

If you have questions about contributing, feel free to [open an issue](https://github.com/tristan-mcdonald/dvpeasy/issues) for discussion.
