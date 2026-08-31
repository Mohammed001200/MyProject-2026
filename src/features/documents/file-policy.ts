export const DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;

const allowedTypes = new Map([
  ["pdf", "application/pdf"],
  ["jpg", "image/jpeg"],
  ["jpeg", "image/jpeg"],
  ["png", "image/png"],
]);

export type FileCandidate = {
  name: string;
  size: number;
  type: string;
};

export type FilePolicyResult =
  | { ok: true; extension: string }
  | { ok: false; code: "EMPTY" | "TOO_LARGE" | "UNSUPPORTED"; message: string };

export function validateDocumentCandidate(
  file: FileCandidate,
): FilePolicyResult {
  if (file.size === 0) {
    return { ok: false, code: "EMPTY", message: "The selected file is empty." };
  }

  if (file.size > DOCUMENT_MAX_BYTES) {
    return {
      ok: false,
      code: "TOO_LARGE",
      message: "The preview limit is 10 MB.",
    };
  }

  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const expectedMime = allowedTypes.get(extension);

  if (!expectedMime || expectedMime !== file.type.toLowerCase()) {
    return {
      ok: false,
      code: "UNSUPPORTED",
      message: "Choose a PDF, JPG, JPEG, or PNG file.",
    };
  }

  return { ok: true, extension };
}
