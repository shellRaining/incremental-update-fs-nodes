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
  // TODO: should compatible with windows
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
  filePath: string,
  files: Set<string>,
  dirs: Set<string>,
) {
  files.add(filePath);
  addParentDirs(filePath, dirs, true);
}

export function createDir(
  dirPath: string,
  _files: Set<string>,
  dirs: Set<string>,
) {
  dirPath = removeTrailingSlash(dirPath);
  dirs.add(dirPath);
  addParentDirs(dirPath, dirs, false);
}

export function createSymlink(symlinkName: string, collection: Set<string>) {
  collection.add(symlinkName);
}

export function deleteFile(
  filePath: string,
  files: Set<string>,
  _dirs: Set<string>,
) {
  files.delete(filePath);
}

export function deleteDir(
  dirPath: string,
  files: Set<string>,
  dirs: Set<string>,
) {
  dirPath = removeTrailingSlash(dirPath);
  // 删除所有以 dirPath 开头的目录和文件
  deleteAllMatching(
    dirs,
    (dir) => dir === dirPath || dir.startsWith(dirPath + "/"),
  );
  deleteAllMatching(files, (file) => file.startsWith(dirPath + "/"));
}

export function deleteSymlink(symlinkName: string, collection: Set<string>) {
  collection.delete(symlinkName);
}

// 通用重命名
function renameInSet(
  src: string,
  dest: string,
  set: Set<string>,
  matchSub: boolean = false,
) {
  if (!set.has(src)) {
    return false;
  }
  if (set.has(dest)) {
    return false;
  }
  // 重命名自身
  set.delete(src);
  set.add(dest);
  if (matchSub) {
    // 批量重命名子项
    for (const item of Array.from(set)) {
      if (item.startsWith(src + "/")) {
        set.delete(item);
        set.add(dest + item.slice(src.length));
      }
    }
  }
  return true;
}

export function renameFile(
  src: string,
  dest: string,
  files: Set<string>,
  dirs: Set<string>,
) {
  if (!files.has(src)) {
    return;
  }
  if (files.has(dest) || dirs.has(dest)) {
    return;
  }
  files.delete(src);
  createFile(dest, files, dirs);
}

export function renameDir(
  src: string,
  dest: string,
  files: Set<string>,
  dirs: Set<string>,
) {
  if (!dirs.has(src)) {
    return;
  }
  if (files.has(dest) || dirs.has(dest)) {
    return;
  }
  // 批量重命名目录
  renameInSet(src, dest, dirs, true);
  // 批量重命名目录下的文件
  for (const file of Array.from(files)) {
    if (file.startsWith(src + "/")) {
      files.delete(file);
      files.add(dest + file.slice(src.length));
    }
  }
}

export function renameSymlink(
  src: string,
  dest: string,
  collection: Set<string>,
) {
  renameInSet(src, dest, collection);
}
