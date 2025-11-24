import { IFileSystemService, FileStat } from "../../services/fileSystemService";

/**
 * Mock FileSystemService for testing
 * Simulates an in-memory file system
 */
export class MockFileSystemService implements IFileSystemService {
  private files = new Map<string, { content: string; mtime: Date }>();
  private directories = new Set<string>();

  /**
   * Add a file to the mock file system
   */
  addFile(path: string, content: string): void {
    this.files.set(path, { content, mtime: new Date() });

    // Auto-create parent directories
    const parts = path.split("/").slice(0, -1);
    for (let i = 1; i <= parts.length; i++) {
      this.directories.add(parts.slice(0, i).join("/"));
    }
  }

  /**
   * Add a directory to the mock file system
   */
  addDirectory(path: string): void {
    this.directories.add(path);
  }

  /**
   * Get all files in the mock file system
   */
  getFiles(): Map<string, string> {
    const result = new Map<string, string>();
    this.files.forEach((value, key) => {
      result.set(key, value.content);
    });
    return result;
  }

  /**
   * Clear all files and directories
   */
  clear(): void {
    this.files.clear();
    this.directories.clear();
  }

  // IFileSystemService implementation

  async exists(filePath: string): Promise<boolean> {
    return this.files.has(filePath) || this.directories.has(filePath);
  }

  async stat(filePath: string): Promise<FileStat> {
    const file = this.files.get(filePath);
    if (file) {
      return {
        size: Buffer.byteLength(file.content, "utf8"),
        mtime: file.mtime,
        exists: true,
      };
    }

    if (this.directories.has(filePath)) {
      return {
        size: 0,
        mtime: new Date(),
        exists: true,
      };
    }

    return {
      size: 0,
      mtime: new Date(),
      exists: false,
    };
  }

  async createDirectory(dirPath: string): Promise<void> {
    this.directories.add(dirPath);

    // Auto-create parent directories
    const parts = dirPath.split("/").filter(Boolean);
    for (let i = 1; i < parts.length; i++) {
      this.directories.add("/" + parts.slice(0, i).join("/"));
    }
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    this.files.set(filePath, { content, mtime: new Date() });

    // Auto-create parent directory
    const dir = filePath.split("/").slice(0, -1).join("/");
    if (dir) {
      await this.createDirectory(dir);
    }
  }

  async readFile(filePath: string): Promise<string> {
    const file = this.files.get(filePath);
    if (!file) {
      throw new Error(`File not found: ${filePath}`);
    }
    return file.content;
  }
}
