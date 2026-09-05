import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  assertDocumentSourceIntegrity,
  DOCUMENT_SOURCE_INTEGRITY_ERROR_CODE,
  DocumentSourceIntegrityError,
  type DocumentSourceIntegrityMetadata,
} from "@/server/documents/source-integrity";

function hash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

function metadata(
  bytes: Uint8Array,
  overrides: Partial<DocumentSourceIntegrityMetadata> = {},
): DocumentSourceIntegrityMetadata {
  return {
    sizeBytes: BigInt(bytes.byteLength),
    sha256: hash(bytes),
    verifiedMimeType: "application/pdf",
    extension: "pdf",
    ...overrides,
  };
}

describe("document source integrity", () => {
  it.each([
    {
      extension: "pdf",
      mimeType: "application/pdf",
      bytes: new TextEncoder().encode("%PDF-1.7\nfixture"),
    },
    {
      extension: "jpg",
      mimeType: "image/jpeg",
      bytes: Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]),
    },
    {
      extension: "jpeg",
      mimeType: "image/jpeg",
      bytes: Uint8Array.from([0xff, 0xd8, 0xff, 0xe1]),
    },
    {
      extension: "png",
      mimeType: "image/png",
      bytes: Uint8Array.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00,
      ]),
    },
  ])(
    "accepts an intact $extension source",
    ({ bytes, extension, mimeType }) => {
      expect(() =>
        assertDocumentSourceIntegrity(
          bytes,
          metadata(bytes, {
            extension,
            verifiedMimeType: mimeType,
            sizeBytes:
              extension === "jpeg"
                ? bytes.byteLength
                : BigInt(bytes.byteLength),
          }),
        ),
      ).not.toThrow();
    },
  );

  it.each([
    {
      check: "size",
      bytes: new TextEncoder().encode("%PDF-1.7\nfixture"),
      overrides: { sizeBytes: 1n },
    },
    {
      check: "hash",
      bytes: new TextEncoder().encode("%PDF-1.7\nfixture"),
      overrides: { sha256: "0".repeat(64) },
    },
    {
      check: "MIME type",
      bytes: new TextEncoder().encode("%PDF-1.7\nfixture"),
      overrides: { verifiedMimeType: "image/png" },
    },
    {
      check: "extension",
      bytes: new TextEncoder().encode("%PDF-1.7\nfixture"),
      overrides: { extension: "exe" },
    },
    {
      check: "magic bytes",
      bytes: new TextEncoder().encode("not-a-pdf"),
      overrides: {},
    },
  ] satisfies Array<{
    check: string;
    bytes: Uint8Array;
    overrides: Partial<DocumentSourceIntegrityMetadata>;
  }>)("fails closed on a $check mismatch", ({ bytes, overrides }) => {
    expect(() =>
      assertDocumentSourceIntegrity(bytes, metadata(bytes, overrides)),
    ).toThrow(DocumentSourceIntegrityError);

    try {
      assertDocumentSourceIntegrity(bytes, metadata(bytes, overrides));
    } catch (error) {
      expect(error).toMatchObject({
        code: DOCUMENT_SOURCE_INTEGRITY_ERROR_CODE,
        message: "The stored document failed its integrity check.",
      });
    }
  });
});
