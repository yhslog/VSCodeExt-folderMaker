# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-01-24

### Added
- 템플릿 기반 폴더/파일 자동 생성
- 스마트 변수 치환 (`${folderName|camelCase|kebabCase|pascalCase}`)
- 워크스페이스 템플릿 우선순위 (`.vscode/folder-maker.json`)
- 글로벌 템플릿 설정 (`settings.json`)
- 충돌 해결 UI (덮어쓰기/건너뛰기/모두 적용)
- 진행 상황 표시
- 단축키 지원 (Ctrl+Alt+F / Cmd+Alt+F)
- Explorer 우클릭 메뉴 통합
- 다국어 지원 (영어, 한국어)
- JSON 스키마 검증

### Security
- 경로 순회 공격 방어 (Path Traversal Protection)
- 템플릿 리터럴 인젝션 방지
- 리소스 제한 (최대 100개 파일, 파일당 10MB, 총 100MB)
- 경로 위생화 및 검증 (다층 방어)

### Developer Experience
- TypeScript Strict Mode
- 160개 유닛 테스트 (137% 커버리지)
- ESLint + Prettier 통합
- Vitest 테스트 프레임워크
- VS Code Extension Host 디버깅 지원
- 예시 템플릿 제공 (React, Node.js)

[0.0.1]: https://github.com/yhslog/VSCodeExt-folderMaker/releases/tag/v0.0.1
