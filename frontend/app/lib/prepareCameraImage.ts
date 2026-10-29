const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 2400;
const SUPPORTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Unable to process the captured photo."));
      }
    }, "image/jpeg", quality);
  });
}

export async function prepareCameraImage(file: File): Promise<File> {
  if (
    SUPPORTED_IMAGE_TYPES.has(file.type) &&
    file.size <= MAX_IMAGE_BYTES
  ) {
    return file;
  }

  let bitmap: ImageBitmap;

  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      `${file.name}: this camera image format is not supported. Capture as JPG, PNG, or WebP.`,
    );
  }

  try {
    let scale = Math.min(
      1,
      MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height),
    );

    for (let attempt = 0; attempt < 8; attempt += 1) {
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Unable to process the captured photo.");
      }

      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.88, 0.76, 0.64, 0.52]) {
        const jpeg = await canvasToJpeg(canvas, quality);
        if (jpeg.size <= MAX_IMAGE_BYTES) {
          const baseName = file.name.replace(/\.[^.]+$/, "") || "captured-photo";
          return new File([jpeg], `${baseName}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
        }
      }

      scale *= 0.75;
    }
  } finally {
    bitmap.close();
  }

  throw new Error(`${file.name}: the captured photo could not be reduced below 5 MB.`);
}
