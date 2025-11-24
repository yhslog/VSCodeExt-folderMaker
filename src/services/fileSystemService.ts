import * as vscode from "vscode";
import * as path from "path";

/**
 * File metadata
 */
export interface FileStat {
  size: number;
  mtime: Date;
  exists: boolean;
}

/**
 * FileSystemService - Abstraction over file system operations
 *
 * This interface allows for easy mocking in tests.
 * The VS Code implementation uses the workspace FS API.
 */
export interface IFileSystemService {
  exists(filePath: string): Promise<boolean>;
  stat(filePath: string): Promise<FileStat>;
  createDirectory(dirPath: string): Promise<void>;
  writeFile(filePath: string, content: string): Promise<void>;
  readFile(filePath: string): Promise<string>;
}

/**
 * VS Code implementation of FileSystemService
 */
export class VSCodeFileSystemService implements IFileSystemService {
  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();

  /**
   * Checks if a file exists
   */
  async exists(filePath: string): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets file statistics
   */
  async stat(filePath: string): Promise<FileStat> {
    try {
      const stat = await vscode.workspace.fs.stat(vscode.Uri.file(filePath));
      return {
        size: stat.size,
        mtime: new Date(stat.mtime),
        exists: true,
      };
    } catch {
      return {
        size: 0,
        mtime: new Date(),
        exists: false,
      };
    }
  }

  /**
   * Creates a directory (recursive)
   */
  async createDirectory(dirPath: string): Promise<void> {
    try {
      await vscode.workspace.fs.createDirectory(vscode.Uri.file(dirPath));
    } catch (err) {
      // Ignore if directory already exists
      if (err instanceof vscode.FileSystemError && err.code !== "FileExists") {
        throw err;
      }
    }
  }

  /**
   * Writes a file (creates parent directories if needed)
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const uri = vscode.Uri.file(filePath);

    // Ensure parent directory exists
    const parentDir = path.dirname(filePath);
    await this.createDirectory(parentDir);

    // Write file using TextEncoder (more efficient than Buffer.from)
    const contentBytes = this.encoder.encode(content);
    await vscode.workspace.fs.writeFile(uri, contentBytes);
  }

  /**
   * Reads a file as UTF-8 string
   */
  async readFile(filePath: string): Promise<string> {
    const uri = vscode.Uri.file(filePath);
    const content = await vscode.workspace.fs.readFile(uri);
    return this.decoder.decode(content);
  }
}
