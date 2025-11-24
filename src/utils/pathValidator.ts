import * as path from "path";

/**
 * PathValidator - Validates and sanitizes file paths for security
 *
 * Protects against:
 * - Path traversal attacks (../)
 * - Absolute path injection
 * - Invalid filesystem characters
 * - Reserved system names (Windows)
 */
export class PathValidator {
  // eslint-disable-next-line no-control-regex
  private static readonly INVALID_CHARS = /[<>:"|?*\x00-\x1F]/;
  private static readonly RESERVED_NAMES =
    /^(CON|PRN|AUX|NUL|COM[0-9]|LPT[0-9])(\.|$)/i;
  private static readonly MAX_PATH_LENGTH = 255;

  /**
   * Validates a folder name for safety
   * @param folderName - User-provided folder name
   * @returns Error message if invalid, undefined if valid
   */
  validateFolderName(folderName: string): string | undefined {
    if (!folderName || folderName.trim() === "") {
      return "Folder name cannot be empty";
    }

    const trimmed = folderName.trim();

    // Prevent path traversal
    if (trimmed.includes("..")) {
      return 'Folder name cannot contain ".."';
    }

    // Prevent absolute paths
    if (path.isAbsolute(trimmed)) {
      return "Folder name cannot be an absolute path";
    }

    // Prevent path separators
    if (trimmed.includes("/") || trimmed.includes("\\")) {
      return "Folder name cannot contain path separators (/ or \\)";
    }

    // Check for invalid filesystem characters
    if (PathValidator.INVALID_CHARS.test(trimmed)) {
      return 'Folder name contains invalid characters: < > : " | ? *';
    }

    // Check reserved names (Windows)
    if (PathValidator.RESERVED_NAMES.test(trimmed)) {
      return "This is a reserved system folder name";
    }

    // Check length
    if (Buffer.byteLength(trimmed, "utf8") > PathValidator.MAX_PATH_LENGTH) {
      return `Folder name too long (max ${PathValidator.MAX_PATH_LENGTH} bytes)`;
    }

    // Prevent leading/trailing dots or spaces (Windows issues)
    if (
      trimmed.startsWith(".") ||
      trimmed.startsWith(" ") ||
      trimmed.endsWith(".") ||
      trimmed.endsWith(" ")
    ) {
      return "Folder name cannot start or end with dots or spaces";
    }

    return undefined;
  }

  /**
   * Sanitizes a relative path by removing dangerous patterns
   * @param relativePath - Template path with potential variables substituted
   * @returns Sanitized path
   */
  sanitizePath(relativePath: string): string {
    // Remove any path traversal sequences
    return relativePath
      .replace(/\.\./g, "")
      .replace(/^[/\\]+/, "") // Remove leading slashes
      .split(/[/\\]/)
      .filter((segment) => segment && segment !== "." && segment !== "..")
      .join(path.sep);
  }

  /**
   * Verifies that a resolved path is within the target directory
   * @param resolvedPath - Absolute path after resolution
   * @param targetRoot - Target directory that should contain the path
   * @returns true if safe, false if path escapes target
   */
  isSafe(resolvedPath: string, targetRoot: string): boolean {
    // Normalize both paths
    const normalizedPath = path.normalize(resolvedPath);
    const normalizedRoot = path.normalize(targetRoot);

    // Check if path starts with root (is contained within)
    return normalizedPath.startsWith(normalizedRoot);
  }
}
