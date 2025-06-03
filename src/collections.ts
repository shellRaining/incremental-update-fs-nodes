export function createFile(
  filename: string,
  files: Set<string>,
  dirs: Set<string>,
) {
  files.add(filename);

  // Create parent directories automatically
  const pathParts = filename.split("/");
  for (let i = 1; i < pathParts.length - 1; i++) {
    const dirPath = pathParts.slice(0, i + 1).join("/");
    dirs.add(dirPath);
  }
}

function removeTrailingSlash(path: string): string {
  if (path.length <= 1) {
    return path;
  }
  while (
    (path.endsWith("/") || path.endsWith("\\")) &&
    path.length > 1 &&
    // 对 Windows 盘符根路径做保护
    !/^[a-zA-Z]:[\/\\]$/.test(path)
  ) {
    path = path.slice(0, -1);
  }
  return path;
}

export function createDir(
  dirname: string,
  _files: Set<string>,
  dirs: Set<string>,
) {
  dirname = removeTrailingSlash(dirname);
  dirs.add(dirname);

  // create parent directories automatically
  const pathparts = dirname.split("/");
  for (let i = 1; i < pathparts.length; i++) {
    const dirpath = pathparts.slice(0, i + 1).join("/");
    dirs.add(dirpath);
  }
}

export function createSymlink(symlinkName: string, collection: Set<string>) {
  collection.add(symlinkName);
}

export function deleteFile(
  filename: string,
  files: Set<string>,
  _dirs: Set<string>,
) {
  files.delete(filename);
}

export function deleteDir(
  dirname: string,
  files: Set<string>,
  dirs: Set<string>,
) {
  // Remove all dirs that are dirname or under dirname
  for (const dir of Array.from(dirs)) {
    if (dir === dirname || dir.startsWith(dirname + "/")) {
      dirs.delete(dir);
    }
  }
  for (const file of Array.from(files)) {
    if (file.startsWith(dirname + "/")) {
      files.delete(file);
    }
  }
}

export function deleteSymlink(symlinkName: string, collection: Set<string>) {
  collection.delete(symlinkName);
}

export function renameFile(
  srcName: string,
  destName: string,
  files: Set<string>,
  dirs: Set<string>,
) {
  if (!files.has(srcName)) {
    return;
  }
  // Prevent renaming if destName already exists as a file or directory
  if (files.has(destName) || dirs.has(destName)) {
    return;
  }
  deleteFile(srcName, files, dirs);
  createFile(destName, files, dirs);
}

export function renameDir(
  srcName: string,
  destName: string,
  dirs: Set<string>,
  files: Set<string>,
) {
  if (!dirs.has(srcName)) {
    return;
  }
  if (files.has(destName) || dirs.has(destName)) {
    return;
  }
  // Gather all dirs to rename
  const dirsToRename = Array.from(dirs).filter(
    (dir) => dir === srcName || dir.startsWith(srcName + "/"),
  );
  for (const dir of dirsToRename) {
    dirs.delete(dir);
    const newDir =
      dir === srcName ? destName : destName + dir.slice(srcName.length);
    dirs.add(newDir);
  }
  // Rename files under srcName
  const filesToRename = Array.from(files).filter((file) =>
    file.startsWith(srcName + "/"),
  );
  for (const file of filesToRename) {
    files.delete(file);
    const newFile = destName + file.slice(srcName.length);
    files.add(newFile);
  }
}

export function renameSymlink(
  srcName: string,
  destName: string,
  collection: Set<string>,
) {
  if (!collection.has(srcName)) {
    return;
  }
  collection.delete(srcName);
  collection.add(destName);
}
