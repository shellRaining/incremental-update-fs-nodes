import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
