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

    it("should handle creating a file at the root", () => {
      createFile("/ROOT_FILE.md", files, dirs);
      expect(files.has("/ROOT_FILE.md")).toBe(true);
      // Should not add empty string as a directory
      expect(dirs.has("")).toBe(false);
    });
  });

  describe("createDir", () => {
    it("should add a directory to the collection", () => {
      createDir("/workspace/newdir", files, dirs);
      expect(dirs.has("/workspace/newdir")).toBe(true);
    });

    it("should not add duplicate directories", () => {
      createDir("/workspace/src", files, dirs);
      expect([...dirs].filter((d) => d === "/workspace/src").length).toBe(1);
    });

    it("should create parent dir automatically", () => {
      createDir("/workspace/a/b/c", files, dirs);
      expect(dirs.has("/workspace/a")).toBe(true);
      expect(dirs.has("/workspace/a/b")).toBe(true);
      expect(dirs.has("/workspace/a/b/c")).toBe(true);
    });

    it("should handle creating a directory with a trailing slash", () => {
      createDir("/workspace/newdir/", files, dirs);
      expect(dirs.has("/workspace/newdir/")).toBe(false);
      expect(dirs.has("/workspace/newdir")).toBe(true);
    });
  });

  describe("deleteFile", () => {
    it("should remove a file from the collection", () => {
      deleteFile("/workspace/README.md", files, dirs);
      expect(files.has("/workspace/README.md")).toBe(false);
    });

    it("should do nothing when deleting a non-existent file", () => {
      deleteFile("/workspace/NOT_EXIST.md", files, dirs);
      expect(files.size).toBe(6);
    });
  });

  describe("deleteDir", () => {
    it("should remove a directory and all its subdirectories and files", () => {
      deleteDir("/workspace/test", files, dirs);
      expect(dirs.has("/workspace/test")).toBe(false);
      expect(dirs.has("/workspace/test/subtest")).toBe(false);
      expect(files.has("/workspace/test/test.spec.ts")).toBe(false);
    });

    it("should do nothing when deleting a non-existent directory", () => {
      deleteDir("/workspace/not_exist", files, dirs);
      expect(dirs.size).toBe(4);
      expect(files.size).toBe(6);
    });

    it("should handle deleting the root directory", () => {
      deleteDir("/workspace", files, dirs);
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

    it("should handle renaming a file to a name that already exists", () => {
      createFile("/workspace/target.md", files, dirs);
      renameFile("/workspace/README.md", "/workspace/target.md", files, dirs);
      // Should not overwrite the target, this operation is invalid
      expect(files.has("/workspace/README.md")).toBe(true);
      expect(files.has("/workspace/target.md")).toBe(true);
    });

    it("should handle renaming a file to the name that a dir has the same name", () => {
      createDir("/workspace/target", files, dirs);
      renameFile("/workspace/README.md", "/workspace/target", files, dirs);
      // Should not overwrite the target, this operation is invalid
      expect(files.has("/workspace/README.md")).toBe(true);
      expect(dirs.has("/workspace/target")).toBe(true);
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
      renameDir("/workspace/test", "/workspace/tests", files, dirs);
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
        files,
        dirs,
      );
      expect(dirs.has("/workspace/should_not_exist")).toBe(false);
    });

    it("should not rename a directory if destination already exists and is a file", () => {
      createFile("/workspace/target", files, dirs);
      createDir("/workspace/source", files, dirs);
      renameDir("/workspace/source", "/workspace/target", files, dirs);
      // Should not overwrite the file
      expect(files.has("/workspace/target")).toBe(true);
      expect(dirs.has("/workspace/source")).toBe(true);
    });

    it("should handle renaming a directory to an existing directory", () => {
      createDir("/workspace/tests", files, dirs);
      renameDir("/workspace/test", "/workspace/tests", files, dirs);
      expect(dirs.has("/workspace/test")).toBe(true);
      expect(dirs.has("/workspace/tests")).toBe(true);
      expect(files.has("/workspace/test/test.spec.ts")).toBe(true);
      expect(files.has("/workspace/tests/test.spec.ts")).toBe(false);
    });
  });
});
