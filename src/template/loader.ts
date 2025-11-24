import * as vscode from "vscode";
import { TemplateDef, WorkspaceTemplates } from "./types";

export async function loadTemplates(): Promise<TemplateDef[]> {
  const workspaceTemplates = await loadWorkspaceTemplates();
  if (workspaceTemplates?.templates?.length) {
    return workspaceTemplates.templates;
  }

  const config = vscode.workspace.getConfiguration("folderMaker");
  const cfgTemplates = config.get<TemplateDef[]>("templates");
  if (cfgTemplates && cfgTemplates.length) {
    return cfgTemplates;
  }

  // Built-in default template
  return [
    {
      name: "Basic TypeScript",
      description: "Creates index.ts with a starter export",
      files: [
        {
          path: "index.ts",
          content: "export const name = '${folderName|camelCase}';\n",
        },
      ],
    },
  ];
}

async function loadWorkspaceTemplates(): Promise<
  WorkspaceTemplates | undefined
> {
  const folder = vscode.workspace.workspaceFolders?.[0];
  if (!folder) return undefined;
  const uri = vscode.Uri.joinPath(folder.uri, ".vscode", "folder-maker.json");
  try {
    const data = await vscode.workspace.fs.readFile(uri);
    const json = JSON.parse(
      new TextDecoder().decode(data),
    ) as WorkspaceTemplates;
    return json;
  } catch {
    return undefined;
  }
}
