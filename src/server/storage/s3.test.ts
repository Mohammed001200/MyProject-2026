import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  DeleteObjectCommand,
  GetBucketVersioningCommand,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { DOCUMENT_MAX_BYTES } from "@/features/documents/file-policy";
import {
  buildS3ClientConfig,
  buildS3StorageProvider,
  S3PrivateDocumentStorage,
  type S3DocumentStorageConfiguration,
  UnsafeS3BucketVersioningError,
} from "@/server/storage/s3";
import { assertDocumentStorageProvider } from "@/server/storage/types";

const configuration: S3DocumentStorageConfiguration = {
  bucket: "civora-private-documents",
  region: "eu-central-1",
  endpoint: "https://storage.example.com",
  forcePathStyle: true,
};

describe("S3 private document storage", () => {
  it("binds the provider namespace to the non-secret S3 location", () => {
    const provider = buildS3StorageProvider(configuration);
    const changedBucketStorage = new S3PrivateDocumentStorage(
      { ...configuration, bucket: "another-bucket" },
      async () => ({}),
    );
    const changedEndpointStorage = new S3PrivateDocumentStorage(
      {
        ...configuration,
        endpoint: "https://another-storage.example.com",
      },
      async () => ({}),
    );

    expect(provider).toMatch(/^s3-private-[0-9a-f]{20}$/);
    expect(provider).toHaveLength(31);
    expect(buildS3StorageProvider({ ...configuration })).toBe(provider);
    expect(
      buildS3StorageProvider({ ...configuration, bucket: "another-bucket" }),
    ).not.toBe(provider);
    expect(
      buildS3StorageProvider({ ...configuration, region: "eu-west-1" }),
    ).not.toBe(provider);
    expect(
      buildS3StorageProvider({
        ...configuration,
        endpoint: "https://another-storage.example.com",
      }),
    ).not.toBe(provider);
    expect(() =>
      assertDocumentStorageProvider(changedBucketStorage, provider),
    ).toThrow("not stored by the active private storage provider");
    expect(() =>
      assertDocumentStorageProvider(changedEndpointStorage, provider),
    ).toThrow("not stored by the active private storage provider");
  });

  it("leaves credentials to the AWS default chain unless explicitly supplied", () => {
    expect(buildS3ClientConfig(configuration)).toMatchObject({
      region: "eu-central-1",
      endpoint: "https://storage.example.com",
      forcePathStyle: true,
    });
    expect(buildS3ClientConfig(configuration).credentials).toBeUndefined();

    const credentials = {
      accessKeyId: "explicit-access",
      secretAccessKey: "explicit-secret",
    };
    expect(
      buildS3ClientConfig({ ...configuration, credentials }).credentials,
    ).toEqual(credentials);
  });

  it("puts, reads, and deletes only through private bucket operations", async () => {
    const commands: unknown[] = [];
    const storedBytes = new Uint8Array([1, 2, 3, 4]);
    const send = vi.fn(async (command: unknown) => {
      commands.push(command);
      if (command instanceof GetObjectCommand) {
        return {
          ContentLength: storedBytes.byteLength,
          Body: {
            async *[Symbol.asyncIterator]() {
              yield storedBytes.subarray(0, 2);
              yield storedBytes.subarray(2);
            },
          },
        };
      }
      return {};
    });
    const storage = new S3PrivateDocumentStorage(configuration, send);
    const key = "workspace/document/random.pdf";

    await expect(storage.put(key, storedBytes)).resolves.toEqual({
      key,
      sizeBytes: 4,
    });
    await expect(storage.read(key)).resolves.toEqual(storedBytes);
    await expect(storage.delete(key)).resolves.toBeUndefined();

    expect(storage.provider).toBe(buildS3StorageProvider(configuration));
    expect(commands[0]).toBeInstanceOf(GetBucketVersioningCommand);
    expect((commands[0] as GetBucketVersioningCommand).input).toEqual({
      Bucket: configuration.bucket,
    });
    expect(commands[1]).toBeInstanceOf(PutObjectCommand);
    expect((commands[1] as PutObjectCommand).input).toMatchObject({
      Bucket: configuration.bucket,
      Key: key,
      ContentLength: 4,
      ContentType: "application/octet-stream",
      CacheControl: "private, no-store",
      ServerSideEncryption: "AES256",
    });
    expect((commands[1] as PutObjectCommand).input.ACL).toBeUndefined();
    expect(commands[2]).toBeInstanceOf(GetObjectCommand);
    expect(commands[3]).toBeInstanceOf(GetBucketVersioningCommand);
    expect(commands[4]).toBeInstanceOf(DeleteObjectCommand);
  });

  it.each(["Enabled", "Suspended"] as const)(
    "rejects a bucket with %s versioning before put and delete",
    async (status) => {
      const send = vi.fn(async (command: unknown) => {
        if (command instanceof GetBucketVersioningCommand)
          return { Status: status };
        throw new Error("An unsafe data operation was attempted");
      });
      const storage = new S3PrivateDocumentStorage(configuration, send);

      await expect(
        storage.put("workspace/document/random.pdf", new Uint8Array([1])),
      ).rejects.toBeInstanceOf(UnsafeS3BucketVersioningError);
      await expect(
        storage.delete("workspace/document/random.pdf"),
      ).rejects.toBeInstanceOf(UnsafeS3BucketVersioningError);

      expect(send).toHaveBeenCalledTimes(2);
      expect(
        send.mock.calls.every(
          ([command]) => command instanceof GetBucketVersioningCommand,
        ),
      ).toBe(true);
    },
  );

  it("removes and rejects an unexpected version created by an upload race", async () => {
    const commands: unknown[] = [];
    const send = vi.fn(async (command: unknown) => {
      commands.push(command);
      if (command instanceof PutObjectCommand) {
        return { VersionId: "unexpected-version-id" };
      }
      return {};
    });
    const storage = new S3PrivateDocumentStorage(configuration, send);

    await expect(
      storage.put("workspace/document/random.pdf", new Uint8Array([1])),
    ).rejects.toBeInstanceOf(UnsafeS3BucketVersioningError);

    expect(commands[0]).toBeInstanceOf(GetBucketVersioningCommand);
    expect(commands[1]).toBeInstanceOf(PutObjectCommand);
    expect(commands[2]).toBeInstanceOf(DeleteObjectCommand);
    expect((commands[2] as DeleteObjectCommand).input).toMatchObject({
      Bucket: configuration.bucket,
      Key: "workspace/document/random.pdf",
      VersionId: "unexpected-version-id",
    });
  });

  it("does not claim permanent deletion when versioning races the delete", async () => {
    const send = vi.fn(async (command: unknown) => {
      if (command instanceof DeleteObjectCommand) {
        return { DeleteMarker: true, VersionId: "delete-marker-id" };
      }
      return {};
    });
    const storage = new S3PrivateDocumentStorage(configuration, send);

    await expect(
      storage.delete("workspace/document/random.pdf"),
    ).rejects.toBeInstanceOf(UnsafeS3BucketVersioningError);
  });

  it("keeps repeated deletion idempotent in a verified unversioned bucket", async () => {
    const commands: unknown[] = [];
    const storage = new S3PrivateDocumentStorage(
      configuration,
      async (command) => {
        commands.push(command);
        return {};
      },
    );

    await expect(
      storage.delete("workspace/document/missing.pdf"),
    ).resolves.toBeUndefined();
    await expect(
      storage.delete("workspace/document/missing.pdf"),
    ).resolves.toBeUndefined();

    expect(commands).toHaveLength(4);
    expect(commands[0]).toBeInstanceOf(GetBucketVersioningCommand);
    expect(commands[1]).toBeInstanceOf(DeleteObjectCommand);
    expect(commands[2]).toBeInstanceOf(GetBucketVersioningCommand);
    expect(commands[3]).toBeInstanceOf(DeleteObjectCommand);
  });

  it("rejects an oversized stored object before reading its body", async () => {
    const startReading = vi.fn();
    const storage = new S3PrivateDocumentStorage(configuration, async () => ({
      ContentLength: DOCUMENT_MAX_BYTES + 1,
      Body: {
        async *[Symbol.asyncIterator]() {
          startReading();
          yield new Uint8Array([1]);
        },
      },
    }));

    await expect(storage.read("workspace/document/random.pdf")).rejects.toThrow(
      "exceeds the allowed size",
    );
    expect(startReading).not.toHaveBeenCalled();
  });

  it("bounds the byte stream when content length is missing or incorrect", async () => {
    const storage = new S3PrivateDocumentStorage(configuration, async () => ({
      ContentLength: 1,
      Body: {
        async *[Symbol.asyncIterator]() {
          yield new Uint8Array(DOCUMENT_MAX_BYTES);
          yield new Uint8Array([1]);
        },
      },
    }));

    await expect(storage.read("workspace/document/random.pdf")).rejects.toThrow(
      "exceeds the allowed size",
    );
  });
});
