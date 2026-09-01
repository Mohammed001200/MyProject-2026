import { describe, expect, it, vi } from "vitest";
import { DOCUMENT_MAX_BYTES } from "@/features/documents/file-policy";
import {
  assertDocumentStorageBytes,
  assertDocumentStorageKey,
  assertDocumentStorageProvider,
} from "@/server/storage/types";

describe("document storage boundaries", () => {
  it("accepts generated relative object keys", () => {
    expect(() =>
      assertDocumentStorageKey(
        "workspace-id/document-id/550e8400-e29b-41d4-a716-446655440000.pdf",
      ),
    ).not.toThrow();
  });

  it.each([
    "",
    "/absolute/document.pdf",
    "../document.pdf",
    "workspace/../document.pdf",
    "workspace\\document.pdf",
    "workspace//document.pdf",
    "workspace/document\u0000.pdf",
  ])("rejects unsafe object key %j", (key) => {
    expect(() => assertDocumentStorageKey(key)).toThrow(
      "storage key is invalid",
    );
  });

  it("enforces the document size limit at the provider boundary", () => {
    expect(() => assertDocumentStorageBytes(new Uint8Array([1]))).not.toThrow();
    expect(() => assertDocumentStorageBytes(new Uint8Array(0))).toThrow();
    expect(() =>
      assertDocumentStorageBytes(new Uint8Array(DOCUMENT_MAX_BYTES + 1)),
    ).toThrow("outside the allowed size");
  });

  it("fails closed when persisted and active providers do not match", () => {
    const storage = {
      provider: "s3-private-1234567890abcdef1234" as const,
      put: vi.fn(),
      read: vi.fn(),
      delete: vi.fn(),
    };

    expect(() =>
      assertDocumentStorageProvider(storage, "s3-private-1234567890abcdef1234"),
    ).not.toThrow();
    expect(() =>
      assertDocumentStorageProvider(storage, "local-private"),
    ).toThrow("not stored by the active private storage provider");
  });
});
