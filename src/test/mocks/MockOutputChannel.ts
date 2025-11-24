/**
 * Mock OutputChannel for testing
 * Records all output for verification
 */
export class MockOutputChannel {
  private lines: string[] = [];
  private visible = false;

  appendLine(value: string): void {
    this.lines.push(value);
  }

  append(value: string): void {
    if (this.lines.length === 0) {
      this.lines.push(value);
    } else {
      this.lines[this.lines.length - 1] += value;
    }
  }

  clear(): void {
    this.lines = [];
  }

  show(preserveFocus?: boolean): void {
    this.visible = true;
  }

  hide(): void {
    this.visible = false;
  }

  dispose(): void {
    this.lines = [];
    this.visible = false;
  }

  /**
   * Get all output lines
   */
  getOutput(): string[] {
    return [...this.lines];
  }

  /**
   * Get output as single string
   */
  getOutputString(): string {
    return this.lines.join("\n");
  }

  /**
   * Check if output contains a string
   */
  contains(text: string): boolean {
    return this.lines.some((line) => line.includes(text));
  }

  /**
   * Check if channel is visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  // VS Code OutputChannel compatibility
  get name(): string {
    return "Mock Output Channel";
  }
}
