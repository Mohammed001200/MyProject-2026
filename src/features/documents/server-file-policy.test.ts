import { describe, expect, it } from "vitest";
import { verifyDocumentSignature } from "@/features/documents/server-file-policy";

describe("document byte signatures", () => {
  it("recognizes supported PDF, JPEG, and PNG headers", () => {
    expect(
      verifyDocumentSignature("pdf", new TextEncoder().encode("%PDF-1.7")),
    ).toBe(true);
    expect(
      verifyDocumentSignature("jpg", Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])),
    ).toBe(true);
    expect(
      verifyDocumentSignature(
        "png",
        Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
    ).toBe(true);
  });

  it("rejects renamed or truncated content", () => {
    expect(
      verifyDocumentSignature("pdf", new TextEncoder().encode("not a pdf")),
    ).toBe(false);
    expect(verifyDocumentSignature("png", Uint8Array.from([0x89, 0x50]))).toBe(
      false,
    );
  });
});
