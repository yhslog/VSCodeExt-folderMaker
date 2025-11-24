import { describe, it, expect, beforeEach } from "vitest";
import { TemplateProcessor } from "./templateProcessor";
import { VariableSubstitution } from "./variableSubstitution";
import { PathValidator } from "../utils/pathValidator";
import {
  PathSecurityError,
  TemplateValidationError,
} from "../errors/templateError";
import { TemplateDef } from "../template/types";

describe("TemplateProcessor", () => {
  let processor: TemplateProcessor;
  let pathValidator: PathValidator;
  let variableSubstitution: VariableSubstitution;

  beforeEach(() => {
    pathValidator = new PathValidator();
    variableSubstitution = new VariableSubstitution();
    processor = new TemplateProcessor(pathValidator, variableSubstitution);
  });

  describe("planFileOperations", () => {
    describe("basic functionality", () => {
      it("should plan operations for simple template", () => {
        const template: TemplateDef = {
          name: "Simple",
          files: [{ path: "index.ts", content: 'export const name = "test";' }],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyComponent",
          folderName: "MyComponent",
          template,
        });

        expect(operations).toHaveLength(1);
        expect(operations[0].relativePath).toBe("index.ts");
        expect(operations[0].content).toBe('export const name = "test";');
        expect(operations[0].absolutePath).toContain("MyComponent");
      });

      it("should plan operations for multiple files", () => {
        const template: TemplateDef = {
          name: "Multi-file",
          files: [
            { path: "index.ts", content: 'export * from "./Component";' },
            {
              path: "Component.tsx",
              content: "export const Component = () => null;",
            },
            { path: "styles.css", content: ".component {}" },
          ],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyComponent",
          folderName: "MyComponent",
          template,
        });

        expect(operations).toHaveLength(3);
        expect(operations.map((op) => op.relativePath)).toEqual([
          "index.ts",
          "Component.tsx",
          "styles.css",
        ]);
      });

      it("should handle nested directory structures", () => {
        const template: TemplateDef = {
          name: "Nested",
          files: [
            { path: "src/index.ts" },
            { path: "src/components/Button.tsx" },
            { path: "src/utils/helpers.ts" },
          ],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyProject",
          folderName: "MyProject",
          template,
        });

        expect(operations).toHaveLength(3);
        expect(operations[0].relativePath).toMatch(/src[/\\]index\.ts/);
        expect(operations[1].relativePath).toMatch(
          /src[/\\]components[/\\]Button\.tsx/,
        );
        expect(operations[2].relativePath).toMatch(
          /src[/\\]utils[/\\]helpers\.ts/,
        );
      });
    });

    describe("variable substitution", () => {
      it("should substitute variables in file paths", () => {
        const template: TemplateDef = {
          name: "Variable Path",
          files: [{ path: "${folderName}.ts" }],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyComponent",
          folderName: "MyComponent",
          template,
        });

        expect(operations[0].relativePath).toBe("MyComponent.ts");
      });

      it("should substitute variables in file content", () => {
        const template: TemplateDef = {
          name: "Variable Content",
          files: [
            {
              path: "index.ts",
              content: 'export const name = "${folderName}";',
            },
          ],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/Test",
          folderName: "Test",
          template,
        });

        expect(operations[0].content).toBe('export const name = "Test";');
      });

      it("should apply case transformations", () => {
        const template: TemplateDef = {
          name: "Case Transform",
          files: [
            {
              path: "${folderName|kebabCase}.tsx",
              content:
                'export const ${folderName|camelCase} = "${folderName|pascalCase}";',
            },
          ],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/UserProfile",
          folderName: "UserProfile",
          template,
        });

        expect(operations[0].relativePath).toBe("user-profile.tsx");
        expect(operations[0].content).toBe(
          'export const userProfile = "UserProfile";',
        );
      });

      it("should handle multiple variables", () => {
        const template: TemplateDef = {
          name: "Multi Var",
          files: [
            {
              path: "${folderName|kebabCase}/index.ts",
              content:
                'export const ${folderName|camelCase}Name = "${folderName}";',
            },
          ],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyModule",
          folderName: "MyModule",
          template,
        });

        expect(operations[0].relativePath).toMatch(/my-module[/\\]index\.ts/);
        expect(operations[0].content).toBe(
          'export const myModuleName = "MyModule";',
        );
      });
    });

    describe("security - path validation", () => {
      it("should sanitize path traversal in template paths", () => {
        const template: TemplateDef = {
          name: "Path Traversal",
          files: [{ path: "../../../etc/passwd" }],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyComponent",
          folderName: "MyComponent",
          template,
        });

        // Path should be sanitized to remove traversal
        expect(operations[0].relativePath).toBe("etc/passwd");
        expect(operations[0].absolutePath).toContain("MyComponent");
      });

      it("should sanitize paths that would escape target directory", () => {
        const template: TemplateDef = {
          name: "Escape",
          files: [{ path: "../../outside/file.ts" }],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/project",
          folderName: "MyComponent",
          template,
        });

        // Path should be sanitized to remove traversal
        expect(operations[0].relativePath).toMatch(/outside[/\\]file\.ts/);
        expect(operations[0].absolutePath).toContain("project");
      });

      it("should sanitize absolute paths in templates", () => {
        const template: TemplateDef = {
          name: "Absolute",
          files: [{ path: "/etc/passwd" }],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyComponent",
          folderName: "MyComponent",
          template,
        });

        // Absolute path should be sanitized to relative
        expect(operations[0].relativePath).toBe("etc/passwd");
        expect(operations[0].absolutePath).toContain("MyComponent");
      });

      it("should sanitize dangerous path segments", () => {
        const template: TemplateDef = {
          name: "Dangerous",
          files: [{ path: "foo/../bar/./baz.ts" }],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyComponent",
          folderName: "MyComponent",
          template,
        });

        // Should sanitize to safe path
        expect(operations[0].relativePath).toMatch(/foo[/\\]bar[/\\]baz\.ts/);
      });

      it("should sanitize variable injection attacks", () => {
        const template: TemplateDef = {
          name: "Injection",
          files: [{ path: "${folderName}.ts" }],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace",
          folderName: "../../../etc/passwd",
          template,
        });

        // Variable value containing path traversal should be sanitized
        expect(operations[0].relativePath).toBe("etc/passwd.ts");
        expect(operations[0].absolutePath).toContain("workspace");
      });
    });

    describe("resource limits", () => {
      it("should reject templates with too many files", () => {
        const files = Array.from({ length: 101 }, (_, i) => ({
          path: `file${i}.ts`,
        }));

        const template: TemplateDef = {
          name: "Too Many Files",
          files,
        };

        expect(() =>
          processor.planFileOperations({
            targetRoot: "/workspace/MyComponent",
            folderName: "MyComponent",
            template,
          }),
        ).toThrow(TemplateValidationError);
      });

      it("should accept templates at the file limit", () => {
        const files = Array.from({ length: 100 }, (_, i) => ({
          path: `file${i}.ts`,
        }));

        const template: TemplateDef = {
          name: "Max Files",
          files,
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyComponent",
          folderName: "MyComponent",
          template,
        });

        expect(operations).toHaveLength(100);
      });

      it("should reject files that are too large", () => {
        const largeContent = "x".repeat(11 * 1024 * 1024); // 11MB

        const template: TemplateDef = {
          name: "Large File",
          files: [{ path: "large.txt", content: largeContent }],
        };

        expect(() =>
          processor.planFileOperations({
            targetRoot: "/workspace/MyComponent",
            folderName: "MyComponent",
            template,
          }),
        ).toThrow(TemplateValidationError);
      });

      it("should reject templates with excessive total size", () => {
        // 101 files of 1MB each = 101MB total (exceeds 100MB limit)
        const files = Array.from({ length: 101 }, (_, i) => ({
          path: `file${i}.txt`,
          content: "x".repeat(1024 * 1024), // 1MB
        }));

        const template: TemplateDef = {
          name: "Excessive Total",
          files,
        };

        expect(() =>
          processor.planFileOperations({
            targetRoot: "/workspace/MyComponent",
            folderName: "MyComponent",
            template,
          }),
        ).toThrow(TemplateValidationError);
      });

      it("should accept templates within size limits", () => {
        const files = Array.from({ length: 10 }, (_, i) => ({
          path: `file${i}.txt`,
          content: "x".repeat(1024 * 100), // 100KB each = 1MB total
        }));

        const template: TemplateDef = {
          name: "Within Limits",
          files,
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyComponent",
          folderName: "MyComponent",
          template,
        });

        expect(operations).toHaveLength(10);
      });
    });

    describe("custom resource limits", () => {
      it("should respect custom limits", () => {
        const customProcessor = new TemplateProcessor(
          pathValidator,
          variableSubstitution,
          {
            maxFilesPerTemplate: 5,
            maxFileSizeBytes: 1024, // 1KB
            maxTotalSizeBytes: 5 * 1024, // 5KB
          },
        );

        const files = Array.from({ length: 6 }, (_, i) => ({
          path: `file${i}.ts`,
        }));

        const template: TemplateDef = {
          name: "Exceeds Custom Limit",
          files,
        };

        expect(() =>
          customProcessor.planFileOperations({
            targetRoot: "/workspace/MyComponent",
            folderName: "MyComponent",
            template,
          }),
        ).toThrow(TemplateValidationError);
      });
    });

    describe("edge cases", () => {
      it("should handle empty file content", () => {
        const template: TemplateDef = {
          name: "Empty",
          files: [{ path: "empty.ts", content: "" }],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyComponent",
          folderName: "MyComponent",
          template,
        });

        expect(operations[0].content).toBe("");
      });

      it("should handle missing content (undefined)", () => {
        const template: TemplateDef = {
          name: "No Content",
          files: [{ path: "file.ts" }],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/MyComponent",
          folderName: "MyComponent",
          template,
        });

        expect(operations[0].content).toBe("");
      });

      it("should handle special characters in folder names", () => {
        const template: TemplateDef = {
          name: "Special Chars",
          files: [{ path: "${folderName}.ts" }],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/Test-123",
          folderName: "Test-123",
          template,
        });

        expect(operations[0].relativePath).toBe("Test-123.ts");
      });

      it("should handle Unicode in folder names", () => {
        const template: TemplateDef = {
          name: "Unicode",
          files: [{ path: "${folderName}.ts" }],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/テスト",
          folderName: "テスト",
          template,
        });

        expect(operations[0].relativePath).toBe("テスト.ts");
      });
    });

    describe("real-world templates", () => {
      it("should handle React component template", () => {
        const template: TemplateDef = {
          name: "React Component",
          files: [
            {
              path: "index.ts",
              content: 'export * from "./${folderName|pascalCase}";',
            },
            {
              path: "${folderName|pascalCase}.tsx",
              content:
                "import React from 'react';\n" +
                "\n" +
                "export const ${folderName|pascalCase} = () => {\n" +
                "  return <div>${folderName}</div>;\n" +
                "};",
            },
            {
              path: "${folderName|pascalCase}.test.tsx",
              content:
                "import { ${folderName|pascalCase} } from './${folderName|pascalCase}';\n" +
                "\n" +
                "test('renders ${folderName}', () => {\n" +
                "  // test code\n" +
                "});",
            },
          ],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/UserProfile",
          folderName: "UserProfile",
          template,
        });

        expect(operations).toHaveLength(3);
        expect(operations[0].content).toContain(
          'export * from "./UserProfile"',
        );
        expect(operations[1].relativePath).toBe("UserProfile.tsx");
        expect(operations[1].content).toContain("export const UserProfile");
        expect(operations[2].relativePath).toBe("UserProfile.test.tsx");
      });

      it("should handle Node.js module template", () => {
        const template: TemplateDef = {
          name: "Node Module",
          files: [
            {
              path: "src/${folderName|kebabCase}.ts",
              content:
                "export class ${folderName|pascalCase}Service {\n" +
                "  // implementation\n" +
                "}",
            },
            {
              path: "src/${folderName|kebabCase}.test.ts",
              content:
                "import { ${folderName|pascalCase}Service } from './${folderName|kebabCase}';\n" +
                "\n" +
                "describe('${folderName|pascalCase}Service', () => {\n" +
                "  // tests\n" +
                "});",
            },
            {
              path: "index.ts",
              content:
                "export { ${folderName|pascalCase}Service } from './src/${folderName|kebabCase}';",
            },
          ],
        };

        const operations = processor.planFileOperations({
          targetRoot: "/workspace/auth-service",
          folderName: "auth-service",
          template,
        });

        expect(operations).toHaveLength(3);
        expect(operations[0].relativePath).toMatch(/src[/\\]auth-service\.ts/);
        expect(operations[0].content).toContain(
          "export class AuthServiceService",
        );
        expect(operations[2].content).toContain("from './src/auth-service'");
      });
    });
  });
});
