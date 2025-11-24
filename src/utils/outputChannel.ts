import * as vscode from "vscode";

/**
 * Singleton OutputChannel manager
 * Prevents resource leaks by reusing the same channel
 */
class OutputChannelManager {
  private channel: vscode.OutputChannel | undefined;

  getChannel(): vscode.OutputChannel {
    if (!this.channel) {
      this.channel = vscode.window.createOutputChannel("Y Folder Template");
    }
    return this.channel;
  }

  dispose(): void {
    this.channel?.dispose();
    this.channel = undefined;
  }
}

export const outputChannelManager = new OutputChannelManager();
