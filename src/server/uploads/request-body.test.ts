import { describe, expect, it } from "vitest";
import {
  InvalidUploadFormError,
  UploadRequestTooLargeError,
  readRequestBodyWithLimit,
} from "@/server/uploads/request-body";

describe("bounded upload request body", () => {
  it("reads a body that fits the ingress limit", async () => {
    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: Uint8Array.from([1, 2, 3]),
    });

    await expect(readRequestBodyWithLimit(request, 3)).resolves.toEqual(
      Uint8Array.from([1, 2, 3]),
    );
  });

  it("stops a streamed body once it crosses the limit", async () => {
    const request = new Request("http://localhost/upload", {
      method: "POST",
      body: Uint8Array.from([1, 2, 3, 4]),
    });

    await expect(readRequestBodyWithLimit(request, 3)).rejects.toBeInstanceOf(
      UploadRequestTooLargeError,
    );
  });

  it("rejects an invalid content length", async () => {
    const request = new Request("http://localhost/upload", {
      method: "POST",
      headers: { "content-length": "not-a-number" },
      body: Uint8Array.from([1]),
    });

    await expect(readRequestBodyWithLimit(request, 3)).rejects.toBeInstanceOf(
      InvalidUploadFormError,
    );
  });
});
