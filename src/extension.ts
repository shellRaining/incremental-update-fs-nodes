import * as vscode from "vscode";
import {
  createDir,
  createFile,
  deleteDir,
  deleteFile,
  renameDir,
  renameFile,
} from "./collections";
import { Logger } from "./log";
import { WorkspaceCollection } from "./WorkspaceCollection";

const logger = new Logger("/var/tmp/incUpdateFsNode.log", { overwrite: false });

export async function activate(_: vscode.ExtensionContext) {
  const workspaceFolderRoots = vscode.workspace.workspaceFolders?.map(
    ({ uri }) => uri.fsPath,
  );
  if (!workspaceFolderRoots || workspaceFolderRoots.length === 0) {
    return;
  }

  const { allFiles: workspaceFiles, allDirs: workspaceFolders } =
    await WorkspaceCollection.create(workspaceFolderRoots);

  registerWorkspaceEventListeners(workspaceFiles, workspaceFolders);
}

// This method is called when your extension is deactivated
export function deactivate() {}

const { File, Directory, SymbolicLink } = vscode.FileType;
function registerWorkspaceEventListeners(
  workspaceFiles: Set<string>,
  workspaceFolders: Set<string>,
) {
  vscode.workspace.onDidCreateFiles((e) => {
    e.files.forEach(async (uri) => {
      const path = uri.fsPath;
      const stat = await vscode.workspace.fs.stat(uri);
      const ft = stat.type;
      if (ft === File) {
        createFile(path, workspaceFiles, workspaceFolders);
      } else if (ft === Directory) {
        createDir(path, workspaceFiles, workspaceFolders);
      } else if (ft === (File | SymbolicLink)) {
      } else if (ft === (Directory | SymbolicLink)) {
      } else {
        console.error("unknown filetype");
      }
      logger.log(workspaceFiles);
      logger.log(workspaceFolders);
    });
  });
  vscode.workspace.onWillDeleteFiles((e) => {
    e.files.forEach(async (uri) => {
      const path = uri.fsPath;
      const stat = await vscode.workspace.fs.stat(uri);
      const ft = stat.type;
      if (ft === File) {
        deleteFile(path, workspaceFiles, workspaceFolders);
      } else if (ft === Directory) {
        deleteDir(path, workspaceFiles, workspaceFolders);
      } else if (ft === (File | SymbolicLink)) {
      } else if (ft === (Directory | SymbolicLink)) {
      } else {
        console.error("unknown filetype");
      }
      logger.log(workspaceFiles);
      logger.log(workspaceFolders);
    });
  });
  vscode.workspace.onDidRenameFiles((e) => {
    e.files.forEach(async ({ oldUri, newUri }) => {
      const oldPath = oldUri.fsPath;
      const newPath = newUri.fsPath;
      const stat = await vscode.workspace.fs.stat(oldUri);
      const ft = stat.type;
      if (ft === File) {
        renameFile(oldPath, newPath, workspaceFiles, workspaceFolders);
      } else if (ft === Directory) {
        renameDir(oldPath, newPath, workspaceFiles, workspaceFolders);
      } else if (ft === (File | SymbolicLink)) {
      } else if (ft === (Directory | SymbolicLink)) {
      } else {
        console.error("unknown filetype");
      }
      logger.log(workspaceFiles);
      logger.log(workspaceFolders);
    });
  });
}
