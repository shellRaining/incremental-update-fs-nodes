import * as vscode from "vscode";
import { globby } from "globby";
import {
  createDir,
  createFile,
  deleteDir,
  deleteFile,
  renameDir,
  renameFile,
} from "./collections";

export async function activate(_: vscode.ExtensionContext) {
  const workspaceFolderRoots = vscode.workspace.workspaceFolders;
  if (!workspaceFolderRoots || workspaceFolderRoots.length === 0) {
    return;
  }

  const { workspaceFiles, workspaceFolders } =
    await initWorkspaceCollections(workspaceFolderRoots);
  console.log(workspaceFiles);
  console.log(workspaceFolders);

  registerWorkspaceEventListeners(workspaceFiles, workspaceFolders);
}

// This method is called when your extension is deactivated
export function deactivate() {}

/**
 * @param folderPath absolute path of workspace dir
 */
async function collectWorkspaceFilesAndFolders(
  folderPath: string,
  workspaceFiles: Set<string>,
  workspaceFolders: Set<string>,
) {
  const [files, dirs] = await Promise.all([
    globby("**/*", { cwd: folderPath, absolute: true, onlyFiles: true }),
    globby("**/", { cwd: folderPath, absolute: true, onlyDirectories: true }),
  ]);
  files.forEach((item) => {
    workspaceFiles.add(item);
  });
  dirs.forEach((item) => {
    workspaceFolders.add(item);
  });
}

async function initWorkspaceCollections(
  workspaceFolderRoots: readonly vscode.WorkspaceFolder[],
) {
  const workspaceFiles = new Set<string>();
  const workspaceFolders = new Set<string>();
  await Promise.all(
    workspaceFolderRoots.map((folder) =>
      collectWorkspaceFilesAndFolders(
        folder.uri.fsPath,
        workspaceFiles,
        workspaceFolders,
      ),
    ),
  );
  return { workspaceFiles, workspaceFolders };
}

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
      console.log(workspaceFiles);
      console.log(workspaceFolders);
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
      console.log(workspaceFiles);
      console.log(workspaceFolders);
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
      console.log(workspaceFiles);
      console.log(workspaceFolders);
    });
  });
}
