import { toCamel, toKebab, toPascal } from "../utils/case";

/**
 * VariableSubstitution - Handles template variable substitution with transformation
 *
 * Supports variable syntax: ${varName|transformation}
 * Transformations: camelCase, kebabCase, pascalCase
 *
 * Example: "${folderName|kebabCase}" with folderName="MyComponent" -> "my-component"
 */
export class VariableSubstitution {
  private static readonly VARIABLE_REGEX =
    /\$\{([a-zA-Z_][a-zA-Z0-9_]*)(?:\|([a-zA-Z]+))?\}/g;

  /**
   * Applies variable substitution to a template string
   * @param template - Template string with ${var|transform} syntax
   * @param variables - Object containing variable values
   * @returns String with variables substituted
   */
  apply(template: string, variables: Record<string, string>): string {
    return template.replace(
      VariableSubstitution.VARIABLE_REGEX,
      (match, varName: string, transform?: string) => {
        const value = variables[varName];

        // If variable not found, return original match
        if (value === undefined) {
          return match;
        }

        // Sanitize value to prevent injection
        const sanitized = this.sanitizeValue(value);

        // Apply transformation if specified
        if (transform) {
          return this.applyTransformation(sanitized, transform);
        }

        return sanitized;
      },
    );
  }

  /**
   * Sanitizes a variable value to prevent code injection
   * @param value - Raw variable value
   * @returns Sanitized value
   */
  private sanitizeValue(value: string): string {
    // Remove template literal syntax to prevent injection
    return value
      .replace(/\$\{/g, "\\${")
      .replace(/`/g, "\\`")
      .replace(/\\/g, "\\\\");
  }

  /**
   * Applies a case transformation to a value
   * @param value - Value to transform
   * @param transform - Transformation name (camelCase, kebabCase, pascalCase)
   * @returns Transformed value
   */
  private applyTransformation(value: string, transform: string): string {
    switch (transform.toLowerCase()) {
      case "camelcase":
        return toCamel(value);
      case "kebabcase":
        return toKebab(value);
      case "pascalcase":
        return toPascal(value);
      default:
        // Unknown transformation - return as-is
        return value;
    }
  }

  /**
   * Extracts all variable names from a template string
   * @param template - Template string
   * @returns Array of variable names (without transformations)
   */
  extractVariableNames(template: string): string[] {
    const variables = new Set<string>();
    const regex = new RegExp(VariableSubstitution.VARIABLE_REGEX);

    let match;
    while ((match = regex.exec(template)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }
}
