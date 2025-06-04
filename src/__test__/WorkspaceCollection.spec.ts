import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import * as fs from "fs/promises";
import * as path from "path";
import { WorkspaceCollection } from "../WorkspaceCollection";

const tmpDir = path.resolve(__dirname, ".test-ws");

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
      [],
      new Set([
        "/workspace/LICENSE",
        "/workspace/README.md",
        "/workspace/README_zh.md",
        "/workspace/src/index.ts",
        "/workspace/src/utils.ts",
        "/workspace/test/test.spec.ts",
      ]),
      new Set([
        "/workspace",
        "/workspace/src",
        "/workspace/test",
        "/workspace/test/subtest",
      ]),
    );
  });

  describe("createFile", () => {
    it("should add a file to collection", () => {
      ws.createFile("/workspace/NEW_FILE.md");
      expect(ws.allFiles.has("/workspace/NEW_FILE.md")).toBe(true);
    });

    it("should not add duplicate files", () => {
      ws.createFile("/workspace/LICENSE");
      expect(
        [...ws.allFiles].filter((f) => f === "/workspace/LICENSE").length,
      ).toBe(1);
    });

    it("should create parent dirs automatically", () => {
      ws.createFile("/workspace/a/b/c.ts");
      expect(ws.allFiles.has("/workspace/a/b/c.ts")).toBe(true);
      expect(ws.allDirs.has("/workspace/a")).toBe(true);
      expect(ws.allDirs.has("/workspace/a/b")).toBe(true);
    });

    it("should handle creating a file at root", () => {
      ws.createFile("/ROOT_FILE.md");
      expect(ws.allFiles.has("/ROOT_FILE.md")).toBe(true);
      expect(ws.allDirs.has("")).toBe(false);
    });
  });

  describe("createDir", () => {
    it("should add a directory to collection", () => {
      ws.createDir("/workspace/newdir");
      expect(ws.allDirs.has("/workspace/newdir")).toBe(true);
    });

    it("should not add duplicate directories", () => {
      ws.createDir("/workspace/src");
      expect([...ws.allDirs].filter((d) => d === "/workspace/src").length).toBe(
        1,
      );
    });

    it("should create parent dirs automatically", () => {
      ws.createDir("/workspace/a/b/c");
      expect(ws.allDirs.has("/workspace/a")).toBe(true);
      expect(ws.allDirs.has("/workspace/a/b")).toBe(true);
      expect(ws.allDirs.has("/workspace/a/b/c")).toBe(true);
    });

    it("should handle trailing slash", () => {
      ws.createDir("/workspace/newdir/");
      expect(ws.allDirs.has("/workspace/newdir/")).toBe(false);
      expect(ws.allDirs.has("/workspace/newdir")).toBe(true);
    });
  });

  describe("deleteFile", () => {
    it("should remove a file", () => {
      ws.deleteFile("/workspace/README.md");
      expect(ws.allFiles.has("/workspace/README.md")).toBe(false);
    });

    it("should do nothing when file does not exist", () => {
      const oldSize = ws.allFiles.size;
      ws.deleteFile("/workspace/NOT_EXIST.md");
      expect(ws.allFiles.size).toBe(oldSize);
    });
  });

  describe("deleteDir", () => {
    it("should remove dir and subdirs/files", () => {
      ws.deleteDir("/workspace/test");
      expect(ws.allDirs.has("/workspace/test")).toBe(false);
      expect(ws.allDirs.has("/workspace/test/subtest")).toBe(false);
      expect(ws.allFiles.has("/workspace/test/test.spec.ts")).toBe(false);
    });

    it("should do nothing if dir not exist", () => {
      const oldDirSize = ws.allDirs.size;
      const oldFileSize = ws.allFiles.size;
      ws.deleteDir("/workspace/not_exist");
      expect(ws.allDirs.size).toBe(oldDirSize);
      expect(ws.allFiles.size).toBe(oldFileSize);
    });

    it("should handle deleting the root dir", () => {
      ws.deleteDir("/workspace");
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
          "/workspace/LICENSE",
          "/workspace/README.md",
          "/workspace/src/index.ts",
        ]),
        new Set(["/workspace", "/workspace/src"]),
      );
    });

    it("should rename a file", () => {
      ws.renameFile("/workspace/README.md", "/workspace/README_NEW.md");
      expect(ws.allFiles.has("/workspace/README.md")).toBe(false);
      expect(ws.allFiles.has("/workspace/README_NEW.md")).toBe(true);
    });

    it("should not rename if old file does not exist", () => {
      ws.renameFile("/workspace/NOT_EXIST.md", "/workspace/NEW.md");
      expect(ws.allFiles.has("/workspace/NEW.md")).toBe(false);
    });

    it("should not overwrite existing file", () => {
      ws.createFile("/workspace/target.md");
      ws.renameFile("/workspace/README.md", "/workspace/target.md");
      expect(ws.allFiles.has("/workspace/README.md")).toBe(true);
      expect(ws.allFiles.has("/workspace/target.md")).toBe(true);
    });

    it("should not overwrite existing dir", () => {
      ws.createDir("/workspace/target");
      ws.renameFile("/workspace/README.md", "/workspace/target");
      expect(ws.allFiles.has("/workspace/README.md")).toBe(true);
      expect(ws.allDirs.has("/workspace/target")).toBe(true);
    });

    it("should create parent dirs automatically", () => {
      ws.renameFile("/workspace/README.md", "/workspace/docs/README.md");
      expect(ws.allFiles.has("/workspace/README.md")).toBe(false);
      expect(ws.allFiles.has("/workspace/docs/README.md")).toBe(true);
      expect(ws.allDirs.has("/workspace/docs")).toBe(true);
    });
  });

  describe("renameDir", () => {
    beforeEach(() => {
      ws = new (WorkspaceCollection as any)(
        [],
        new Set(["/workspace/test/test.spec.ts"]),
        new Set([
          "/workspace",
          "/workspace/src",
          "/workspace/test",
          "/workspace/test/subtest",
        ]),
      );
    });

    it("should rename a directory with subdirs/files", () => {
      ws.renameDir("/workspace/test", "/workspace/tests");
      expect(ws.allDirs.has("/workspace/test")).toBe(false);
      expect(ws.allDirs.has("/workspace/tests")).toBe(true);
      expect(ws.allDirs.has("/workspace/tests/subtest")).toBe(true);
      expect(ws.allFiles.has("/workspace/test/test.spec.ts")).toBe(false);
      expect(ws.allFiles.has("/workspace/tests/test.spec.ts")).toBe(true);
    });

    it("should do nothing if old dir not exist", () => {
      ws.renameDir("/workspace/not_exist", "/workspace/should_not_exist");
      expect(ws.allDirs.has("/workspace/should_not_exist")).toBe(false);
    });

    it("should not overwrite file with a dir rename", () => {
      ws.createFile("/workspace/target");
      ws.createDir("/workspace/source");
      ws.renameDir("/workspace/source", "/workspace/target");
      expect(ws.allFiles.has("/workspace/target")).toBe(true);
      expect(ws.allDirs.has("/workspace/source")).toBe(true);
    });

    it("should not rename to an existing dir", () => {
      ws.createDir("/workspace/tests");
      ws.renameDir("/workspace/test", "/workspace/tests");
      expect(ws.allDirs.has("/workspace/test")).toBe(true);
      expect(ws.allDirs.has("/workspace/tests")).toBe(true);
      expect(ws.allFiles.has("/workspace/test/test.spec.ts")).toBe(true);
      expect(ws.allFiles.has("/workspace/tests/test.spec.ts")).toBe(false);
    });
  });
});
