import * as vscode from "vscode";
import { TemplateDef } from "../template/types";
import { PathValidator } from "../utils/pathValidator";

/**
 * Conflict resolution choice
 */
export type ConflictResolution =
  | { action: "overwrite"; applyToAll: false }
  | { action: "skip"; applyToAll: false }
  | { action: "overwrite"; applyToAll: true }
  | { action: "skip"; applyToAll: true }
  | { action: "cancel" };

/**
 * Template selection item for QuickPick
 */
export interface TemplateQuickPickItem extends vscode.QuickPickItem {
  template: TemplateDef;
}

/**
 * UIService - Abstraction over VS Code UI interactions
 *
 * This interface separates UI concerns from business logic.
 * Makes command logic testable by mocking UI interactions.
 */
export interface IUIService {
  promptForFolderName(): Promise<string | undefined>;
  selectTemplate(templates: TemplateDef[]): Promise<TemplateDef | undefined>;
  promptForConflictResolution(
    filePath: string,
    fileSize: number,
  ): Promise<ConflictResolution>;
  showSuccess(message: string, createdFiles: string[]): Promise<void>;
  showError(error: Error): Promise<void>;
  showWarning(message: string): Promise<void>;
}

/**
 * VS Code implementation of UIService
 */
export class VSCodeUIService implements IUIService {
  constructor(
    private readonly pathValidator: PathValidator,
    private readonly outputChannel: vscode.OutputChannel,
  ) {}

  /**
   * Prompts user for a new folder name with validation
   */
  async promptForFolderName(): Promise<string | undefined> {
    const folderName = await vscode.window.showInputBox({
      prompt: vscode.l10n.t("prompt.enterFolderName"),
      placeHolder: "e.g., UserProfile",
      validateInput: (value: string) =>
        this.pathValidator.validateFolderName(value),
    });

    return folderName?.trim();
  }

  /**
   * Shows template selection QuickPick
   */
  async selectTemplate(
    templates: TemplateDef[],
  ): Promise<TemplateDef | undefined> {
    const items: TemplateQuickPickItem[] = templates.map((template) => ({
      label: `$(file-directory) ${template.name}`,
      description: template.description,
      detail: `${template.files.length} file${template.files.length !== 1 ? "s" : ""}`,
      template,
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: vscode.l10n.t("placeholder.selectTemplate"),
      matchOnDescription: true,
      matchOnDetail: true,
    });

    return picked?.template;
  }

  /**
   * Prompts user for conflict resolution when file already exists
   */
  async promptForConflictResolution(
    filePath: string,
    fileSize: number,
  ): Promise<ConflictResolution> {
    const choices = [
      {
        label: "$(replace) Overwrite",
        value: "overwrite",
        detail: `Replace existing file (${this.formatBytes(fileSize)})`,
      },
      {
        label: "$(close) Skip",
        value: "skip",
        detail: "Keep existing file unchanged",
      },
      {
        label: "$(replace-all) Overwrite All",
        value: "overwriteAll",
        detail: "Replace all remaining conflicts",
      },
      {
        label: "$(close-all) Skip All",
        value: "skipAll",
        detail: "Keep all existing files",
      },
      {
        label: "$(circle-slash) Cancel",
        value: "cancel",
        detail: "Stop operation",
        alwaysShow: true,
      },
    ];

    const choice = await vscode.window.showQuickPick(choices, {
      placeHolder: `⚠️  ${filePath} already exists`,
      title: "File Conflict",
      ignoreFocusOut: true,
    });

    if (!choice || choice.value === "cancel") {
      return { action: "cancel" };
    }

    switch (choice.value) {
      case "overwrite":
        return { action: "overwrite", applyToAll: false };
      case "skip":
        return { action: "skip", applyToAll: false };
      case "overwriteAll":
        return { action: "overwrite", applyToAll: true };
      case "skipAll":
        return { action: "skip", applyToAll: true };
      default:
        return { action: "cancel" };
    }
  }

  /**
   * Shows success message with created files
   */
  async showSuccess(_message: string, createdFiles: string[]): Promise<void> {
    if (createdFiles.length === 0) {
      vscode.window.showInformationMessage(
        vscode.l10n.t("message.noFilesCreated"),
      );
      return;
    }

    // Log all created files to output channel
    this.outputChannel.appendLine("\n✅ Created files:");
    createdFiles.forEach((file) => {
      this.outputChannel.appendLine(`   - ${file}`);
    });
    this.outputChannel.show(true);

    // Show notification with file count
    const fileList = createdFiles
      .slice(0, 5)
      .map((f) => f.split("/").pop() || f)
      .join(", ");
    const more =
      createdFiles.length > 5 ? ` (+${createdFiles.length - 5} more)` : "";

    vscode.window.showInformationMessage(
      vscode.l10n.t("message.filesCreated", `${fileList}${more}`),
    );
  }

  /**
   * Shows error message with details
   */
  async showError(error: Error): Promise<void> {
    this.outputChannel.appendLine(`\n❌ Error: ${error.message}`);
    if (error.stack) {
      this.outputChannel.appendLine(`Stack trace:\n${error.stack}`);
    }

    const action = await vscode.window.showErrorMessage(
      vscode.l10n.t("error.creationFailed", error.message),
      "Show Output",
    );

    if (action === "Show Output") {
      this.outputChannel.show();
    }
  }

  /**
   * Shows warning message
   */
  async showWarning(message: string): Promise<void> {
    vscode.window.showWarningMessage(message);
  }

  /**
   * Formats bytes for human-readable display
   */
  private formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}
