export function toBufferFromFirestoreBytes(value: unknown): Buffer {
  if (!value) {
    throw new Error("File bytes are missing");
  }

  if (Buffer.isBuffer(value)) {
    return value;
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value);
  }

  if (typeof value === "object") {
    const maybeBytes = value as {
      toUint8Array?: () => Uint8Array;
      toBase64?: () => string;
      value?: string;
      _base64?: string;
    };

    if (typeof maybeBytes.toUint8Array === "function") {
      return Buffer.from(maybeBytes.toUint8Array());
    }

    if (typeof maybeBytes.toBase64 === "function") {
      return Buffer.from(maybeBytes.toBase64(), "base64");
    }

    const base64 = maybeBytes.value ?? maybeBytes._base64;
    if (typeof base64 === "string" && base64.length > 0) {
      return Buffer.from(base64, "base64");
    }
  }

  throw new Error("Unsupported Firestore bytes format");
}
