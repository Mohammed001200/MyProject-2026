import { DOCUMENT_MAX_BYTES } from "@/features/documents/file-policy";

export const DOCUMENT_UPLOAD_REQUEST_MAX_BYTES =
  DOCUMENT_MAX_BYTES + 128 * 1024;

export class UploadRequestTooLargeError extends Error {
  readonly code = "UPLOAD_REQUEST_TOO_LARGE";

  constructor() {
    super("The upload request exceeds the allowed size.");
    this.name = "UploadRequestTooLargeError";
  }
}

export class InvalidUploadFormError extends Error {
  readonly code = "INVALID_UPLOAD_FORM";

  constructor() {
    super("The upload request is not valid multipart form data.");
    this.name = "InvalidUploadFormError";
  }
}

export async function readRequestBodyWithLimit(
  request: Request,
  maxBytes: number,
) {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    const parsedLength = Number(declaredLength);
    if (!Number.isSafeInteger(parsedLength) || parsedLength < 0) {
      throw new InvalidUploadFormError();
    }
    if (parsedLength > maxBytes) throw new UploadRequestTooLargeError();
  }

  if (!request.body) throw new InvalidUploadFormError();

  const chunks: Uint8Array[] = [];
  const reader = request.body.getReader();
  let size = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new UploadRequestTooLargeError();
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

export async function readDocumentUploadForm(request: Request) {
  const contentType = request.headers.get("content-type");
  if (!contentType?.toLowerCase().startsWith("multipart/form-data;")) {
    throw new InvalidUploadFormError();
  }

  const bytes = await readRequestBodyWithLimit(
    request,
    DOCUMENT_UPLOAD_REQUEST_MAX_BYTES,
  );

  try {
    return await new Response(bytes, {
      headers: { "content-type": contentType },
    }).formData();
  } catch {
    throw new InvalidUploadFormError();
  }
}
