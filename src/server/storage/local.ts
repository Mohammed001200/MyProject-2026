import "server-only";

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import {
  assertDocumentStorageBytes,
  assertDocumentStorageKey,
  type DocumentStorage,
} from "@/server/storage/types";

export class LocalPrivateDocumentStorage implements DocumentStorage {
  readonly provider = "local-private" as const;
  readonly root: string;

  constructor(root: string) {
    this.root = resolve(root);
  }

  private resolveKey(key: string) {
    assertDocumentStorageKey(key);
    if (isAbsolute(key)) throw new Error("Storage keys must be relative");
    const target = resolve(this.root, key);
    if (!target.startsWith(`${this.root}${sep}`)) {
      throw new Error("Storage key escaped the private root");
    }
    return target;
  }

  async put(key: string, bytes: Uint8Array) {
    assertDocumentStorageBytes(bytes);
    const target = this.resolveKey(key);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes, { flag: "wx", mode: 0o600 });
    return { key, sizeBytes: bytes.byteLength };
  }

  async read(key: string) {
    return new Uint8Array(await readFile(this.resolveKey(key)));
  }

  async delete(key: string) {
    await rm(this.resolveKey(key), { force: true });
  }
}
