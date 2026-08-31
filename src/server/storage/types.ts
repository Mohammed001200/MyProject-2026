export type StoredDocument = {
  key: string;
  sizeBytes: number;
};

export interface DocumentStorage {
  put(key: string, bytes: Uint8Array): Promise<StoredDocument>;
  read(key: string): Promise<Uint8Array>;
  delete(key: string): Promise<void>;
}
