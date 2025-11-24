# folder-maker
스마트 변수 치환을 지원하는 템플릿 기반 폴더/파일 생성 VS Code 확장 프로그램

## VS Code Extension
- 개발 환경: TypeScript, VS Code Extension Host 디버깅 구성 포함
- 기본 커맨드: `Folder Maker: Hello World`
- 생성 커맨드: `Create from folder template` (Explorer 우클릭)
- 단축키: `Ctrl+Alt+F` (Mac: `Cmd+Alt+F`)

### 시작하기
1) 의존성 설치: `npm install`
2) 디버깅 실행: VS Code에서 `F5` (Run Extension)
3) 명령 실행: 명령 팔레트에서 `Folder Maker: Hello World` 검색/실행
4) 폴더 생성: 탐색기에서 폴더 우클릭 → `Create from folder template`

### 스크립트
- `npm run compile`: TypeScript 컴파일 (단발)
- `npm run watch`: TypeScript 변경 감지 컴파일

### 패키징 (선택)
- `vsce` 설치 후 `vsce package`로 `.vsix` 생성 가능
- 마켓플레이스 배포 전 `publisher` 값을 `package.json`에 실제 퍼블리셔로 변경하세요

## 템플릿 사용법
- 글로벌 설정: `settings.json`에 `folderMaker.templates` 배열 정의
- 워크스페이스 설정: `.vscode/folder-maker.json`에 `templates` 정의 (전역보다 우선)

예시 `.vscode/folder-maker.json`:

```
{
  "templates": [
    {
      "name": "Basic Module",
      "description": "index.ts와 테스트 파일 생성",
      "files": [
        { "path": "index.ts", "content": "export const name='${folderName|camelCase}';\n" },
        { "path": "__tests__/${folderName|kebabCase}.test.ts", "content": "describe('${folderName}', () => {});\n" }
      ]
    }
  ]
}
```

지원 변수 치환:
- `${folderName}`
- `${folderName|kebabCase}`
- `${folderName|camelCase}`
- `${folderName|pascalCase}`
