import * as vscode from "vscode";
import { Logger } from "./log";
import { WorkspaceCollection } from "./WorkspaceCollection";

const logger = new Logger("/var/tmp/incUpdateFsNode.log", { overwrite: true });

export async function activate(_: vscode.ExtensionContext) {
  const workspaceFolderRoots = vscode.workspace.workspaceFolders?.map(
    ({ uri }) => uri.fsPath,
  );
  if (!workspaceFolderRoots || workspaceFolderRoots.length === 0) {
    return;
  }

  const wsc = await WorkspaceCollection.create(workspaceFolderRoots);
  logger.log(wsc);
  registerWorkspaceEventListeners(wsc);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function registerWorkspaceEventListeners(wsc: WorkspaceCollection) {
  const { File, Directory, SymbolicLink } = vscode.FileType;

  vscode.workspace.onDidCreateFiles((e) => {
    e.files.forEach(async (uri) => {
      const path = uri.fsPath;
      const stat = await vscode.workspace.fs.stat(uri);
      const ft = stat.type;
      if (ft === File) {
        wsc.createFile(path);
      } else if (ft === Directory) {
        wsc.createDir(path);
      } else if (ft === (File | SymbolicLink)) {
      } else if (ft === (Directory | SymbolicLink)) {
      } else {
        console.error("unknown filetype");
      }
      logger.log(wsc);
    });
  });
  vscode.workspace.onWillDeleteFiles((e) => {
    e.files.forEach(async (uri) => {
      const path = uri.fsPath;
      const stat = await vscode.workspace.fs.stat(uri);
      const ft = stat.type;
      if (ft === File) {
        wsc.deleteFile(path);
      } else if (ft === Directory) {
        wsc.deleteDir(path);
      } else if (ft === (File | SymbolicLink)) {
      } else if (ft === (Directory | SymbolicLink)) {
      } else {
        console.error("unknown filetype");
      }
      logger.log(wsc);
    });
  });
  vscode.workspace.onWillRenameFiles((e) => {
    e.files.forEach(async ({ oldUri, newUri }) => {
      const oldPath = oldUri.fsPath;
      const newPath = newUri.fsPath;
      const stat = await vscode.workspace.fs.stat(oldUri);
      const ft = stat.type;
      if (ft === File) {
        wsc.renameFile(oldPath, newPath);
      } else if (ft === Directory) {
        wsc.renameDir(oldPath, newPath);
      } else if (ft === (File | SymbolicLink)) {
      } else if (ft === (Directory | SymbolicLink)) {
      } else {
        console.error("unknown filetype");
      }
      logger.log(wsc);
    });
  });
}
