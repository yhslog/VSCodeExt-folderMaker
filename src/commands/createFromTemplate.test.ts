import { describe, it, expect, beforeEach } from "vitest";
import { MockFileSystemService } from "../test/mocks/MockFileSystemService";
import { MockUIService } from "../test/mocks/MockUIService";
import { MockOutputChannel } from "../test/mocks/MockOutputChannel";
import { TemplateProcessor } from "../services/templateProcessor";
import { VariableSubstitution } from "../services/variableSubstitution";
import { PathValidator } from "../utils/pathValidator";
import { TemplateDef } from "../template/types";

describe("CreateFromTemplateCommand", () => {
  let mockFS: MockFileSystemService;
  let mockUI: MockUIService;
  let mockOutput: MockOutputChannel;

  const createTemplate = (
    files: Array<{ path: string; content?: string }>,
  ): TemplateDef => ({
    name: "Test Template",
    description: "A test template",
    files,
  });

  beforeEach(() => {
    mockFS = new MockFileSystemService();
    mockUI = new MockUIService();
    mockOutput = new MockOutputChannel();

    // Create command with mocked dependencies
    const processor = new TemplateProcessor(
      new PathValidator(),
      new VariableSubstitution(),
    );

    // Default workspace setup
    mockFS.addDirectory("/workspace");
  });

  describe("basic file creation", () => {
    it("should create a single file", async () => {
      const template = createTemplate([
        { path: "index.ts", content: "export {};" },
      ]);

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace" } as any);

      const files = mockFS.getFiles();
      expect(files.has("/workspace/MyComponent/index.ts")).toBe(true);
      expect(files.get("/workspace/MyComponent/index.ts")).toBe("export {};");
    });

    it("should create multiple files", async () => {
      const template = createTemplate([
        { path: "index.ts", content: 'export * from "./Component";' },
        {
          path: "Component.tsx",
          content: "export const Component = () => null;",
        },
        { path: "styles.css", content: ".component {}" },
      ]);

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace" } as any);

      const files = mockFS.getFiles();
      expect(files.size).toBe(3);
      expect(files.has("/workspace/MyComponent/index.ts")).toBe(true);
      expect(files.has("/workspace/MyComponent/Component.tsx")).toBe(true);
      expect(files.has("/workspace/MyComponent/styles.css")).toBe(true);
    });

    it("should create nested directory structures", async () => {
      const template = createTemplate([
        { path: "src/index.ts" },
        { path: "src/components/Button.tsx" },
        { path: "tests/unit/Button.test.tsx" },
      ]);

      mockUI.setFolderNameResponse("MyProject");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace" } as any);

      const files = mockFS.getFiles();
      expect(files.has("/workspace/MyProject/src/index.ts")).toBe(true);
      expect(files.has("/workspace/MyProject/src/components/Button.tsx")).toBe(
        true,
      );
      expect(files.has("/workspace/MyProject/tests/unit/Button.test.tsx")).toBe(
        true,
      );
    });
  });

  describe("variable substitution", () => {
    it("should substitute variables in file paths", async () => {
      const template = createTemplate([
        { path: "${folderName}.ts", content: "export {};" },
      ]);

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace" } as any);

      const files = mockFS.getFiles();
      expect(files.has("/workspace/MyComponent/MyComponent.ts")).toBe(true);
    });

    it("should substitute variables in file content", async () => {
      const template = createTemplate([
        { path: "index.ts", content: 'export const name = "${folderName}";' },
      ]);

      mockUI.setFolderNameResponse("TestModule");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace" } as any);

      const content = mockFS.getFiles().get("/workspace/TestModule/index.ts");
      expect(content).toBe('export const name = "TestModule";');
    });

    it("should apply case transformations", async () => {
      const template = createTemplate([
        {
          path: "${folderName|kebabCase}.tsx",
          content:
            'export const ${folderName|camelCase} = "${folderName|pascalCase}";',
        },
      ]);

      mockUI.setFolderNameResponse("UserProfile");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace" } as any);

      const files = mockFS.getFiles();
      expect(files.has("/workspace/UserProfile/user-profile.tsx")).toBe(true);
      expect(files.get("/workspace/UserProfile/user-profile.tsx")).toBe(
        'export const userProfile = "UserProfile";',
      );
    });
  });

  describe("conflict handling", () => {
    it("should skip existing file when user chooses skip", async () => {
      const template = createTemplate([
        { path: "index.ts", content: "new content" },
        { path: "new-file.ts", content: "also new" },
      ]);

      // Pre-existing file
      mockFS.addFile("/workspace/MyComponent/index.ts", "existing content");

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);
      mockUI.setConflictResolutions([{ action: "skip", applyToAll: false }]);

      await command.execute({ fsPath: "/workspace" } as any);

      const files = mockFS.getFiles();
      expect(files.get("/workspace/MyComponent/index.ts")).toBe(
        "existing content",
      ); // Unchanged
      expect(files.get("/workspace/MyComponent/new-file.ts")).toBe("also new"); // Created
    });

    it("should overwrite existing file when user chooses overwrite", async () => {
      const template = createTemplate([
        { path: "index.ts", content: "new content" },
      ]);

      mockFS.addFile("/workspace/MyComponent/index.ts", "existing content");

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);
      mockUI.setConflictResolutions([
        { action: "overwrite", applyToAll: false },
      ]);

      await command.execute({ fsPath: "/workspace" } as any);

      const content = mockFS.getFiles().get("/workspace/MyComponent/index.ts");
      expect(content).toBe("new content");
    });

    it("should skip all when user chooses skip all", async () => {
      const template = createTemplate([
        { path: "file1.ts", content: "new 1" },
        { path: "file2.ts", content: "new 2" },
        { path: "file3.ts", content: "new 3" },
      ]);

      mockFS.addFile("/workspace/MyComponent/file1.ts", "existing 1");
      mockFS.addFile("/workspace/MyComponent/file2.ts", "existing 2");
      mockFS.addFile("/workspace/MyComponent/file3.ts", "existing 3");

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);
      mockUI.setConflictResolutions([{ action: "skip", applyToAll: true }]);

      await command.execute({ fsPath: "/workspace" } as any);

      const files = mockFS.getFiles();
      expect(files.get("/workspace/MyComponent/file1.ts")).toBe("existing 1");
      expect(files.get("/workspace/MyComponent/file2.ts")).toBe("existing 2");
      expect(files.get("/workspace/MyComponent/file3.ts")).toBe("existing 3");
    });

    it("should overwrite all when user chooses overwrite all", async () => {
      const template = createTemplate([
        { path: "file1.ts", content: "new 1" },
        { path: "file2.ts", content: "new 2" },
        { path: "file3.ts", content: "new 3" },
      ]);

      mockFS.addFile("/workspace/MyComponent/file1.ts", "existing 1");
      mockFS.addFile("/workspace/MyComponent/file2.ts", "existing 2");
      mockFS.addFile("/workspace/MyComponent/file3.ts", "existing 3");

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);
      mockUI.setConflictResolutions([
        { action: "overwrite", applyToAll: true },
      ]);

      await command.execute({ fsPath: "/workspace" } as any);

      const files = mockFS.getFiles();
      expect(files.get("/workspace/MyComponent/file1.ts")).toBe("new 1");
      expect(files.get("/workspace/MyComponent/file2.ts")).toBe("new 2");
      expect(files.get("/workspace/MyComponent/file3.ts")).toBe("new 3");
    });

    it("should handle cancel during conflict", async () => {
      const template = createTemplate([
        { path: "file1.ts", content: "new 1" },
        { path: "file2.ts", content: "new 2" },
      ]);

      mockFS.addFile("/workspace/MyComponent/file1.ts", "existing 1");

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);
      mockUI.setConflictResolutions([{ action: "cancel" }]);

      await command.execute({ fsPath: "/workspace" } as any);

      const files = mockFS.getFiles();
      // Should stop processing
      expect(files.get("/workspace/MyComponent/file1.ts")).toBe("existing 1");
      expect(files.has("/workspace/MyComponent/file2.ts")).toBe(false);
    });
  });

  describe("user cancellation", () => {
    it("should handle cancellation at folder name prompt", async () => {
      mockUI.setFolderNameResponse(undefined); // User cancelled

      await command.execute({ fsPath: "/workspace" } as any);

      const files = mockFS.getFiles();
      expect(files.size).toBe(0); // No files created
      expect(mockOutput.contains("cancelled")).toBe(true);
    });

    it("should handle cancellation at template selection", async () => {
      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(undefined); // User cancelled

      await command.execute({ fsPath: "/workspace" } as any);

      const files = mockFS.getFiles();
      expect(files.size).toBe(0);
      expect(mockOutput.contains("cancelled")).toBe(true);
    });
  });

  describe("error handling", () => {
    it("should handle path security errors", async () => {
      const template = createTemplate([
        { path: "../../../etc/passwd", content: "evil" },
      ]);

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace" } as any);

      // Should log security error
      expect(mockOutput.contains("Security Error")).toBe(true);

      // Should show error to user
      const errors = mockUI.getErrorMessages();
      expect(errors.length).toBeGreaterThan(0);
    });

    it("should handle template validation errors", async () => {
      // Template with too many files
      const files = Array.from({ length: 101 }, (_, i) => ({
        path: `file${i}.ts`,
        content: "content",
      }));
      const template = createTemplate(files);

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace" } as any);

      expect(mockOutput.contains("Template Error")).toBe(true);
      expect(mockUI.getErrorMessages().length).toBeGreaterThan(0);
    });

    it("should handle missing workspace folder", async () => {
      await command.execute(undefined); // No URI provided

      const warnings = mockUI.getWarningMessages();
      expect(warnings).toContain("No workspace folder found.");
    });
  });

  describe("success feedback", () => {
    it("should show success message after creation", async () => {
      const template = createTemplate([
        { path: "index.ts" },
        { path: "Component.tsx" },
      ]);

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace" } as any);

      const success = mockUI.getSuccessMessages();
      expect(success.length).toBe(1);
      expect(success[0].files.length).toBe(2);
    });

    it("should log all created files to output channel", async () => {
      const template = createTemplate([
        { path: "index.ts" },
        { path: "Component.tsx" },
        { path: "styles.css" },
      ]);

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace" } as any);

      expect(mockOutput.contains("index.ts")).toBe(true);
      expect(mockOutput.contains("Component.tsx")).toBe(true);
      expect(mockOutput.contains("styles.css")).toBe(true);
      expect(mockOutput.contains("Created files:")).toBe(true);
    });

    it("should show warning when no files created", async () => {
      const template = createTemplate([{ path: "index.ts", content: "test" }]);

      // Pre-existing file
      mockFS.addFile("/workspace/MyComponent/index.ts", "existing");

      mockUI.setFolderNameResponse("MyComponent");
      mockUI.setTemplateResponse(template);
      mockUI.setConflictResolutions([{ action: "skip", applyToAll: false }]);

      await command.execute({ fsPath: "/workspace" } as any);

      const warnings = mockUI.getWarningMessages();
      expect(warnings.some((w) => w.includes("No files"))).toBe(true);
    });
  });

  describe("real-world scenarios", () => {
    it("should create React component structure", async () => {
      const template = createTemplate([
        {
          path: "index.ts",
          content: 'export * from "./${folderName|pascalCase}";',
        },
        {
          path: "${folderName|pascalCase}.tsx",
          content:
            "import React from 'react';\n" +
            "\n" +
            "export interface ${folderName|pascalCase}Props {}\n" +
            "\n" +
            "export const ${folderName|pascalCase}: React.FC<${folderName|pascalCase}Props> = () => {\n" +
            "  return <div>${folderName|pascalCase}</div>;\n" +
            "};",
        },
        {
          path: "${folderName|pascalCase}.test.tsx",
          content:
            "import { render } from '@testing-library/react';\n" +
            "import { ${folderName|pascalCase} } from './${folderName|pascalCase}';\n" +
            "\n" +
            "describe('${folderName|pascalCase}', () => {\n" +
            "  it('renders', () => {\n" +
            "    render(<${folderName|pascalCase} />);\n" +
            "  });\n" +
            "});",
        },
        {
          path: "${folderName|kebabCase}.module.css",
          content: ".${folderName|camelCase} {\n" + "  /* styles */\n" + "}",
        },
      ]);

      mockUI.setFolderNameResponse("UserProfile");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace/components" } as any);

      const files = mockFS.getFiles();

      expect(files.has("/workspace/components/UserProfile/index.ts")).toBe(
        true,
      );
      expect(
        files.has("/workspace/components/UserProfile/UserProfile.tsx"),
      ).toBe(true);
      expect(
        files.has("/workspace/components/UserProfile/UserProfile.test.tsx"),
      ).toBe(true);
      expect(
        files.has("/workspace/components/UserProfile/user-profile.module.css"),
      ).toBe(true);

      const indexContent = files.get(
        "/workspace/components/UserProfile/index.ts",
      );
      expect(indexContent).toContain('export * from "./UserProfile"');

      const componentContent = files.get(
        "/workspace/components/UserProfile/UserProfile.tsx",
      );
      expect(componentContent).toContain("export interface UserProfileProps");
      expect(componentContent).toContain(
        "export const UserProfile: React.FC<UserProfileProps>",
      );

      const cssContent = files.get(
        "/workspace/components/UserProfile/user-profile.module.css",
      );
      expect(cssContent).toContain(".userProfile");
    });

    it("should create TypeScript service with tests", async () => {
      const template = createTemplate([
        {
          path: "src/${folderName|kebabCase}.service.ts",
          content:
            "export class ${folderName|pascalCase}Service {\n" +
            "  constructor() {}\n" +
            "\n" +
            "  async get${folderName|pascalCase}() {\n" +
            "    // implementation\n" +
            "  }\n" +
            "}",
        },
        {
          path: "src/${folderName|kebabCase}.service.test.ts",
          content:
            "import { ${folderName|pascalCase}Service } from './${folderName|kebabCase}.service';\n" +
            "\n" +
            "describe('${folderName|pascalCase}Service', () => {\n" +
            "  let service: ${folderName|pascalCase}Service;\n" +
            "\n" +
            "  beforeEach(() => {\n" +
            "    service = new ${folderName|pascalCase}Service();\n" +
            "  });\n" +
            "\n" +
            "  it('should create', () => {\n" +
            "    expect(service).toBeDefined();\n" +
            "  });\n" +
            "});",
        },
        {
          path: "index.ts",
          content:
            "export { ${folderName|pascalCase}Service } from './src/${folderName|kebabCase}.service';",
        },
      ]);

      mockUI.setFolderNameResponse("authentication");
      mockUI.setTemplateResponse(template);

      await command.execute({ fsPath: "/workspace/services" } as any);

      const files = mockFS.getFiles();

      expect(
        files.has(
          "/workspace/services/authentication/src/authentication.service.ts",
        ),
      ).toBe(true);
      expect(
        files.has(
          "/workspace/services/authentication/src/authentication.service.test.ts",
        ),
      ).toBe(true);
      expect(files.has("/workspace/services/authentication/index.ts")).toBe(
        true,
      );

      const serviceContent = files.get(
        "/workspace/services/authentication/src/authentication.service.ts",
      );
      expect(serviceContent).toContain("export class AuthenticationService");
      expect(serviceContent).toContain("async getAuthentication()");

      const indexContent = files.get(
        "/workspace/services/authentication/index.ts",
      );
      expect(indexContent).toContain("export { AuthenticationService }");
      expect(indexContent).toContain("from './src/authentication.service'");
    });
  });
});
