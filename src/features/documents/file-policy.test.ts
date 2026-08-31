import { describe, expect, it } from "vitest";
import { DOCUMENT_MAX_BYTES, validateDocumentCandidate } from "./file-policy";

describe("validateDocumentCandidate", () => {
  it("accepts a supported extension and matching MIME type", () => {
    expect(
      validateDocumentCandidate({
        name: "notice.PDF",
        size: 48_000,
        type: "application/pdf",
      }),
    ).toEqual({ ok: true, extension: "pdf" });
  });

  it("rejects an extension and MIME mismatch", () => {
    const result = validateDocumentCandidate({
      name: "invoice.pdf",
      size: 48_000,
      type: "image/png",
    });
    expect(result).toMatchObject({ ok: false, code: "UNSUPPORTED" });
  });

  it("rejects empty files", () => {
    expect(
      validateDocumentCandidate({
        name: "empty.png",
        size: 0,
        type: "image/png",
      }),
    ).toMatchObject({ ok: false, code: "EMPTY" });
  });

  it("rejects files above the configured maximum", () => {
    expect(
      validateDocumentCandidate({
        name: "large.jpg",
        size: DOCUMENT_MAX_BYTES + 1,
        type: "image/jpeg",
      }),
    ).toMatchObject({ ok: false, code: "TOO_LARGE" });
  });
});
