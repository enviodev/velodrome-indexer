import * as fs from "fs";
import * as path from "path";

import { CacheCategory } from "./Constants";

type Address = string;

type Shape = Record<string, Record<string, string>>;
type ShapeRoot = Shape & Record<Address, { hash: string }>;

type ShapeToken = Shape &
  Record<Address, { decimals: number; name: string; symbol: string }>;

export class Cache {
  static init<C = CacheCategory>(
    category: C,
    chainId: number | string | bigint,
  ) {
    if (!Object.values(CacheCategory).find((c) => c === category)) {
      throw new Error("Unsupported cache category");
    }

    type S = C extends "token" ? ShapeToken : ShapeRoot;
    const entry = new Entry<S>(`${category}-${chainId.toString()}`);
    return entry;
  }
}

export class Entry<T extends Shape> {
  private memory: Shape = {};

  static encoding = "utf8" as const;
  static folder = "./.cache" as const;

  public readonly key: string;
  public readonly file: string;

  constructor(key: string) {
    this.key = key;
    this.file = Entry.resolve(key);

    this.preflight();
    this.load();
  }

  public read(key: string) {
    const memory = this.memory || {};
    return memory[key] as T[typeof key];
  }

  public load() {
    try {
      const data = fs.readFileSync(this.file, Entry.encoding);
      this.memory = JSON.parse(data) as T;
    } catch (error) {
      console.error(error);
      this.memory = {};
    }
  }

  public add<N extends T>(fields: N) {
    if (!this.memory || Object.values(this.memory).length === 0) {
      this.memory = fields;
    } else {
      Object.keys(fields).forEach((key) => {
        if (!this.memory[key]) {
          this.memory[key] = {};
        }
        Object.keys(fields[key]).forEach((nested) => {
          this.memory[key][nested] = fields[key][nested];
        });
      });
    }

    this.publish();
  }

  private preflight() {
    /** Ensure cache folder exists */
    if (!fs.existsSync(Entry.folder)) {
      fs.mkdirSync(Entry.folder);
    }
    if (!fs.existsSync(this.file)) {
      fs.writeFileSync(this.file, JSON.stringify({}));
    }
  }

  private publish() {
    const prepared = JSON.stringify(this.memory);
    try {
      fs.writeFileSync(this.file, prepared);
    } catch (error) {
      console.error(error);
    }
  }

  static resolve(key: string) {
    return path.join(Entry.folder, key.toLowerCase().concat(".json"));
  }
}
