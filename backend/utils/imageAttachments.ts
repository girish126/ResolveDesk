const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export type ImageAttachment = {
  name: string;
  type: string;
  data: string;
};

function hasExpectedSignature(type: string, bytes: Buffer) {
  if (type === "image/jpeg") {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (type === "image/png") {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }

  return (
    type === "image/webp" &&
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  );
}

export function parseImageAttachments(
  value: unknown,
  maxCount: number,
  maxBytesPerImage: number,
): ImageAttachment[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > maxCount) return null;

  const attachments: ImageAttachment[] = [];

  for (const item of value) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("name" in item) ||
      !("type" in item) ||
      !("data" in item) ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      item.name.length > 255 ||
      typeof item.type !== "string" ||
      !allowedTypes.has(item.type) ||
      typeof item.data !== "string"
    ) {
      return null;
    }

    const prefix = `data:${item.type};base64,`;
    if (!item.data.startsWith(prefix)) return null;

    const encoded = item.data.slice(prefix.length);
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) {
      return null;
    }

    const bytes = Buffer.from(encoded, "base64");
    if (
      bytes.length === 0 ||
      bytes.length > maxBytesPerImage ||
      bytes.toString("base64") !== encoded ||
      !hasExpectedSignature(item.type, bytes)
    ) {
      return null;
    }

    attachments.push({
      name: item.name.trim(),
      type: item.type,
      data: item.data,
    });
  }

  return attachments;
}
