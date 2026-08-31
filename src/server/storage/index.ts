import "server-only";

import { randomUUID } from "node:crypto";
import { LocalPrivateDocumentStorage } from "@/server/storage/local";
import type { DocumentStorage } from "@/server/storage/types";

let storageInstance: DocumentStorage | undefined;

export function createDocumentObjectKey(
  workspaceId: string,
  documentId: string,
  extension: string,
) {
  return `${workspaceId}/${documentId}/${randomUUID()}.${extension}`;
}

export function getDocumentStorage(): DocumentStorage {
  if (storageInstance) return storageInstance;

  const driver = process.env.CIVORA_STORAGE_DRIVER?.trim() || "local";
  if (driver !== "local") {
    throw new Error(`Unsupported document storage driver: ${driver}`);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Local document storage is forbidden in production; configure a private durable adapter.",
    );
  }

  storageInstance = new LocalPrivateDocumentStorage(
    process.env.LOCAL_STORAGE_ROOT?.trim() || ".civora-data",
  );
  return storageInstance;
}
