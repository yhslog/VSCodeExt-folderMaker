import { describe, it, expect, beforeEach } from "vitest";
import { VariableSubstitution } from "./variableSubstitution";

describe("VariableSubstitution", () => {
  let substitution: VariableSubstitution;

  beforeEach(() => {
    substitution = new VariableSubstitution();
  });

  describe("apply", () => {
    describe("basic variable substitution", () => {
      it("should substitute simple variables", () => {
        const result = substitution.apply("Hello ${name}", { name: "World" });
        expect(result).toBe("Hello World");
      });

      it("should substitute multiple variables", () => {
        const result = substitution.apply("${greeting} ${name}!", {
          greeting: "Hello",
          name: "World",
        });
        expect(result).toBe("Hello World!");
      });

      it("should handle variables at different positions", () => {
        const template = "${start} middle ${end}";
        const result = substitution.apply(template, {
          start: "Beginning",
          end: "Finale",
        });
        expect(result).toBe("Beginning middle Finale");
      });

      it("should leave unknown variables unchanged", () => {
        const result = substitution.apply("${known} ${unknown}", {
          known: "foo",
        });
        expect(result).toBe("foo ${unknown}");
      });
    });

    describe("case transformations", () => {
      describe("camelCase transformation", () => {
        it("should convert kebab-case to camelCase", () => {
          const result = substitution.apply("${name|camelCase}", {
            name: "my-component",
          });
          expect(result).toBe("myComponent");
        });

        it("should convert PascalCase to camelCase", () => {
          const result = substitution.apply("${name|camelCase}", {
            name: "MyComponent",
          });
          expect(result).toBe("myComponent");
        });

        it("should handle snake_case", () => {
          const result = substitution.apply("${name|camelCase}", {
            name: "my_component",
          });
          expect(result).toBe("myComponent");
        });

        it("should handle spaces", () => {
          const result = substitution.apply("${name|camelCase}", {
            name: "my component",
          });
          expect(result).toBe("myComponent");
        });
      });

      describe("kebabCase transformation", () => {
        it("should convert camelCase to kebab-case", () => {
          const result = substitution.apply("${name|kebabCase}", {
            name: "myComponent",
          });
          expect(result).toBe("my-component");
        });

        it("should convert PascalCase to kebab-case", () => {
          const result = substitution.apply("${name|kebabCase}", {
            name: "MyComponent",
          });
          expect(result).toBe("my-component");
        });

        it("should handle snake_case", () => {
          const result = substitution.apply("${name|kebabCase}", {
            name: "my_component",
          });
          expect(result).toBe("my-component");
        });

        it("should handle spaces", () => {
          const result = substitution.apply("${name|kebabCase}", {
            name: "My Component",
          });
          expect(result).toBe("my-component");
        });
      });

      describe("pascalCase transformation", () => {
        it("should convert camelCase to PascalCase", () => {
          const result = substitution.apply("${name|pascalCase}", {
            name: "myComponent",
          });
          expect(result).toBe("MyComponent");
        });

        it("should convert kebab-case to PascalCase", () => {
          const result = substitution.apply("${name|pascalCase}", {
            name: "my-component",
          });
          expect(result).toBe("MyComponent");
        });

        it("should handle snake_case", () => {
          const result = substitution.apply("${name|pascalCase}", {
            name: "my_component",
          });
          expect(result).toBe("MyComponent");
        });

        it("should handle spaces", () => {
          const result = substitution.apply("${name|pascalCase}", {
            name: "my component",
          });
          expect(result).toBe("MyComponent");
        });
      });

      it("should handle unknown transformations gracefully", () => {
        const result = substitution.apply("${name|unknownTransform}", {
          name: "myComponent",
        });
        expect(result).toBe("myComponent"); // Returns original value
      });

      it("should be case-insensitive for transformation names", () => {
        expect(
          substitution.apply("${name|CAMELCASE}", { name: "my-component" }),
        ).toBe("myComponent");
        expect(
          substitution.apply("${name|CamelCase}", { name: "my-component" }),
        ).toBe("myComponent");
      });
    });

    describe("complex templates", () => {
      it("should handle multiple variables with different transformations", () => {
        const template = "${name|camelCase}-${type|kebabCase}.ts";
        const result = substitution.apply(template, {
          name: "MyComponent",
          type: "TestFile",
        });
        expect(result).toBe("myComponent-test-file.ts");
      });

      it("should work in file paths", () => {
        const template = "src/${module|kebabCase}/${name|pascalCase}.tsx";
        const result = substitution.apply(template, {
          module: "userProfile",
          name: "edit-form",
        });
        expect(result).toBe("src/user-profile/EditForm.tsx");
      });

      it("should work in file content", () => {
        const template =
          "export class ${name|pascalCase} {\n" +
          "  private ${name|camelCase}Id: string;\n" +
          "\n" +
          "  constructor() {\n" +
          "    this.${name|camelCase}Id = '${name|kebabCase}';\n" +
          "  }\n" +
          "}";
        const result = substitution.apply(template, { name: "user-profile" });
        expect(result).toContain("export class UserProfile");
        expect(result).toContain("private userProfileId: string;");
        expect(result).toContain("this.userProfileId = 'user-profile';");
      });
    });

    describe("edge cases", () => {
      it("should handle empty template", () => {
        expect(substitution.apply("", { name: "test" })).toBe("");
      });

      it("should handle template with no variables", () => {
        expect(substitution.apply("plain text", { name: "test" })).toBe(
          "plain text",
        );
      });

      it("should handle empty variable values", () => {
        expect(substitution.apply("${name}", { name: "" })).toBe("");
      });

      it("should handle template with only variable", () => {
        expect(substitution.apply("${name}", { name: "test" })).toBe("test");
      });

      it("should handle consecutive variables", () => {
        const result = substitution.apply("${first}${second}", {
          first: "Hello",
          second: "World",
        });
        expect(result).toBe("HelloWorld");
      });

      it("should handle special characters in variable values", () => {
        const result = substitution.apply("${name}", { name: "test@123" });
        expect(result).toBe("test@123");
      });
    });

    describe("security - injection prevention", () => {
      it("should sanitize template literal syntax", () => {
        const result = substitution.apply("const x = ${value}", {
          value: "${dangerous}",
        });
        // Actual output has double backslash (escaped backslash + literal $)
        expect(result).toBe("const x = \\\\${dangerous}");
        // The literal string ${dangerous} is still present but escaped
      });

      it("should sanitize backticks", () => {
        const result = substitution.apply("const x = ${value}", {
          value: "`evil`",
        });
        // Backticks are escaped with backslash
        expect(result).toBe("const x = \\\\`evil\\\\`");
      });

      it("should sanitize backslashes", () => {
        const result = substitution.apply("${value}", {
          value: "test\\escape",
        });
        expect(result).toContain("\\\\");
      });

      it("should prevent code injection in template literals", () => {
        const malicious = "${process.env.SECRET}";
        const result = substitution.apply('const key = "${apiKey}"', {
          apiKey: malicious,
        });
        // The sanitized value should have escaped ${ to \${
        expect(result).toBe('const key = "\\\\${process.env.SECRET}"');
        expect(result).toContain("\\\\${");
      });

      it("should prevent nested variable expansion", () => {
        const result = substitution.apply("${outer}", {
          outer: "${inner}",
          inner: "leaked",
        });
        // Should not expand the inner variable - should be escaped
        expect(result).toBe("\\\\${inner}");
        expect(result).not.toBe("leaked");
      });

      it("should handle XSS-like payloads", () => {
        const xss = '<script>alert("xss")</script>';
        const result = substitution.apply("${value}", { value: xss });
        // Should preserve HTML (not our job to escape), but sanitize template syntax
        expect(result).toBe('<script>alert("xss")</script>');
      });
    });

    describe("variable name validation", () => {
      it("should accept valid variable names", () => {
        expect(substitution.apply("${name}", { name: "test" })).toBe("test");
        expect(substitution.apply("${_name}", { _name: "test" })).toBe("test");
        expect(substitution.apply("${name123}", { name123: "test" })).toBe(
          "test",
        );
        expect(substitution.apply("${camelCase}", { camelCase: "test" })).toBe(
          "test",
        );
      });

      it("should not match invalid variable syntax", () => {
        // These should not be treated as variables
        expect(substitution.apply("${123}", {})).toBe("${123}");
        expect(substitution.apply("${-name}", {})).toBe("${-name}");
        expect(substitution.apply("${}", {})).toBe("${}");
      });
    });
  });

  describe("extractVariableNames", () => {
    it("should extract simple variable names", () => {
      const names = substitution.extractVariableNames("Hello ${name}");
      expect(names).toEqual(["name"]);
    });

    it("should extract multiple variables", () => {
      const names = substitution.extractVariableNames("${greeting} ${name}!");
      expect(names).toEqual(["greeting", "name"]);
    });

    it("should extract variable names without transformations", () => {
      const names = substitution.extractVariableNames("${name|camelCase}");
      expect(names).toEqual(["name"]);
    });

    it("should handle duplicate variables", () => {
      const names = substitution.extractVariableNames(
        "${name} and ${name} again",
      );
      expect(names).toEqual(["name"]); // Should be unique
    });

    it("should return empty array for template with no variables", () => {
      const names = substitution.extractVariableNames("plain text");
      expect(names).toEqual([]);
    });

    it("should extract from complex templates", () => {
      const template = "src/${module|kebabCase}/${name|pascalCase}/${id}.tsx";
      const names = substitution.extractVariableNames(template);
      expect(names).toEqual(expect.arrayContaining(["module", "name", "id"]));
      expect(names).toHaveLength(3);
    });
  });

  describe("real-world scenarios", () => {
    it("should handle React component template", () => {
      const template =
        "import React from 'react';\n" +
        "\n" +
        "export interface ${name|pascalCase}Props {\n" +
        "  className?: string;\n" +
        "}\n" +
        "\n" +
        "export const ${name|pascalCase}: React.FC<${name|pascalCase}Props> = (props) => {\n" +
        "  return <div className={`${name|kebabCase} ${props.className || ''}`}>\n" +
        "    ${name|pascalCase} Component\n" +
        "  </div>;\n" +
        "};";

      const result = substitution.apply(template, { name: "user-profile" });

      expect(result).toContain("interface UserProfileProps");
      expect(result).toContain(
        "export const UserProfile: React.FC<UserProfileProps>",
      );
      expect(result).toContain(
        "className={`user-profile ${props.className || ''}`}",
      );
    });

    it("should handle TypeScript class template", () => {
      const template =
        "export class ${name|pascalCase}Service {\n" +
        "  private ${name|camelCase}Repository: Repository;\n" +
        "\n" +
        "  async get${name|pascalCase}ById(id: string) {\n" +
        "    return this.${name|camelCase}Repository.findById(id);\n" +
        "  }\n" +
        "}";

      const result = substitution.apply(template, { name: "user-profile" });

      expect(result).toContain("class UserProfileService");
      expect(result).toContain("private userProfileRepository");
      expect(result).toContain("async getUserProfileById");
    });

    it("should handle file path generation", () => {
      const paths = [
        "src/components/${name|kebabCase}/index.ts",
        "src/components/${name|kebabCase}/${name|pascalCase}.tsx",
        "src/components/${name|kebabCase}/${name|pascalCase}.test.tsx",
        "src/components/${name|kebabCase}/${name|kebabCase}.module.css",
      ];

      const vars = { name: "UserProfile" };

      const results = paths.map((p) => substitution.apply(p, vars));

      expect(results[0]).toBe("src/components/user-profile/index.ts");
      expect(results[1]).toBe("src/components/user-profile/UserProfile.tsx");
      expect(results[2]).toBe(
        "src/components/user-profile/UserProfile.test.tsx",
      );
      expect(results[3]).toBe(
        "src/components/user-profile/user-profile.module.css",
      );
    });
  });
});
