export type ImageSource = HTMLImageElement | string | File | Blob;

function loadImage(src: ImageSource): Promise<HTMLImageElement> {
  if (src instanceof HTMLImageElement) {
    return Promise.resolve(src);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    let objectUrl: string | undefined;

    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };

    img.onload = () => {
      cleanup();
      resolve(img);
    };

    img.onerror = (e) => {
      cleanup();
      reject(
        new Error(
          `Failed to load image: ${typeof e === "string" ? e : "Unknown error"}`,
        ),
      );
    };

    if (typeof src === "string") {
      img.src = src;
    } else {
      objectUrl = URL.createObjectURL(src);
      img.src = objectUrl;
    }
  });
}

export async function cropTransparentAny(
  source: ImageSource,
  alphaThreshold = 0,
): Promise<HTMLCanvasElement | null> {
  const img = await loadImage(source);
  return cropTransparent(img, alphaThreshold);
}

export function cropTransparent(
  img: HTMLImageElement,
  alphaThreshold = 0,
): HTMLCanvasElement | null {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;

  const ctx = document
    .createElement("canvas")
    .getContext("2d", { willReadFrequently: true });

  if (!ctx) return null;

  ctx.canvas.width = w;
  ctx.canvas.height = h;
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;

  let minX = w,
    minY = h,
    maxX = -1,
    maxY = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;

  const outCtx = document.createElement("canvas").getContext("2d");
  if (!outCtx) return null;
  outCtx.canvas.width = cw;
  outCtx.canvas.height = ch;

  outCtx.drawImage(ctx.canvas, minX, minY, cw, ch, 0, 0, cw, ch);

  return outCtx.canvas;
}
