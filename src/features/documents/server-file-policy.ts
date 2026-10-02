import { createHash } from "node:crypto";
import { validateDocumentCandidate } from "@/features/documents/file-policy";

const signatures = {
  pdf: [0x25, 0x50, 0x44, 0x46, 0x2d],
  jpg: [0xff, 0xd8, 0xff],
  jpeg: [0xff, 0xd8, 0xff],
  png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
} as const;

export class InvalidDocumentFileError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "InvalidDocumentFileError";
    this.code = code;
  }
}

function hasSignature(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((value, index) => bytes[index] === value);
}

export function verifyDocumentSignature(
  extension: keyof typeof signatures,
  bytes: Uint8Array,
) {
  return hasSignature(bytes, signatures[extension]);
}

function safeDisplayName(name: string) {
  const leaf = name.replace(/\\/g, "/").split("/").pop() ?? "document";
  const cleaned = leaf.replace(/[\u0000-\u001f\u007f]/g, "").trim();
  return cleaned.slice(0, 180) || "document";
}

export async function validateUploadedDocument(file: File) {
  const candidate = validateDocumentCandidate(file);
  if (!candidate.ok) {
    throw new InvalidDocumentFileError(candidate.code, candidate.message);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const extension = candidate.extension as keyof typeof signatures;

  if (!verifyDocumentSignature(extension, bytes)) {
    throw new InvalidDocumentFileError(
      "SIGNATURE_MISMATCH",
      "The file content does not match its extension.",
    );
  }

  return {
    bytes,
    extension,
    mimeType: file.type.toLowerCase(),
    originalFileName: safeDisplayName(file.name),
    sizeBytes: file.size,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}
