export function createFile(filename: string, collection: Set<string>) {
  collection.add(filename);
}

export function createDir(dirname: string, collection: Set<string>) {
  collection.add(dirname);
}

export function createSymlink(symlinkName: string, collection: Set<string>) {
  collection.add(symlinkName);
}

export function deleteFile(filename: string, collection: Set<string>) {
  collection.delete(filename);
}

export function deleteDir(
  dirname: string,
  dirCollection: Set<string>,
  fileCollection: Set<string>,
) {
  // Remove all dirs that are dirname or under dirname
  for (const dir of Array.from(dirCollection)) {
    if (dir === dirname || dir.startsWith(dirname + "/")) {
      dirCollection.delete(dir);
    }
  }
  for (const file of Array.from(fileCollection)) {
    if (file.startsWith(dirname + "/")) {
      fileCollection.delete(file);
    }
  }
}

export function deleteSymlink(symlinkName: string, collection: Set<string>) {
  collection.delete(symlinkName);
}

export function renameFile(
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

export function renameDir(
  srcName: string,
  destName: string,
  dirCollection: Set<string>,
  fileCollection?: Set<string>,
) {
  if (!dirCollection.has(srcName)) {
    return;
  }
  // Gather all dirs to rename
  const dirsToRename = Array.from(dirCollection).filter(
    (dir) => dir === srcName || dir.startsWith(srcName + "/"),
  );
  for (const dir of dirsToRename) {
    dirCollection.delete(dir);
    const newDir =
      dir === srcName ? destName : destName + dir.slice(srcName.length);
    dirCollection.add(newDir);
  }
  // Rename files under srcName
  if (fileCollection) {
    const filesToRename = Array.from(fileCollection).filter((file) =>
      file.startsWith(srcName + "/"),
    );
    for (const file of filesToRename) {
      fileCollection.delete(file);
      const newFile = destName + file.slice(srcName.length);
      fileCollection.add(newFile);
    }
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
