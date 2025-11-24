import * as vscode from "vscode";
import * as path from "path";
import { loadTemplates } from "../template/loader";
import {
  TemplateProcessor,
  TemplateContext,
  FileOperation,
} from "../services/templateProcessor";
import {
  VSCodeFileSystemService,
  IFileSystemService,
} from "../services/fileSystemService";
import {
  VSCodeUIService,
  IUIService,
  ConflictResolution,
} from "../services/uiService";
import { VariableSubstitution } from "../services/variableSubstitution";
import { PathValidator } from "../utils/pathValidator";
import {
  UserCancelledError,
  TemplateError,
  PathSecurityError,
} from "../errors/templateError";
import { outputChannelManager } from "../utils/outputChannel";

/**
 * CreateFromTemplateCommand - Orchestrates template creation workflow
 *
 * This class coordinates between UI, business logic, and file system layers.
 * It follows the 3-layer architecture:
 * - Layer 1: Business Logic (TemplateProcessor) - Pure functions, 100% testable
 * - Layer 2: Abstractions (FileSystemService, UIService) - Mockable interfaces
 * - Layer 3: Orchestration (This class) - Coordinates the workflow
 */
export class CreateFromTemplateCommand {
  private readonly processor: TemplateProcessor;
  private readonly fs: IFileSystemService;
  private readonly ui: IUIService;
  private readonly output: vscode.OutputChannel;

  constructor(
    processor?: TemplateProcessor,
    fs?: IFileSystemService,
    ui?: IUIService,
    output?: vscode.OutputChannel,
  ) {
    // Allow dependency injection for testing, but provide defaults
    const pathValidator = new PathValidator();
    const variableSubstitution = new VariableSubstitution();

    this.processor =
      processor || new TemplateProcessor(pathValidator, variableSubstitution);
    this.fs = fs || new VSCodeFileSystemService();
    this.output = output || outputChannelManager.getChannel();
    this.ui = ui || new VSCodeUIService(pathValidator, this.output);
  }

  /**
   * Main command execution
   */
  async execute(uri?: vscode.Uri): Promise<void> {
    this.output.clear();
    this.output.appendLine("🚀 Starting template creation...\n");

    try {
      // Step 1: Gather inputs from user
      const context = await this.gatherInputs(uri);
      if (!context) {
        this.output.appendLine("ℹ️  Operation cancelled by user");
        return;
      }

      this.output.appendLine(`📁 Target: ${context.targetRoot}`);
      this.output.appendLine(`📝 Template: ${context.template.name}`);
      this.output.appendLine(
        `📊 Files to create: ${context.template.files.length}\n`,
      );

      // Step 2: Plan operations (pure business logic)
      const operations = this.processor.planFileOperations(context);

      // Step 3: Execute with progress and conflict handling
      const results = await this.executeOperations(
        operations,
        context.targetRoot,
      );

      // Step 4: Show results
      await this.showResults(results, context.targetRoot);
    } catch (err) {
      await this.handleError(err);
    }
  }

  /**
   * Gathers all required inputs from the user
   */
  private async gatherInputs(
    uri?: vscode.Uri,
  ): Promise<TemplateContext | null> {
    // Get target directory
    const targetBase =
      uri?.fsPath || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!targetBase) {
      await this.ui.showWarning("No workspace folder found.");
      return null;
    }

    // Prompt for folder name (with validation)
    const folderName = await this.ui.promptForFolderName();
    if (!folderName) {
      return null;
    }

    // Load and select template
    const templates = await loadTemplates();
    const template = await this.ui.selectTemplate(templates);
    if (!template) {
      return null;
    }

    return {
      targetRoot: path.join(targetBase, folderName),
      folderName,
      template,
    };
  }

  /**
   * Executes file operations with progress tracking and conflict resolution
   */
  private async executeOperations(
    operations: FileOperation[],
    _targetRoot: string,
  ): Promise<string[]> {
    const created: string[] = [];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: "Creating files...",
        cancellable: true,
      },
      async (progress, token) => {
        let conflictPolicy: "ask" | "overwrite" | "skip" = "ask";

        for (let i = 0; i < operations.length; i++) {
          // Check for cancellation
          if (token.isCancellationRequested) {
            throw new UserCancelledError("Operation cancelled by user");
          }

          const operation = operations[i];

          progress.report({
            increment: 100 / operations.length,
            message: `${i + 1}/${operations.length}: ${operation.relativePath}`,
          });

          // Check if file exists
          const stat = await this.fs.stat(operation.absolutePath);

          if (stat.exists) {
            // Handle conflict
            const resolution = await this.resolveConflict(
              operation.relativePath,
              stat.size,
              conflictPolicy,
            );

            if (resolution.action === "cancel") {
              throw new UserCancelledError("Operation cancelled by user");
            }

            if (resolution.action === "skip") {
              this.output.appendLine(`⏭️  Skipped: ${operation.relativePath}`);
              if (resolution.applyToAll) {
                conflictPolicy = "skip";
              }
              continue;
            }

            if (resolution.applyToAll) {
              conflictPolicy = "overwrite";
            }
          }

          // Create the file
          await this.fs.writeFile(operation.absolutePath, operation.content);
          created.push(operation.absolutePath);

          this.output.appendLine(`✅ Created: ${operation.relativePath}`);
        }
      },
    );

    return created;
  }

  /**
   * Resolves file conflicts based on current policy
   */
  private async resolveConflict(
    relativePath: string,
    fileSize: number,
    policy: "ask" | "overwrite" | "skip",
  ): Promise<ConflictResolution> {
    // If policy is set, apply it
    if (policy === "overwrite") {
      return { action: "overwrite", applyToAll: false };
    }
    if (policy === "skip") {
      return { action: "skip", applyToAll: false };
    }

    // Ask user
    return await this.ui.promptForConflictResolution(relativePath, fileSize);
  }

  /**
   * Shows results to the user
   */
  private async showResults(
    createdFiles: string[],
    targetRoot: string,
  ): Promise<void> {
    if (createdFiles.length === 0) {
      await this.ui.showWarning("No files were created.");
      return;
    }

    // Convert to relative paths for display
    const relativeFiles = createdFiles.map((file) =>
      path.relative(targetRoot, file),
    );

    await this.ui.showSuccess(
      `Successfully created ${createdFiles.length} files`,
      relativeFiles,
    );
  }

  /**
   * Handles errors with appropriate user feedback
   */
  private async handleError(err: unknown): Promise<void> {
    // User cancellation is not an error
    if (err instanceof UserCancelledError) {
      this.output.appendLine(`\n❌ ${err.message}`);
      return;
    }

    // Handle specific error types
    if (err instanceof PathSecurityError) {
      this.output.appendLine(`\n🚨 Security Error: ${err.message}`);
      this.output.appendLine(`Code: ${err.code}`);
      if (err.context) {
        this.output.appendLine(
          `Context: ${JSON.stringify(err.context, null, 2)}`,
        );
      }
      await this.ui.showError(err);
      return;
    }

    if (err instanceof TemplateError) {
      this.output.appendLine(`\n❌ Template Error: ${err.message}`);
      this.output.appendLine(`Code: ${err.code}`);
      if (err.context) {
        this.output.appendLine(
          `Context: ${JSON.stringify(err.context, null, 2)}`,
        );
      }
      await this.ui.showError(err);
      return;
    }

    // Handle VS Code FileSystemError
    if (err instanceof vscode.FileSystemError) {
      this.output.appendLine(
        `\n❌ File System Error [${err.code}]: ${err.message}`,
      );
      await this.ui.showError(err);
      return;
    }

    // Handle generic errors
    const error = err instanceof Error ? err : new Error(String(err));
    this.output.appendLine(`\n❌ Unexpected Error: ${error.message}`);
    if (error.stack) {
      this.output.appendLine(`\nStack trace:\n${error.stack}`);
    }
    await this.ui.showError(error);
  }
}

/**
 * Legacy function export for backward compatibility
 * This maintains the existing API while using the new architecture
 */
export async function createFromTemplateCommand(
  uri?: vscode.Uri,
): Promise<void> {
  const command = new CreateFromTemplateCommand();
  await command.execute(uri);
}
