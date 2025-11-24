import * as path from "path";
import { TemplateDef } from "../template/types";
import { VariableSubstitution } from "./variableSubstitution";
import { PathValidator } from "../utils/pathValidator";
import {
  PathSecurityError,
  TemplateValidationError,
} from "../errors/templateError";

/**
 * Context for template processing
 */
export interface TemplateContext {
  targetRoot: string;
  folderName: string;
  template: TemplateDef;
}

/**
 * Represents a file operation to be performed
 */
export interface FileOperation {
  /** Absolute path where file should be created */
  absolutePath: string;
  /** Relative path from target root */
  relativePath: string;
  /** File content after variable substitution */
  content: string;
  /** Original template file definition */
  templateFile: { path: string; content?: string };
}

/**
 * Resource limits for template operations
 */
export interface ResourceLimits {
  maxFilesPerTemplate: number;
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
}

/**
 * TemplateProcessor - Pure business logic for template processing
 *
 * This class contains NO I/O operations and NO UI interactions.
 * All methods are pure or depend only on injected dependencies.
 * This makes it 100% unit testable.
 */
export class TemplateProcessor {
  private static readonly DEFAULT_LIMITS: ResourceLimits = {
    maxFilesPerTemplate: 100,
    maxFileSizeBytes: 10 * 1024 * 1024, // 10MB
    maxTotalSizeBytes: 100 * 1024 * 1024, // 100MB
  };

  constructor(
    private readonly pathValidator: PathValidator,
    private readonly variableSubstitution: VariableSubstitution,
    private readonly limits: ResourceLimits = TemplateProcessor.DEFAULT_LIMITS,
  ) {}

  /**
   * Plans all file operations for a template
   * Pure function - no I/O, no side effects
   *
   * @param context - Template processing context
   * @returns Array of file operations to perform
   * @throws {TemplateValidationError} If template exceeds resource limits
   * @throws {PathSecurityError} If any path is unsafe
   */
  planFileOperations(context: TemplateContext): FileOperation[] {
    const { template, folderName, targetRoot } = context;

    // Validate template against resource limits
    this.validateTemplate(template);

    // Create variable map
    const variables = { folderName };

    // Process each file in template
    const operations: FileOperation[] = [];

    for (const templateFile of template.files) {
      // Apply variable substitution
      const relativePath = this.variableSubstitution.apply(
        templateFile.path,
        variables,
      );
      const content = this.variableSubstitution.apply(
        templateFile.content ?? "",
        variables,
      );

      // Sanitize the path
      const sanitizedPath = this.pathValidator.sanitizePath(relativePath);

      // Resolve absolute path
      const absolutePath = path.resolve(targetRoot, sanitizedPath);

      // Security check: ensure path doesn't escape target root
      if (!this.pathValidator.isSafe(absolutePath, targetRoot)) {
        throw new PathSecurityError(
          `Path escapes target directory: ${relativePath}`,
          {
            relativePath,
            absolutePath,
            targetRoot,
          },
        );
      }

      operations.push({
        absolutePath,
        relativePath: sanitizedPath,
        content,
        templateFile,
      });
    }

    return operations;
  }

  /**
   * Validates template against resource limits
   * @param template - Template to validate
   * @throws {TemplateValidationError} If validation fails
   */
  private validateTemplate(template: TemplateDef): void {
    // Check file count
    if (template.files.length > this.limits.maxFilesPerTemplate) {
      throw new TemplateValidationError(
        `Template exceeds maximum file count (${this.limits.maxFilesPerTemplate})`,
        {
          fileCount: template.files.length,
          limit: this.limits.maxFilesPerTemplate,
        },
      );
    }

    // Check individual file sizes and total size
    let totalSize = 0;

    for (const file of template.files) {
      const contentSize = Buffer.byteLength(file.content ?? "", "utf8");

      if (contentSize > this.limits.maxFileSizeBytes) {
        throw new TemplateValidationError(
          `File "${file.path}" exceeds size limit (${this.formatBytes(this.limits.maxFileSizeBytes)})`,
          {
            file: file.path,
            size: contentSize,
            limit: this.limits.maxFileSizeBytes,
          },
        );
      }

      totalSize += contentSize;
    }

    if (totalSize > this.limits.maxTotalSizeBytes) {
      throw new TemplateValidationError(
        `Template total size exceeds limit (${this.formatBytes(this.limits.maxTotalSizeBytes)})`,
        {
          totalSize,
          limit: this.limits.maxTotalSizeBytes,
        },
      );
    }
  }

  /**
   * Formats bytes for human-readable display
   * @param bytes - Number of bytes
   * @returns Formatted string (e.g., "10 MB")
   */
  private formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}
