import { describe, it, expect, beforeEach } from "vitest";
import {
  createFile,
  deleteFile,
  renameFile,
  createDir,
  deleteDir,
  renameDir,
} from "../collections";

describe("collections", () => {
  let files: Set<string>;
  let dirs: Set<string>;

  beforeEach(() => {
    files = new Set([
      "/workspace/LICENSE",
      "/workspace/README.md",
      "/workspace/README_zh.md",
      "/workspace/src/index.ts",
      "/workspace/src/utils.ts",
      "/workspace/test/test.spec.ts",
    ]);
    dirs = new Set([
      "/workspace",
      "/workspace/src",
      "/workspace/test",
      "/workspace/test/subtest",
    ]);
  });

  it("should add a file to the collection", () => {
    createFile("/workspace/NEW_FILE.md", files);
    expect(files.has("/workspace/NEW_FILE.md")).toBe(true);
  });

  it("should not add duplicate files", () => {
    createFile("/workspace/LICENSE", files);
    expect([...files].filter((f) => f === "/workspace/LICENSE").length).toBe(1);
  });

  it("should remove a file from the collection", () => {
    deleteFile("/workspace/README.md", files);
    expect(files.has("/workspace/README.md")).toBe(false);
  });

  it("should do nothing when deleting a non-existent file", () => {
    deleteFile("/workspace/NOT_EXIST.md", files);
    expect(files.size).toBe(6);
  });

  it("should rename a file in the collection", () => {
    renameFile("/workspace/README.md", "/workspace/README_NEW.md", files);
    expect(files.has("/workspace/README.md")).toBe(false);
    expect(files.has("/workspace/README_NEW.md")).toBe(true);
  });

  it("should not rename if old file does not exist", () => {
    renameFile("/workspace/NOT_EXIST.md", "/workspace/NEW.md", files);
    expect(files.has("/workspace/NEW.md")).toBe(false);
  });

  it("should add a directory to the collection", () => {
    createDir("/workspace/newdir", dirs);
    expect(dirs.has("/workspace/newdir")).toBe(true);
  });

  it("should not add duplicate directories", () => {
    createDir("/workspace/src", dirs);
    expect([...dirs].filter((d) => d === "/workspace/src").length).toBe(1);
  });

  it("should remove a directory and all its subdirectories and files", () => {
    deleteDir("/workspace/test", dirs, files);
    expect(dirs.has("/workspace/test")).toBe(false);
    expect(dirs.has("/workspace/test/subtest")).toBe(false);
    expect(files.has("/workspace/test/test.spec.ts")).toBe(false);
  });

  it("should do nothing when deleting a non-existent directory", () => {
    deleteDir("/workspace/not_exist", dirs, files);
    expect(dirs.size).toBe(4);
    expect(files.size).toBe(6);
  });

  it("should rename a directory and all its subdirectories and files", () => {
    renameDir("/workspace/test", "/workspace/tests", dirs, files);
    expect(dirs.has("/workspace/test")).toBe(false);
    expect(dirs.has("/workspace/tests")).toBe(true);
    expect(dirs.has("/workspace/tests/subtest")).toBe(true);
    expect(files.has("/workspace/test/test.spec.ts")).toBe(false);
    expect(files.has("/workspace/tests/test.spec.ts")).toBe(true);
  });

  it("should not rename if old directory does not exist", () => {
    renameDir(
      "/workspace/not_exist",
      "/workspace/should_not_exist",
      dirs,
      files,
    );
    expect(dirs.has("/workspace/should_not_exist")).toBe(false);
  });

  it("should handle renaming a directory to an existing directory", () => {
    createDir("/workspace/tests", dirs);
    renameDir("/workspace/test", "/workspace/tests", dirs, files);
    expect(dirs.has("/workspace/test")).toBe(false);
    expect(dirs.has("/workspace/tests")).toBe(true);
    expect(files.has("/workspace/tests/test.spec.ts")).toBe(true);
  });

  it("should handle deleting the root directory", () => {
    deleteDir("/workspace", dirs, files);
    expect(dirs.size).toBe(0);
    expect(files.size).toBe(0);
  });
});
