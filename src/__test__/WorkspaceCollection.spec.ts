import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { WorkspaceCollection } from "../WorkspaceCollection";

const tmpDir = path.resolve(__dirname, ".test-ws");
const workspaceRoot = "/Users/shellRaining/workspace";

async function setupTestDir() {
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
  await fs.mkdir(tmpDir, { recursive: true });
  await fs.mkdir(path.join(tmpDir, "subdir1"), { recursive: true });
  await fs.mkdir(path.join(tmpDir, "subdir2/nested"), { recursive: true });
  await fs.writeFile(path.join(tmpDir, "file1.txt"), "foo");
  await fs.writeFile(path.join(tmpDir, "subdir1/file2.md"), "bar");
  await fs.writeFile(path.join(tmpDir, "subdir2/nested/file3.js"), "baz");
}

async function cleanupTestDir() {
  await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
}

describe("WorkspaceCollection", () => {
  beforeAll(setupTestDir);
  afterAll(cleanupTestDir);

  it("should collect all files and directories", async () => {
    const ws = await WorkspaceCollection.create([tmpDir]);

    // 用 Array.from 排序后方便断言
    const files = Array.from(ws.allFiles)
      .map((p) => path.relative(tmpDir, p))
      .sort();
    const dirs = Array.from(ws.allDirs)
      .map((p) => path.relative(tmpDir, p))
      .sort();

    expect(files).toEqual(
      [
        "file1.txt",
        path.join("subdir1", "file2.md"),
        path.join("subdir2", "nested", "file3.js"),
      ].sort(),
    );

    expect(dirs).toEqual(
      [
        "", // 根目录
        "subdir1",
        "subdir2",
        path.join("subdir2", "nested"),
      ].sort(),
    );
  });
});

describe("WorkspaceCollection (collections migrated)", () => {
  let ws: WorkspaceCollection;

  beforeEach(() => {
    // 由于 WorkspaceCollection 构造函数是私有的，这里用类型断言绕过
    ws = new (WorkspaceCollection as any)(
      [workspaceRoot],
      new Set([
        `${workspaceRoot}/LICENSE`,
        `${workspaceRoot}/README.md`,
        `${workspaceRoot}/README_zh.md`,
        `${workspaceRoot}/src/index.ts`,
        `${workspaceRoot}/src/utils.ts`,
        `${workspaceRoot}/test/test.spec.ts`,
      ]),
      new Set([
        workspaceRoot,
        `${workspaceRoot}/src`,
        `${workspaceRoot}/test`,
        `${workspaceRoot}/test/subtest`,
      ]),
    );
  });

  describe("createFile", () => {
    it("should add a file to collection", () => {
      ws.createFile(`${workspaceRoot}/NEW_FILE.md`);
      expect(ws.allFiles.has(`${workspaceRoot}/NEW_FILE.md`)).toBe(true);
    });

    it("should not add duplicate files", () => {
      ws.createFile(`${workspaceRoot}/LICENSE`);
      expect(
        [...ws.allFiles].filter((f) => f === `${workspaceRoot}/LICENSE`).length,
      ).toBe(1);
    });

    it("should create parent dirs automatically", () => {
      const originSize = ws.allDirs.size;
      ws.createFile(`${workspaceRoot}/a/b/c.ts`);
      expect(ws.allFiles.has(`${workspaceRoot}/a/b/c.ts`)).toBe(true);
      expect(ws.allDirs.has(`${workspaceRoot}/a`)).toBe(true);
      expect(ws.allDirs.has(`${workspaceRoot}/a/b`)).toBe(true);
      expect(ws.allDirs.size).toBe(originSize + 2);
    });

    it("should handle creating a file at root", () => {
      ws.createFile("/ROOT_FILE.md");
      expect(ws.allFiles.has("/ROOT_FILE.md")).toBe(true);
      expect(ws.allDirs.has("")).toBe(false);
    });
  });

  describe("createDir", () => {
    it("should add a directory to collection", () => {
      ws.createDir(`${workspaceRoot}/newdir`);
      expect(ws.allDirs.has(`${workspaceRoot}/newdir`)).toBe(true);
    });

    it("should not add duplicate directories", () => {
      ws.createDir(`${workspaceRoot}/src`);
      expect(
        [...ws.allDirs].filter((d) => d === `${workspaceRoot}/src`).length,
      ).toBe(1);
    });

    it("should create parent dirs automatically", () => {
      const originSize = ws.allDirs.size;
      ws.createDir(`${workspaceRoot}/a/b/c`);
      expect(ws.allDirs.has(`${workspaceRoot}/a`)).toBe(true);
      expect(ws.allDirs.has(`${workspaceRoot}/a/b`)).toBe(true);
      expect(ws.allDirs.has(`${workspaceRoot}/a/b/c`)).toBe(true);
      expect(ws.allDirs.size).toBe(originSize + 3);
    });

    it("should handle trailing slash", () => {
      ws.createDir(`${workspaceRoot}/newdir/`);
      expect(ws.allDirs.has(`${workspaceRoot}/newdir/`)).toBe(false);
      expect(ws.allDirs.has(`${workspaceRoot}/newdir`)).toBe(true);
    });
  });

  describe("deleteFile", () => {
    it("should remove a file", () => {
      ws.deleteFile(`${workspaceRoot}/README.md`);
      expect(ws.allFiles.has(`${workspaceRoot}/README.md`)).toBe(false);
    });

    it("should do nothing when file does not exist", () => {
      const oldSize = ws.allFiles.size;
      ws.deleteFile(`${workspaceRoot}/NOT_EXIST.md`);
      expect(ws.allFiles.size).toBe(oldSize);
    });
  });

  describe("deleteDir", () => {
    it("should remove dir and subdirs/files", () => {
      ws.deleteDir(`${workspaceRoot}/test`);
      expect(ws.allDirs.has(`${workspaceRoot}/test`)).toBe(false);
      expect(ws.allDirs.has(`${workspaceRoot}/test/subtest`)).toBe(false);
      expect(ws.allFiles.has(`${workspaceRoot}/test/test.spec.ts`)).toBe(false);
    });

    it("should do nothing if dir not exist", () => {
      const oldDirSize = ws.allDirs.size;
      const oldFileSize = ws.allFiles.size;
      ws.deleteDir(`${workspaceRoot}/not_exist`);
      expect(ws.allDirs.size).toBe(oldDirSize);
      expect(ws.allFiles.size).toBe(oldFileSize);
    });

    it("should handle deleting the root dir", () => {
      ws.deleteDir(workspaceRoot);
      expect(ws.allDirs.size).toBe(0);
      expect(ws.allFiles.size).toBe(0);
    });
  });

  describe("renameFile", () => {
    beforeEach(() => {
      // 重新初始化
      ws = new (WorkspaceCollection as any)(
        [],
        new Set([
          `${workspaceRoot}/LICENSE`,
          `${workspaceRoot}/README.md`,
          `${workspaceRoot}/src/index.ts`,
        ]),
        new Set([workspaceRoot, `${workspaceRoot}/src`]),
      );
    });

    it("should rename a file", () => {
      ws.renameFile(
        `${workspaceRoot}/README.md`,
        `${workspaceRoot}/README_NEW.md`,
      );
      expect(ws.allFiles.has(`${workspaceRoot}/README.md`)).toBe(false);
      expect(ws.allFiles.has(`${workspaceRoot}/README_NEW.md`)).toBe(true);
    });

    it("should not rename if old file does not exist", () => {
      ws.renameFile(`${workspaceRoot}/NOT_EXIST.md`, `${workspaceRoot}/NEW.md`);
      expect(ws.allFiles.has(`${workspaceRoot}/NEW.md`)).toBe(false);
    });

    it("should not overwrite existing file", () => {
      ws.createFile(`${workspaceRoot}/target.md`);
      ws.renameFile(`${workspaceRoot}/README.md`, `${workspaceRoot}/target.md`);
      expect(ws.allFiles.has(`${workspaceRoot}/README.md`)).toBe(true);
      expect(ws.allFiles.has(`${workspaceRoot}/target.md`)).toBe(true);
    });

    it("should not overwrite existing dir", () => {
      ws.createDir(`${workspaceRoot}/target`);
      ws.renameFile(`${workspaceRoot}/README.md`, `${workspaceRoot}/target`);
      expect(ws.allFiles.has(`${workspaceRoot}/README.md`)).toBe(true);
      expect(ws.allDirs.has(`${workspaceRoot}/target`)).toBe(true);
    });

    it("should create parent dirs automatically", () => {
      ws.renameFile(
        `${workspaceRoot}/README.md`,
        `${workspaceRoot}/docs/README.md`,
      );
      expect(ws.allFiles.has(`${workspaceRoot}/README.md`)).toBe(false);
      expect(ws.allFiles.has(`${workspaceRoot}/docs/README.md`)).toBe(true);
      expect(ws.allDirs.has(`${workspaceRoot}/docs`)).toBe(true);
    });
  });

  describe("renameDir", () => {
    beforeEach(() => {
      ws = new (WorkspaceCollection as any)(
        [],
        new Set([`${workspaceRoot}/test/test.spec.ts`]),
        new Set([
          workspaceRoot,
          `${workspaceRoot}/src`,
          `${workspaceRoot}/test`,
          `${workspaceRoot}/test/subtest`,
        ]),
      );
    });

    it("should rename a directory with subdirs/files", () => {
      ws.renameDir(`${workspaceRoot}/test`, `${workspaceRoot}/tests`);
      expect(ws.allDirs.has(`${workspaceRoot}/test`)).toBe(false);
      expect(ws.allDirs.has(`${workspaceRoot}/tests`)).toBe(true);
      expect(ws.allDirs.has(`${workspaceRoot}/tests/subtest`)).toBe(true);
      expect(ws.allFiles.has(`${workspaceRoot}/test/test.spec.ts`)).toBe(false);
      expect(ws.allFiles.has(`${workspaceRoot}/tests/test.spec.ts`)).toBe(true);
    });

    it("should do nothing if old dir not exist", () => {
      ws.renameDir(
        `${workspaceRoot}/not_exist`,
        `${workspaceRoot}/should_not_exist`,
      );
      expect(ws.allDirs.has(`${workspaceRoot}/should_not_exist`)).toBe(false);
    });

    it("should not overwrite file with a dir rename", () => {
      ws.createFile(`${workspaceRoot}/target`);
      ws.createDir(`${workspaceRoot}/source`);
      ws.renameDir(`${workspaceRoot}/source`, `${workspaceRoot}/target`);
      expect(ws.allFiles.has(`${workspaceRoot}/target`)).toBe(true);
      expect(ws.allDirs.has(`${workspaceRoot}/source`)).toBe(true);
    });

    it("should not rename to an existing dir", () => {
      ws.createDir(`${workspaceRoot}/tests`);
      ws.renameDir(`${workspaceRoot}/test`, `${workspaceRoot}/tests`);
      expect(ws.allDirs.has(`${workspaceRoot}/test`)).toBe(true);
      expect(ws.allDirs.has(`${workspaceRoot}/tests`)).toBe(true);
      expect(ws.allFiles.has(`${workspaceRoot}/test/test.spec.ts`)).toBe(true);
      expect(ws.allFiles.has(`${workspaceRoot}/tests/test.spec.ts`)).toBe(
        false,
      );
    });
  });
});
