import * as fs from "fs";
import * as path from "path";
import * as util from "util";

export type LogOptions = {
  overwrite?: boolean; // 是否覆盖输出
};

export class Logger {
  private logPath: string;
  private stream: fs.WriteStream;

  constructor(logPath: string, options: LogOptions = {}) {
    this.logPath = path.resolve(logPath);

    if (options.overwrite) {
      fs.writeFileSync(this.logPath, "");
    }

    this.stream = fs.createWriteStream(this.logPath, {
      flags: options.overwrite ? "w" : "a",
      encoding: "utf8",
    });
  }

  log(...args: any[]) {
    const time = new Date().toISOString();
    const msg = args
      .map((arg) =>
        typeof arg === "string"
          ? arg
          : util.inspect(arg, { depth: null, colors: false, compact: false }),
      )
      .join(" ");
    this.stream.write(`[${time}] ${msg}\n`);
  }

  clear() {
    this.stream.close();
    fs.writeFileSync(this.logPath, "");
    this.stream = fs.createWriteStream(this.logPath, {
      flags: "w",
      encoding: "utf8",
    });
  }

  dispose() {
    this.stream.close();
  }
}
