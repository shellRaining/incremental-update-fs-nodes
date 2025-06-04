import { globby } from "globby";

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

interface AddParentDirsOptions {
  isFile?: boolean;
  baseDir?: string;
}

function addParentDirs(
  path: string,
  dirs: Set<string>,
  opts: AddParentDirsOptions = {},
) {
  const { isFile = false, baseDir } = opts;

  // 统一分隔符并去除结尾斜杠
  const normalize = (p: string) => p.replace(/\\/g, "/").replace(/\/+$/, "");
  const inputPath = normalize(path);
  const base = baseDir ? normalize(baseDir) : undefined;

  // 如果是文件，去掉最后一段（文件名）
  let dir = isFile
    ? inputPath.substring(0, inputPath.lastIndexOf("/"))
    : inputPath;

  // 循环向上加目录，直到 baseDir 或根目录
  while (dir && (!base || dir.length >= base.length)) {
    dirs.add(dir);
    if (base && dir === base) {
      break;
    }

    const lastSlash = dir.lastIndexOf("/");
    if (lastSlash === -1) {
      break;
    }
    dir = dir.substring(0, lastSlash);
  }
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

export class WorkspaceCollection {
  readonly roots: string[];
  readonly allFiles: Set<string>;
  readonly allDirs: Set<string>;

  get relativeFiles(): string[] {
    return Array.from(this.allFiles).map((file) => this.toRelativePath(file));
  }

  get relativeDirs(): string[] {
    return Array.from(this.allDirs).map((dir) => this.toRelativePath(dir));
  }

  private toRelativePath(absPath: string): string {
    for (const root of this.roots) {
      if (absPath.startsWith(root + "/") || absPath === root) {
        return absPath.slice(root.length).replace(/^\/+/, "");
      }
    }
    return absPath;
  }

  private constructor(
    roots: string[],
    allFiles: Set<string>,
    allDirs: Set<string>,
  ) {
    this.roots = roots;
    this.allFiles = allFiles;
    this.allDirs = allDirs;
  }

  static async create(roots: string[]): Promise<WorkspaceCollection> {
    const files = new Set<string>();
    const dirs = new Set<string>();

    await Promise.all(
      roots.map(async (root) => {
        const foundFiles = await globby("**/*", {
          cwd: root,
          absolute: true,
          onlyFiles: true,
          gitignore: true,
        });
        foundFiles.forEach((f) => files.add(f));

        const foundDirs = await globby("**/", {
          cwd: root,
          absolute: true,
          onlyDirectories: true,
          gitignore: true,
        });
        foundDirs.forEach((d) => dirs.add(d));
        dirs.add(root); // 根目录本身也加进去
      }),
    );

    return new WorkspaceCollection(roots, files, dirs);
  }

  createFile(filePath: string) {
    this.allFiles.add(filePath);
    const baseDirs = this.roots.filter((root) => filePath.startsWith(root));
    const baseDir = baseDirs[0] ?? "";
    addParentDirs(filePath, this.allDirs, { isFile: true, baseDir });
  }

  createDir(dirPath: string) {
    dirPath = removeTrailingSlash(dirPath);
    this.allDirs.add(dirPath);
    const baseDirs = this.roots.filter((root) => dirPath.startsWith(root));
    const baseDir = baseDirs[0] ?? "";
    addParentDirs(dirPath, this.allDirs, { isFile: false, baseDir });
  }

  createSymlink(symlinkName: string, collection: Set<string>) {
    collection.add(symlinkName);
  }

  deleteFile(filePath: string) {
    this.allFiles.delete(filePath);
  }

  deleteDir(dirPath: string) {
    dirPath = removeTrailingSlash(dirPath);
    // 删除所有以 dirPath 开头的目录和文件
    deleteAllMatching(
      this.allDirs,
      (dir) => dir === dirPath || dir.startsWith(dirPath + "/"),
    );
    deleteAllMatching(this.allFiles, (file) => file.startsWith(dirPath + "/"));
  }

  deleteSymlink(symlinkName: string, collection: Set<string>) {
    collection.delete(symlinkName);
  }

  renameFile(src: string, dest: string) {
    if (!this.allFiles.has(src)) {
      return;
    }
    if (this.allFiles.has(dest) || this.allDirs.has(dest)) {
      return;
    }
    this.allFiles.delete(src);
    this.createFile(dest);
  }

  renameDir(src: string, dest: string) {
    if (!this.allDirs.has(src)) {
      return;
    }
    if (this.allFiles.has(dest) || this.allDirs.has(dest)) {
      return;
    }
    // 批量重命名目录
    renameInSet(src, dest, this.allDirs, true);
    // 批量重命名目录下的文件
    for (const file of Array.from(this.allFiles)) {
      if (file.startsWith(src + "/")) {
        this.allFiles.delete(file);
        this.allFiles.add(dest + file.slice(src.length));
      }
    }
  }

  renameSymlink(src: string, dest: string, collection: Set<string>) {
    renameInSet(src, dest, collection);
  }
}
