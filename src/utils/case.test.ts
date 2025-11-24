import { describe, it, expect } from "vitest";
import { toKebab, toCamel, toPascal } from "./case";

describe("case", () => {
  describe("toKebab", () => {
    describe("basic conversions", () => {
      it("should convert camelCase to kebab-case", () => {
        expect(toKebab("myComponent")).toBe("my-component");
        expect(toKebab("userName")).toBe("user-name");
        expect(toKebab("backgroundColor")).toBe("background-color");
      });

      it("should convert PascalCase to kebab-case", () => {
        expect(toKebab("MyComponent")).toBe("my-component");
        expect(toKebab("UserProfile")).toBe("user-profile");
        expect(toKebab("BackgroundColor")).toBe("background-color");
      });

      it("should convert snake_case to kebab-case", () => {
        expect(toKebab("my_component")).toBe("my-component");
        expect(toKebab("user_name")).toBe("user-name");
        expect(toKebab("background_color")).toBe("background-color");
      });

      it("should convert space-separated words to kebab-case", () => {
        expect(toKebab("my component")).toBe("my-component");
        expect(toKebab("User Profile")).toBe("user-profile");
        expect(toKebab("Background Color")).toBe("background-color");
      });

      it("should handle consecutive capitals", () => {
        expect(toKebab("XMLHttpRequest")).toBe("xml-http-request");
        expect(toKebab("HTTPSConnection")).toBe("https-connection");
        expect(toKebab("IOError")).toBe("io-error");
        expect(toKebab("URLParser")).toBe("url-parser");
      });

      it("should handle mixed formats", () => {
        expect(toKebab("myComponent_name")).toBe("my-component-name");
        expect(toKebab("User Profile_Name")).toBe("user-profile-name");
      });
    });

    describe("edge cases", () => {
      it("should handle single word", () => {
        expect(toKebab("component")).toBe("component");
        expect(toKebab("Component")).toBe("component");
      });

      it("should handle already kebab-case strings", () => {
        expect(toKebab("my-component")).toBe("my-component");
        expect(toKebab("user-profile")).toBe("user-profile");
      });

      it("should handle empty string", () => {
        expect(toKebab("")).toBe("");
      });

      it("should handle numbers", () => {
        expect(toKebab("component123")).toBe("component123");
        expect(toKebab("myComponent2")).toBe("my-component2");
        expect(toKebab("Component123Test")).toBe("component123-test");
      });

      it("should handle multiple consecutive separators", () => {
        expect(toKebab("my__component")).toBe("my-component");
        expect(toKebab("my  component")).toBe("my-component");
        expect(toKebab("my___component")).toBe("my-component");
      });

      it("should handle special characters", () => {
        expect(toKebab("my-component-123")).toBe("my-component-123");
        expect(toKebab("test_case_1")).toBe("test-case-1");
      });
    });

    describe("real-world examples", () => {
      it("should handle React component names", () => {
        expect(toKebab("UserProfile")).toBe("user-profile");
        expect(toKebab("TodoList")).toBe("todo-list");
        expect(toKebab("NavigationBar")).toBe("navigation-bar");
      });

      it("should handle API endpoint names", () => {
        expect(toKebab("getUserById")).toBe("get-user-by-id");
        expect(toKebab("createNewPost")).toBe("create-new-post");
        expect(toKebab("deleteOldRecords")).toBe("delete-old-records");
      });

      it("should handle file names", () => {
        expect(toKebab("MyComponent")).toBe("my-component");
        expect(toKebab("UserService")).toBe("user-service");
        expect(toKebab("ApiClient")).toBe("api-client");
      });
    });
  });

  describe("toCamel", () => {
    describe("basic conversions", () => {
      it("should convert kebab-case to camelCase", () => {
        expect(toCamel("my-component")).toBe("myComponent");
        expect(toCamel("user-name")).toBe("userName");
        expect(toCamel("background-color")).toBe("backgroundColor");
      });

      it("should convert PascalCase to camelCase", () => {
        expect(toCamel("MyComponent")).toBe("myComponent");
        expect(toCamel("UserProfile")).toBe("userProfile");
        expect(toCamel("BackgroundColor")).toBe("backgroundColor");
      });

      it("should convert snake_case to camelCase", () => {
        expect(toCamel("my_component")).toBe("myComponent");
        expect(toCamel("user_name")).toBe("userName");
        expect(toCamel("background_color")).toBe("backgroundColor");
      });

      it("should convert space-separated words to camelCase", () => {
        expect(toCamel("my component")).toBe("myComponent");
        expect(toCamel("User Profile")).toBe("userProfile");
        expect(toCamel("Background Color")).toBe("backgroundColor");
      });

      it("should handle mixed formats", () => {
        expect(toCamel("my-component_name")).toBe("myComponentName");
        expect(toCamel("User-Profile Name")).toBe("userProfileName");
      });
    });

    describe("edge cases", () => {
      it("should handle single word", () => {
        expect(toCamel("component")).toBe("component");
        expect(toCamel("Component")).toBe("component");
      });

      it("should handle already camelCase strings", () => {
        expect(toCamel("myComponent")).toBe("myComponent");
        expect(toCamel("userProfile")).toBe("userProfile");
      });

      it("should handle empty string", () => {
        expect(toCamel("")).toBe("");
      });

      it("should handle numbers", () => {
        expect(toCamel("component-123")).toBe("component123");
        expect(toCamel("my-component-2")).toBe("myComponent2");
      });

      it("should handle multiple consecutive separators", () => {
        expect(toCamel("my--component")).toBe("myComponent");
        expect(toCamel("my__component")).toBe("myComponent");
        expect(toCamel("my  component")).toBe("myComponent");
      });

      it("should handle trailing separators", () => {
        expect(toCamel("my-component-")).toBe("myComponent");
        expect(toCamel("user_name_")).toBe("userName");
      });

      it("should handle leading separators", () => {
        expect(toCamel("-my-component")).toBe("myComponent");
        expect(toCamel("_user_name")).toBe("userName");
      });
    });

    describe("real-world examples", () => {
      it("should handle variable names", () => {
        expect(toCamel("user-profile")).toBe("userProfile");
        expect(toCamel("todo-list")).toBe("todoList");
        expect(toCamel("navigation-bar")).toBe("navigationBar");
      });

      it("should handle function names", () => {
        expect(toCamel("get-user-by-id")).toBe("getUserById");
        expect(toCamel("create-new-post")).toBe("createNewPost");
        expect(toCamel("delete-old-records")).toBe("deleteOldRecords");
      });

      it("should handle property names", () => {
        expect(toCamel("is-active")).toBe("isActive");
        expect(toCamel("has-error")).toBe("hasError");
        expect(toCamel("should-update")).toBe("shouldUpdate");
      });
    });
  });

  describe("toPascal", () => {
    describe("basic conversions", () => {
      it("should convert camelCase to PascalCase", () => {
        expect(toPascal("myComponent")).toBe("MyComponent");
        expect(toPascal("userName")).toBe("UserName");
        expect(toPascal("backgroundColor")).toBe("BackgroundColor");
      });

      it("should convert kebab-case to PascalCase", () => {
        expect(toPascal("my-component")).toBe("MyComponent");
        expect(toPascal("user-name")).toBe("UserName");
        expect(toPascal("background-color")).toBe("BackgroundColor");
      });

      it("should convert snake_case to PascalCase", () => {
        expect(toPascal("my_component")).toBe("MyComponent");
        expect(toPascal("user_name")).toBe("UserName");
        expect(toPascal("background_color")).toBe("BackgroundColor");
      });

      it("should convert space-separated words to PascalCase", () => {
        expect(toPascal("my component")).toBe("MyComponent");
        expect(toPascal("User Profile")).toBe("UserProfile");
        expect(toPascal("Background Color")).toBe("BackgroundColor");
      });

      it("should handle mixed formats", () => {
        expect(toPascal("my-component_name")).toBe("MyComponentName");
        expect(toPascal("User-Profile Name")).toBe("UserProfileName");
      });
    });

    describe("edge cases", () => {
      it("should handle single word", () => {
        expect(toPascal("component")).toBe("Component");
        expect(toPascal("Component")).toBe("Component");
      });

      it("should handle already PascalCase strings", () => {
        expect(toPascal("MyComponent")).toBe("MyComponent");
        expect(toPascal("UserProfile")).toBe("UserProfile");
      });

      it("should handle empty string", () => {
        expect(toPascal("")).toBe("");
      });

      it("should handle numbers", () => {
        expect(toPascal("component-123")).toBe("Component123");
        expect(toPascal("my-component-2")).toBe("MyComponent2");
      });

      it("should handle multiple consecutive separators", () => {
        expect(toPascal("my--component")).toBe("MyComponent");
        expect(toPascal("my__component")).toBe("MyComponent");
        expect(toPascal("my  component")).toBe("MyComponent");
      });

      it("should handle trailing separators", () => {
        expect(toPascal("my-component-")).toBe("MyComponent");
        expect(toPascal("user_name_")).toBe("UserName");
        expect(toPascal("test ")).toBe("Test");
      });

      it("should handle leading separators", () => {
        expect(toPascal("-my-component")).toBe("MyComponent");
        expect(toPascal("_user_name")).toBe("UserName");
        expect(toPascal(" test")).toBe("Test");
      });

      it("should handle only separators", () => {
        expect(toPascal("---")).toBe("");
        expect(toPascal("___")).toBe("");
        expect(toPascal("   ")).toBe("");
        expect(toPascal("-_-")).toBe("");
      });

      it("should handle whitespace-only strings", () => {
        expect(toPascal("   ")).toBe("");
        expect(toPascal("\t\t")).toBe("");
      });
    });

    describe("real-world examples", () => {
      it("should handle class names", () => {
        expect(toPascal("user-profile")).toBe("UserProfile");
        expect(toPascal("todo-list")).toBe("TodoList");
        expect(toPascal("navigation-bar")).toBe("NavigationBar");
      });

      it("should handle component names", () => {
        expect(toPascal("button")).toBe("Button");
        expect(toPascal("input-field")).toBe("InputField");
        expect(toPascal("dropdown-menu")).toBe("DropdownMenu");
      });

      it("should handle service names", () => {
        expect(toPascal("user-service")).toBe("UserService");
        expect(toPascal("api-client")).toBe("ApiClient");
        expect(toPascal("database-connection")).toBe("DatabaseConnection");
      });

      it("should handle type names", () => {
        expect(toPascal("user-profile-props")).toBe("UserProfileProps");
        expect(toPascal("api-response-data")).toBe("ApiResponseData");
        expect(toPascal("error-message-type")).toBe("ErrorMessageType");
      });
    });
  });

  describe("integration - all transformations together", () => {
    it("should be reversible between formats", () => {
      const original = "userProfile";

      // camelCase -> kebab-case -> PascalCase -> camelCase
      const kebab = toKebab(original);
      expect(kebab).toBe("user-profile");

      const pascal = toPascal(kebab);
      expect(pascal).toBe("UserProfile");

      const camel = toCamel(pascal);
      expect(camel).toBe("userProfile");
    });

    it("should handle round-trip conversions", () => {
      const testCases = [
        "myComponent",
        "UserProfile",
        "todo-list",
        "api_client",
        "Navigation Bar",
      ];

      testCases.forEach((input) => {
        const kebab = toKebab(input);
        const fromKebabCamel = toCamel(kebab);
        const fromKebabPascal = toPascal(kebab);

        // All should produce consistent results
        expect(toKebab(fromKebabCamel)).toBe(kebab);
        expect(toKebab(fromKebabPascal)).toBe(kebab);
      });
    });

    it("should handle template variable scenarios", () => {
      // Simulating ${folderName|kebabCase} transformations
      const folderName = "UserProfile";

      expect(toKebab(folderName)).toBe("user-profile");
      expect(toCamel(folderName)).toBe("userProfile");
      expect(toPascal(folderName)).toBe("UserProfile");
    });

    it("should handle CSS class name scenarios", () => {
      const componentName = "NavigationBar";

      // Component name -> CSS class name
      expect(toKebab(componentName)).toBe("navigation-bar");

      // CSS class name -> Component name
      expect(toPascal("navigation-bar")).toBe("NavigationBar");
    });

    it("should handle file name scenarios", () => {
      const componentName = "UserProfile";

      // Component.tsx -> component.module.css
      expect(toKebab(componentName)).toBe("user-profile");

      // component-file.ts -> ComponentFile
      expect(toPascal("user-profile")).toBe("UserProfile");
    });
  });

  describe("unicode and special characters", () => {
    it("should handle unicode characters", () => {
      expect(toKebab("userProfile")).toBe("user-profile");
      expect(toCamel("user-profile")).toBe("userProfile");
      expect(toPascal("user-profile")).toBe("UserProfile");
    });

    it("should preserve non-ASCII characters", () => {
      // These should pass through as-is since they're not word boundaries
      expect(toKebab("café")).toBe("café");
      expect(toCamel("café-bar")).toBe("caféBar");
      expect(toPascal("café-bar")).toBe("CaféBar");
    });

    it("should handle accented characters", () => {
      expect(toKebab("naïveApproach")).toBe("naïve-approach");
      expect(toCamel("naïve-approach")).toBe("naïveApproach");
      expect(toPascal("naïve-approach")).toBe("NaïveApproach");
    });
  });

  describe("performance and consistency", () => {
    it("should handle long strings efficiently", () => {
      const longString =
        "this-is-a-very-long-string-with-many-words-to-test-performance";
      expect(toCamel(longString)).toBe(
        "thisIsAVeryLongStringWithManyWordsToTestPerformance",
      );
      expect(toPascal(longString)).toBe(
        "ThisIsAVeryLongStringWithManyWordsToTestPerformance",
      );
    });

    it("should be idempotent for same format", () => {
      expect(toKebab(toKebab("my-component"))).toBe("my-component");
      expect(toCamel(toCamel("myComponent"))).toBe("myComponent");
      expect(toPascal(toPascal("MyComponent"))).toBe("MyComponent");
    });

    it("should handle repeated transformations consistently", () => {
      const input = "testValue";

      for (let i = 0; i < 10; i++) {
        expect(toKebab(input)).toBe("test-value");
        expect(toCamel("test-value")).toBe("testValue");
        expect(toPascal("test-value")).toBe("TestValue");
      }
    });
  });
});
