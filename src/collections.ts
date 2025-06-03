function removeTrailingSlash(path: string): string {
  if (path.length <= 1) {
    return path;
  }
  while (
    (path.endsWith("/") || path.endsWith("\\")) &&
    path.length > 1 &&
    !/^[a-zA-Z]:[\/\\]$/.test(path)
  ) {
    path = path.slice(0, -1);
  }
  return path;
}

// 通用父目录递归添加函数
function addParentDirs(path: string, dirs: Set<string>, isFile = false) {
  const pathParts = path.split("/");
  // 如果是文件，最后一个元素是文件名，需要 -1
  const end = isFile ? pathParts.length - 1 : pathParts.length;
  for (let i = 1; i < end; i++) {
    const dirPath = pathParts.slice(0, i + 1).join("/");
    dirs.add(dirPath);
  }
}

// 通用集合批量删除
function deleteAllMatching(
  set: Set<string>,
  predicate: (val: string) => boolean,
) {
  for (const val of Array.from(set)) {
    if (predicate(val)) {
      set.delete(val);
    }
  }
}

export function createFile(
  filename: string,
  files: Set<string>,
  dirs: Set<string>,
) {
  files.add(filename);
  addParentDirs(filename, dirs, true);
}

export function createDir(
  dirname: string,
  _files: Set<string>,
  dirs: Set<string>,
) {
  dirname = removeTrailingSlash(dirname);
  dirs.add(dirname);
  addParentDirs(dirname, dirs, false);
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
  dirname = removeTrailingSlash(dirname);
  // 删除所有以 dirname 开头的目录和文件
  deleteAllMatching(
    dirs,
    (dir) => dir === dirname || dir.startsWith(dirname + "/"),
  );
  deleteAllMatching(files, (file) => file.startsWith(dirname + "/"));
}

export function deleteSymlink(symlinkName: string, collection: Set<string>) {
  collection.delete(symlinkName);
}

// 通用重命名
function renameInSet(
  srcName: string,
  destName: string,
  set: Set<string>,
  matchSub: boolean = false,
) {
  if (!set.has(srcName)) {
    return false;
  }
  if (set.has(destName)) {
    return false;
  }
  // 重命名自身
  set.delete(srcName);
  set.add(destName);
  if (matchSub) {
    // 批量重命名子项
    for (const item of Array.from(set)) {
      if (item.startsWith(srcName + "/")) {
        set.delete(item);
        set.add(destName + item.slice(srcName.length));
      }
    }
  }
  return true;
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
  if (files.has(destName) || dirs.has(destName)) {
    return;
  }
  files.delete(srcName);
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
  // 批量重命名目录
  renameInSet(srcName, destName, dirs, true);
  // 批量重命名目录下的文件
  for (const file of Array.from(files)) {
    if (file.startsWith(srcName + "/")) {
      files.delete(file);
      files.add(destName + file.slice(srcName.length));
    }
  }
}

export function renameSymlink(
  srcName: string,
  destName: string,
  collection: Set<string>,
) {
  renameInSet(srcName, destName, collection);
}
