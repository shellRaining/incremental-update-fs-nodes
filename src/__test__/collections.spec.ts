import { describe, it, expect, beforeEach } from "vitest";
import {
  createFile,
  createDir,
  deleteFile,
  deleteDir,
  renameFile,
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

  describe("createFile", () => {
    it("should add a file to the collection", () => {
      createFile("/workspace/NEW_FILE.md", files, dirs);
      expect(files.has("/workspace/NEW_FILE.md")).toBe(true);
    });

    it("should not add duplicate files", () => {
      createFile("/workspace/LICENSE", files, dirs);
      expect([...files].filter((f) => f === "/workspace/LICENSE").length).toBe(
        1,
      );
    });

    it("should create parent dir automatically", () => {
      createFile("/workspace/a/b/c.ts", files, dirs);
      expect(files.has("/workspace/a/b/c.ts")).toBe(true);
      expect(dirs.has("/workspace/a")).toBe(true);
      expect(dirs.has("/workspace/a/b")).toBe(true);
    });
  });

  describe("createDir", () => {
    it("should add a directory to the collection", () => {
      createDir("/workspace/newdir", dirs);
      expect(dirs.has("/workspace/newdir")).toBe(true);
    });

    it("should not add duplicate directories", () => {
      createDir("/workspace/src", dirs);
      expect([...dirs].filter((d) => d === "/workspace/src").length).toBe(1);
    });

    it("should create parent dir automatically", () => {
      createDir("/workspace/a/b/c", dirs);
      expect(dirs.has("/workspace/a")).toBe(true);
      expect(dirs.has("/workspace/a/b")).toBe(true);
      expect(dirs.has("/workspace/a/b/c")).toBe(true);
    });
  });

  describe("deleteFile", () => {
    it("should remove a file from the collection", () => {
      deleteFile("/workspace/README.md", files);
      expect(files.has("/workspace/README.md")).toBe(false);
    });

    it("should do nothing when deleting a non-existent file", () => {
      deleteFile("/workspace/NOT_EXIST.md", files);
      expect(files.size).toBe(6);
    });
  });

  describe("deleteDir", () => {
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

    it("should handle deleting the root directory", () => {
      deleteDir("/workspace", dirs, files);
      expect(dirs.size).toBe(0);
      expect(files.size).toBe(0);
    });
  });

  describe("renameFile", () => {
    it("should rename a file in the collection", () => {
      renameFile(
        "/workspace/README.md",
        "/workspace/README_NEW.md",
        files,
        dirs,
      );
      expect(files.has("/workspace/README.md")).toBe(false);
      expect(files.has("/workspace/README_NEW.md")).toBe(true);
    });

    it("should not rename if old file does not exist", () => {
      renameFile("/workspace/NOT_EXIST.md", "/workspace/NEW.md", files, dirs);
      expect(files.has("/workspace/NEW.md")).toBe(false);
    });

    it("should create parent dir automatically", () => {
      renameFile(
        "/workspace/README.md",
        "/workspace/docs/README.md",
        files,
        dirs,
      );
      expect(files.has("/workspace/README.md")).toBe(false);
      expect(files.has("/workspace/docs/README.md")).toBe(true);
      expect(dirs.has("/workspace/docs")).toBe(true);
    });
  });

  describe("renameDir", () => {
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
  });
});
