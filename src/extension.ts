import * as vscode from "vscode";
import { createFromTemplateCommand } from "./commands/createFromTemplate";
import { outputChannelManager } from "./utils/outputChannel";

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "folderMaker.helloWorld",
    async () => {
      vscode.window.showInformationMessage("Hello from Folder Maker!");
    },
  );

  context.subscriptions.push(disposable);

  // Explorer context command: Create from folder template
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "folderMaker.createFromTemplate",
      createFromTemplateCommand,
    ),
  );
}

export function deactivate() {
  // Clean up output channel to prevent resource leak
  outputChannelManager.dispose();
}
