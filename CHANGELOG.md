# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-01-24

### Added
- Template-based folder and file creation
- Smart variable substitution (`${folderName|camelCase|kebabCase|pascalCase}`)
- Workspace template priority (`.vscode/folder-maker.json`)
- Global template configuration (`settings.json`)
- Conflict resolution UI (Overwrite/Skip/Apply to All)
- Progress indicator
- Keyboard shortcut support (Ctrl+Alt+F / Cmd+Alt+F)
- Explorer context menu integration
- Internationalization (English, Korean)
- JSON schema validation for templates

### Security
- Path traversal attack prevention
- Template literal injection protection
- Resource limits (max 100 files, 10MB per file, 100MB total)
- Multi-layer path sanitization and validation

[0.0.1]: https://github.com/yhslog/VSCodeExt-folderMaker/releases/tag/v0.0.1
