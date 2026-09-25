import { DOCUMENT_MAX_BYTES } from "@/features/documents/file-policy";

export type DocumentStorageProvider = "local-private" | `s3-private-${string}`;

export type StoredDocument = {
  key: string;
  sizeBytes: number;
};

export interface DocumentStorage {
  readonly provider: DocumentStorageProvider;
  put(key: string, bytes: Uint8Array): Promise<StoredDocument>;
  read(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}

export class InvalidDocumentStorageInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDocumentStorageInputError";
  }
}

export class DocumentStorageProviderMismatchError extends Error {
  readonly code = "DOCUMENT_STORAGE_PROVIDER_MISMATCH";

  constructor() {
    super("The document is not stored by the active private storage provider.");
    this.name = "DocumentStorageProviderMismatchError";
  }
}

export function assertDocumentStorageProvider(
  storage: DocumentStorage,
  recordedProvider: string,
) {
  if (storage.provider !== recordedProvider) {
    throw new DocumentStorageProviderMismatchError();
  }
}

export function assertDocumentStorageKey(key: string) {
  const segments = key.split("/");
  if (
    key.length === 0 ||
    Buffer.byteLength(key, "utf8") > 1024 ||
    key.startsWith("/") ||
    key.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(key) ||
    segments.some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    throw new InvalidDocumentStorageInputError(
      "The document storage key is invalid.",
    );
  }
}

export function assertDocumentStorageBytes(bytes: Uint8Array) {
  if (bytes.byteLength === 0 || bytes.byteLength > DOCUMENT_MAX_BYTES) {
    throw new InvalidDocumentStorageInputError(
      "The document storage payload is outside the allowed size.",
    );
  }
}
