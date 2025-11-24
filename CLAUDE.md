# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Please answer all the questions in Korean.

## Project Overview

**Folder Maker** is a VS Code extension that creates folders and files from predefined templates with variable substitution. Users can right-click on any folder in the Explorer and select "Create from folder template" to scaffold new structures.

Templates support:
- Variable substitution: `${folderName}` with case transformations (`|camelCase`, `|kebabCase`, `|pascalCase`)
- Multiple file creation with nested directories
- Custom templates via workspace config (`.vscode/folder-maker.json`) or global settings

## Commands

### Development
```bash
npm install              # Install dependencies
npm run compile          # Compile TypeScript once
npm run watch            # Watch mode for development
```

### Testing
```bash
npm test                 # Run tests in watch mode (vitest)
npm run test:run         # Run tests once
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report
```

**Important**: Tests that require VS Code APIs (like `src/commands/createFromTemplate.test.ts`) cannot run in standard Vitest environment. They use mocked services instead. Only pure business logic is tested with Vitest.

### Code Quality
```bash
npm run lint             # Lint and auto-fix
npm run lint:check       # Check without fixing
npm run format           # Format with Prettier
npm run format:check     # Check formatting
```

### Debugging
Press `F5` in VS Code to launch Extension Development Host. This opens a new VS Code window with the extension loaded.

## Architecture

### Core Design Pattern: Dependency Injection

The codebase follows a **pure business logic + adapter** pattern to maximize testability:

1. **Pure Services** (`src/services/`): No VS Code API dependencies
   - `TemplateProcessor`: Plans file operations (what to create, where, with what content)
   - `VariableSubstitution`: Handles `${variable|transformation}` replacement
   - `PathValidator`: Security validation and path sanitization

2. **Adapter Layer** (`src/services/` and `src/fs/`):
   - `FileSystemService`: Wraps VS Code file system API
   - `UIService`: Wraps VS Code UI (showQuickPick, showInputBox, etc.)

3. **Command Layer** (`src/commands/`):
   - `CreateFromTemplateCommand`: Orchestrates services, handles user flow

**Why this matters**: When testing business logic, use the pure services directly. When testing commands, use mock services from `src/test/mocks/`. This makes unit tests fast and doesn't require VS Code environment.

### Security Architecture

The extension implements **defense in depth** for path security:

1. **Input Validation** (`PathValidator.validateFolderName()`): Rejects dangerous folder names (path traversal, reserved names)
2. **Path Sanitization** (`PathValidator.sanitizePath()`): Removes `..`, `/`, and normalizes paths
3. **Boundary Checking** (`PathValidator.isSafe()`): Verifies resolved paths stay within target directory

**Critical**: The system *sanitizes* dangerous inputs rather than throwing errors. This is intentional - tests should verify sanitization behavior, not error throwing. See [templateProcessor.test.ts:160-243](src/services/templateProcessor.test.ts#L160-L243).

### Template Loading Strategy

Templates are loaded from two sources (workspace overrides global):
1. **Workspace**: `.vscode/folder-maker.json` (has priority)
2. **Global**: VS Code settings `folderMaker.templates`

See `src/template/loader.ts` for implementation.

### Variable Substitution Implementation

The `VariableSubstitution` service uses regex to find `${varName|transform}` patterns and:
1. Escapes dangerous characters (`$`, `` ` ``, `\`) to prevent template literal injection
2. Applies case transformations via `src/utils/case.ts` (kebab, camel, pascal)
3. Leaves unknown variables unchanged

**Security note**: All substituted values are sanitized to prevent code injection. See [variableSubstitution.test.ts:183-226](src/services/variableSubstitution.test.ts#L183-L226).

## File Structure

```
src/
├── commands/           # VS Code command implementations
├── services/           # Business logic (pure, testable)
├── utils/             # Utilities (case conversion, path validation, output)
├── template/          # Template loading and type definitions
├── fs/                # File system operations
├── errors/            # Custom error types
└── test/mocks/        # Mock implementations for testing
```

## Testing Guidelines

### Writing Tests

1. **For pure business logic**: Test directly against the class
   ```typescript
   const processor = new TemplateProcessor(pathValidator, variableSubstitution)
   const operations = processor.planFileOperations({...})
   ```

2. **For VS Code-dependent code**: Use mocks from `src/test/mocks/`
   ```typescript
   const mockFS = new MockFileSystemService()
   const mockUI = new MockUIService()
   const command = new CreateFromTemplateCommand(processor, mockFS, mockUI, mockOutput)
   ```

3. **Avoid template literals in test templates**: Use string concatenation instead
   ```typescript
   // BAD - JavaScript will try to evaluate ${folderName}
   const template = `export class ${folderName|pascalCase}`

   // GOOD - Literal string
   const template = 'export class ${folderName|pascalCase}'
   ```

### Test Configuration

- Tests exclude `src/extension.ts` (VS Code entry point)
- ESLint and TypeScript ignore test files to avoid VS Code API import errors
- Configuration in `vitest.config.ts`, `tsconfig.json`, and `eslint.config.mjs`

## Configuration Files

- `.vscode/folder-maker.json`: Workspace template definitions (user-facing)
- `schemas/templates.schema.json`: JSON schema for template validation
- `package.json`: VS Code extension manifest with commands, menus, keybindings

## Resource Limits

The `TemplateProcessor` enforces limits to prevent abuse:
- Max 100 files per template
- Max 10MB per file
- Max 100MB total template size

Limits can be customized via constructor. See [templateProcessor.test.ts:344-369](src/services/templateProcessor.test.ts#L344-L369).

## Localization

The extension supports i18n via `package.nls.json` (English) and `package.nls.ko.json` (Korean). Command titles and config descriptions use `%key%` references.
