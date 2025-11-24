import { IUIService, ConflictResolution } from "../../services/uiService";
import { TemplateDef } from "../../template/types";

/**
 * Mock UIService for testing
 * Allows pre-configuring user responses
 */
export class MockUIService implements IUIService {
  private folderNameResponse?: string;
  private templateResponse?: TemplateDef;
  private conflictResolutions: ConflictResolution[] = [];
  private conflictIndex = 0;

  private successMessages: Array<{ message: string; files: string[] }> = [];
  private errorMessages: Error[] = [];
  private warningMessages: string[] = [];

  /**
   * Configure the response for folder name prompt
   */
  setFolderNameResponse(name: string | undefined): void {
    this.folderNameResponse = name;
  }

  /**
   * Configure the response for template selection
   */
  setTemplateResponse(template: TemplateDef | undefined): void {
    this.templateResponse = template;
  }

  /**
   * Configure conflict resolution responses (in order)
   */
  setConflictResolutions(resolutions: ConflictResolution[]): void {
    this.conflictResolutions = resolutions;
    this.conflictIndex = 0;
  }

  /**
   * Add a single conflict resolution
   */
  addConflictResolution(resolution: ConflictResolution): void {
    this.conflictResolutions.push(resolution);
  }

  /**
   * Get all success messages shown
   */
  getSuccessMessages(): Array<{ message: string; files: string[] }> {
    return this.successMessages;
  }

  /**
   * Get all error messages shown
   */
  getErrorMessages(): Error[] {
    return this.errorMessages;
  }

  /**
   * Get all warning messages shown
   */
  getWarningMessages(): string[] {
    return this.warningMessages;
  }

  /**
   * Clear all recorded messages
   */
  clear(): void {
    this.successMessages = [];
    this.errorMessages = [];
    this.warningMessages = [];
    this.conflictIndex = 0;
  }

  // IUIService implementation

  async promptForFolderName(): Promise<string | undefined> {
    return this.folderNameResponse;
  }

  async selectTemplate(
    templates: TemplateDef[],
  ): Promise<TemplateDef | undefined> {
    // If no response configured, return first template
    return this.templateResponse ?? templates[0];
  }

  async promptForConflictResolution(
    _filePath: string,
    _fileSize: number,
  ): Promise<ConflictResolution> {
    if (this.conflictIndex >= this.conflictResolutions.length) {
      // Default to cancel if no more resolutions configured
      return { action: "cancel" };
    }

    const resolution = this.conflictResolutions[this.conflictIndex];
    this.conflictIndex++;
    return resolution;
  }

  async showSuccess(message: string, createdFiles: string[]): Promise<void> {
    this.successMessages.push({ message, files: createdFiles });
  }

  async showError(error: Error): Promise<void> {
    this.errorMessages.push(error);
  }

  async showWarning(message: string): Promise<void> {
    this.warningMessages.push(message);
  }
}
