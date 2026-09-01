import "server-only";

import { createHash } from "node:crypto";
import {
  DeleteObjectCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from "@aws-sdk/client-s3";
import { DOCUMENT_MAX_BYTES } from "@/features/documents/file-policy";
import {
  assertDocumentStorageBytes,
  assertDocumentStorageKey,
  InvalidDocumentStorageInputError,
  type DocumentStorage,
} from "@/server/storage/types";

export type S3DocumentStorageConfiguration = {
  bucket: string;
  region: string;
  endpoint?: string;
  forcePathStyle: boolean;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
};

type StorageCommand =
  | PutObjectCommand
  | GetObjectCommand
  | DeleteObjectCommand
  | GetBucketVersioningCommand;
type SendStorageCommand = (command: StorageCommand) => Promise<unknown>;

const S3_REQUEST_TIMEOUT_MS = 60_000;
const S3_PROVIDER_FINGERPRINT_LENGTH = 20;

export class UnsafeS3BucketVersioningError extends Error {
  readonly code = "UNSAFE_S3_BUCKET_VERSIONING";

  constructor(
    message = "The private document bucket must never have enabled versioning.",
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "UnsafeS3BucketVersioningError";
  }
}

export function buildS3StorageProvider(
  configuration: S3DocumentStorageConfiguration,
): `s3-private-${string}` {
  const location = JSON.stringify([
    configuration.bucket,
    configuration.region,
    configuration.endpoint ?? null,
  ]);
  const fingerprint = createHash("sha256")
    .update(location, "utf8")
    .digest("hex")
    .slice(0, S3_PROVIDER_FINGERPRINT_LENGTH);
  return `s3-private-${fingerprint}`;
}

function isAsyncIterable(value: unknown): value is AsyncIterable<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    Symbol.asyncIterator in value &&
    typeof value[Symbol.asyncIterator] === "function"
  );
}

function asBoundedBodyIterable(body: unknown): AsyncIterable<unknown> {
  if (isAsyncIterable(body)) return body;

  if (
    typeof body === "object" &&
    body !== null &&
    "transformToWebStream" in body &&
    typeof body.transformToWebStream === "function"
  ) {
    const stream = body.transformToWebStream();
    if (isAsyncIterable(stream)) return stream;
  }

  throw new Error("The stored document body cannot be streamed safely.");
}

async function readBoundedBody(body: unknown) {
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for await (const chunk of asBoundedBodyIterable(body)) {
    if (!(chunk instanceof Uint8Array)) {
      throw new Error("The stored document returned an invalid byte stream.");
    }
    totalBytes += chunk.byteLength;
    if (totalBytes > DOCUMENT_MAX_BYTES) {
      throw new InvalidDocumentStorageInputError(
        "The stored document exceeds the allowed size.",
      );
    }
    chunks.push(chunk);
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  assertDocumentStorageBytes(bytes);
  return bytes;
}

export function buildS3ClientConfig(
  configuration: S3DocumentStorageConfiguration,
): S3ClientConfig {
  return {
    region: configuration.region,
    endpoint: configuration.endpoint,
    forcePathStyle: configuration.forcePathStyle,
    credentials: configuration.credentials,
  };
}

function createSdkSender(
  configuration: S3DocumentStorageConfiguration,
): SendStorageCommand {
  const client = new S3Client(buildS3ClientConfig(configuration));

  return async (command) => {
    const abortController = new AbortController();
    const timeout = setTimeout(
      () => abortController.abort(),
      S3_REQUEST_TIMEOUT_MS,
    );
    timeout.unref();

    try {
      const options = { abortSignal: abortController.signal };
      if (command instanceof PutObjectCommand) {
        return await client.send(command, options);
      }
      if (command instanceof GetObjectCommand) {
        return await client.send(command, options);
      }
      if (command instanceof DeleteObjectCommand) {
        return await client.send(command, options);
      }
      return await client.send(command, options);
    } finally {
      clearTimeout(timeout);
    }
  };
}

export class S3PrivateDocumentStorage implements DocumentStorage {
  readonly provider: `s3-private-${string}`;
  private readonly bucket: string;
  private readonly send: SendStorageCommand;

  constructor(
    configuration: S3DocumentStorageConfiguration,
    send: SendStorageCommand = createSdkSender(configuration),
  ) {
    this.bucket = configuration.bucket;
    this.provider = buildS3StorageProvider(configuration);
    this.send = send;
  }

  private async assertBucketWasNeverVersioned() {
    const response = (await this.send(
      new GetBucketVersioningCommand({ Bucket: this.bucket }),
    )) as { Status?: unknown };

    if (response.Status !== undefined) {
      throw new UnsafeS3BucketVersioningError();
    }
  }

  async put(key: string, bytes: Uint8Array) {
    assertDocumentStorageKey(key);
    assertDocumentStorageBytes(bytes);
    await this.assertBucketWasNeverVersioned();

    const response = (await this.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: bytes,
        ContentLength: bytes.byteLength,
        ContentType: "application/octet-stream",
        CacheControl: "private, no-store",
        ServerSideEncryption: "AES256",
      }),
    )) as { VersionId?: unknown };

    if (response.VersionId !== undefined) {
      if (typeof response.VersionId === "string" && response.VersionId) {
        try {
          await this.send(
            new DeleteObjectCommand({
              Bucket: this.bucket,
              Key: key,
              VersionId: response.VersionId,
            }),
          );
        } catch (cause) {
          throw new UnsafeS3BucketVersioningError(
            "The bucket enabled versioning during upload and the unexpected object version could not be removed.",
            { cause },
          );
        }
      }
      throw new UnsafeS3BucketVersioningError(
        "The bucket enabled versioning during document upload.",
      );
    }

    return { key, sizeBytes: bytes.byteLength };
  }

  async read(key: string) {
    assertDocumentStorageKey(key);
    const response = (await this.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: key }),
    )) as {
      Body?: unknown;
      ContentLength?: number;
    };

    if (
      response.ContentLength !== undefined &&
      response.ContentLength > DOCUMENT_MAX_BYTES
    ) {
      throw new InvalidDocumentStorageInputError(
        "The stored document exceeds the allowed size.",
      );
    }
    if (!response.Body) {
      throw new Error("The stored document body is unavailable.");
    }

    return readBoundedBody(response.Body);
  }

  async delete(key: string) {
    assertDocumentStorageKey(key);
    await this.assertBucketWasNeverVersioned();
    const response = (await this.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    )) as { DeleteMarker?: unknown; VersionId?: unknown };

    if (response.DeleteMarker === true || response.VersionId !== undefined) {
      throw new UnsafeS3BucketVersioningError(
        "The bucket enabled versioning during document deletion.",
      );
    }
  }
}
