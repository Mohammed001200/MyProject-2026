import "server-only";

import { randomUUID } from "node:crypto";
import { requireStorageEnvironment } from "@/server/env";
import { LocalPrivateDocumentStorage } from "@/server/storage/local";
import { S3PrivateDocumentStorage } from "@/server/storage/s3";
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

  const configuration = requireStorageEnvironment();
  storageInstance =
    configuration.driver === "local"
      ? new LocalPrivateDocumentStorage(configuration.root)
      : new S3PrivateDocumentStorage(configuration);
  return storageInstance;
}
