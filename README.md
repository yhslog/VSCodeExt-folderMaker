# Folder Maker

> Create folders and files from templates with smart variable substitution

🌍 **Languages:** [English](README.md) | [한국어](README.ko.md)

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## ✨ Features

- 🎯 **Template-based scaffolding** - Right-click any folder to create from templates
- 🔄 **Smart variable substitution** - Automatic case transformations (camelCase, kebabCase, pascalCase)
- ⚙️ **Workspace & global templates** - Project-specific or shared templates
- 🔒 **Security-first** - Path traversal protection, injection prevention
- 🌍 **Internationalized** - English and Korean support

## 🎥 Demo

![Demo](media/demo.gif)

> Right-click a folder → Select template → Enter name → Files created instantly

## 🚀 Quick Start

### Installation

1. Download from [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=yhslog.folder-maker)
2. Or install VSIX: `code --install-extension folder-maker-0.0.1.vsix`

### Usage

**Method 1: Context Menu**
1. Right-click any folder in Explorer
2. Select "Create from folder template"
3. Choose a template
4. Enter folder name
5. Done! ✅

**Method 2: Keyboard Shortcut**
- Windows/Linux: `Ctrl+Alt+F`
- macOS: `Cmd+Alt+F`

**Method 3: Command Palette**
- Press `Ctrl+Shift+P` (or `Cmd+Shift+P`)
- Type "Create from folder template"

## 📝 Template Configuration

### Workspace Templates (Recommended)

Create `.vscode/folder-maker.json` in your project:

```json
{
  "templates": [
    {
      "name": "React Component",
      "description": "TypeScript React component with test",
      "files": [
        {
          "path": "index.tsx",
          "content": "export { ${folderName|pascalCase} } from './${folderName|pascalCase}'\n"
        },
        {
          "path": "${folderName|pascalCase}.tsx",
          "content": "export const ${folderName|pascalCase} = () => {\n  return <div>${folderName}</div>\n}\n"
        },
        {
          "path": "__tests__/${folderName|pascalCase}.test.tsx",
          "content": "import { ${folderName|pascalCase} } from '../${folderName|pascalCase}'\n\ndescribe('${folderName|pascalCase}', () => {\n  it('renders', () => {\n    // test here\n  })\n})\n"
        }
      ]
    }
  ]
}
```

### Global Templates

Add to VS Code settings (`settings.json`):

```json
{
  "folderMaker.templates": [
    {
      "name": "React Component",
      "description": "TypeScript React component with test",
      "files": [
        {
          "path": "index.tsx",
          "content": "export { ${folderName|pascalCase} } from './${folderName|pascalCase}'\n"
        },
        {
          "path": "${folderName|pascalCase}.tsx",
          "content": "export const ${folderName|pascalCase} = () => {\n  return <div>${folderName}</div>\n}\n"
        },
        {
          "path": "__tests__/${folderName|pascalCase}.test.tsx",
          "content": "import { ${folderName|pascalCase} } from '../${folderName|pascalCase}'\n\ndescribe('${folderName|pascalCase}', () => {\n  it('renders', () => {\n    // test here\n  })\n})\n"
        }
      ]
    }
  ]
}
```

## 🔤 Variable Substitution

| Variable | Input: `UserProfile` | Output |
|----------|---------------------|--------|
| `${folderName}` | - | `UserProfile` |
| `${folderName\|camelCase}` | - | `userProfile` |
| `${folderName\|kebabCase}` | - | `user-profile` |
| `${folderName\|pascalCase}` | - | `UserProfile` |

### Examples

```typescript
// Template
export const ${folderName|camelCase} = () => {}

// Input: "MyComponent"
// Result:
export const myComponent = () => {}
```

## 🛡️ Security

- **Path traversal protection** - Blocks `../../../etc/passwd` attacks
- **Injection prevention** - Sanitizes `${malicious}` code
- **Resource limits** - Max 100 files, 10MB per file, 100MB total

## 📖 Documentation

- [CHANGELOG](CHANGELOG.md) - Version history
- [CLAUDE.md](CLAUDE.md) - Architecture guide
- [LICENSE](LICENSE) - MIT License

## 🔧 Development

### Setup

```bash
npm install
```

### Run Extension

Press `F5` in VS Code to launch Extension Development Host

### Testing

```bash
npm run test:run        # Run all tests (160 tests)
npm run test:coverage   # Generate coverage report
npm run lint:check      # ESLint check
npm run format:check    # Prettier check
```

### Build

```bash
npm run compile         # Compile TypeScript
vsce package           # Create VSIX
```

## 🤝 Contributing

Contributions are welcome! Please read [CLAUDE.md](CLAUDE.md) for development guidelines.

## 📄 License

[MIT](LICENSE) © 2025 yhslog

## 🙏 Acknowledgments

Built with [Claude Code](https://claude.com/claude-code)
