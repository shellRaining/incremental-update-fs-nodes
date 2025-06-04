import { globby } from "globby";

export class WorkspaceCollection {
  readonly roots: string[];
  readonly allFiles: Set<string>;
  readonly allDirs: Set<string>;

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
}
