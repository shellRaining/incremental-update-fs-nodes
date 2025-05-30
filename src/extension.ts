import * as vscode from "vscode";
import { globby } from "globby";

export async function activate(context: vscode.ExtensionContext) {
  const files = await globby("**/", {
    cwd: "/Users/shellraining/Documents/nvim_dev",
    onlyDirectories: true,
  });
  console.log(files);

  vscode.workspace.onDidCreateFiles((e) => {
    console.log("create", e);
  });
  vscode.workspace.onDidDeleteFiles((e) => {
    console.log("delete", e);
  });
  vscode.workspace.onDidRenameFiles((e) => {
    console.log("rename", e);
  });
}

// This method is called when your extension is deactivated
export function deactivate() {}
