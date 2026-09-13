import "server-only";

import { createHash, timingSafeEqual } from "node:crypto";

export const DOCUMENT_SOURCE_INTEGRITY_ERROR_CODE =
  "DOCUMENT_SOURCE_INTEGRITY_FAILED" as const;

export type DocumentSourceIntegrityMetadata = Readonly<{
  sizeBytes: bigint | number;
  sha256: string;
  verifiedMimeType: string;
  extension: string;
}>;

type SupportedSource = Readonly<{
  mimeType: string;
  signature: readonly number[];
}>;

const supportedSources = {
  pdf: {
    mimeType: "application/pdf",
    signature: [0x25, 0x50, 0x44, 0x46, 0x2d],
  },
  jpg: {
    mimeType: "image/jpeg",
    signature: [0xff, 0xd8, 0xff],
  },
  jpeg: {
    mimeType: "image/jpeg",
    signature: [0xff, 0xd8, 0xff],
  },
  png: {
    mimeType: "image/png",
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },
} as const satisfies Record<string, SupportedSource>;

type SupportedExtension = keyof typeof supportedSources;

export class DocumentSourceIntegrityError extends Error {
  readonly code = DOCUMENT_SOURCE_INTEGRITY_ERROR_CODE;

  constructor() {
    super("The stored document failed its integrity check.");
    this.name = "DocumentSourceIntegrityError";
  }
}

function isSupportedExtension(value: string): value is SupportedExtension {
  return Object.hasOwn(supportedSources, value);
}

function hasExpectedSize(actualSize: number, expectedSize: bigint | number) {
  if (typeof expectedSize === "bigint") {
    return expectedSize === BigInt(actualSize);
  }

  return (
    Number.isSafeInteger(expectedSize) &&
    expectedSize >= 0 &&
    expectedSize === actualSize
  );
}

function hasExpectedSignature(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

function hasExpectedHash(bytes: Uint8Array, expectedHash: string) {
  if (!/^[0-9a-f]{64}$/.test(expectedHash)) return false;

  const actual = createHash("sha256").update(bytes).digest();
  const expected = Buffer.from(expectedHash, "hex");
  return timingSafeEqual(actual, expected);
}

export function assertDocumentSourceIntegrity(
  bytes: Uint8Array,
  metadata: DocumentSourceIntegrityMetadata,
): void {
  const extension = metadata.extension;
  if (!isSupportedExtension(extension)) {
    throw new DocumentSourceIntegrityError();
  }

  const source = supportedSources[extension];
  if (
    source.mimeType !== metadata.verifiedMimeType ||
    !hasExpectedSize(bytes.byteLength, metadata.sizeBytes) ||
    !hasExpectedSignature(bytes, source.signature) ||
    !hasExpectedHash(bytes, metadata.sha256)
  ) {
    throw new DocumentSourceIntegrityError();
  }
}
