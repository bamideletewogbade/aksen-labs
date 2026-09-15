import { PNG } from 'pngjs';

/**
 * Crops the flat border an image model paints inside the frame.
 *
 * gemini-2.5-flash-image letterboxes. Asked for 9:16 it returns a 9:16 file with
 * black bars painted across the top and bottom of the picture, about a sixth of
 * the height each, plus thinner bars down the sides. The prompt says no border,
 * no letterbox, no vignette, and it does it anyway, run after run. That is a
 * property of the model, not a bad prompt, so arguing with it in words is the
 * wrong layer to fix it at.
 *
 * Overscanning in the composition was the first attempt and it is the wrong
 * trade: pushing a sixteen per cent bar out of frame means scaling the picture
 * by a quarter and throwing away the parts of it somebody paid to generate.
 *
 * So the bars are measured and cut here, once, at generation time. What lands in
 * public/generated is the picture with no bars, and every composition that uses
 * it can assume a clean edge.
 *
 * Deliberately conservative. It only cuts rows that are genuinely flat and
 * genuinely dark or genuinely white, it stops at the first row that is not, and
 * it refuses to cut more than a third from any side. A picture that legitimately
 * opens on a black sky should lose nothing, and the worst case is that it
 * returns the image untouched.
 */

/** How far two pixels can differ and still count as the same flat colour. */
const FLATNESS = 10;
/** A bar is either near-black or near-white. Mid greys are picture. */
const isBarColour = (r, g, b) =>
  (r < 26 && g < 26 && b < 26) || (r > 232 && g > 232 && b > 232);

function rowIsBar(png, y) {
  const first = (y * png.width) << 2;
  const r0 = png.data[first];
  const g0 = png.data[first + 1];
  const b0 = png.data[first + 2];
  if (!isBarColour(r0, g0, b0)) return false;
  for (let x = 1; x < png.width; x++) {
    const i = ((y * png.width + x) << 2);
    if (
      Math.abs(png.data[i] - r0) > FLATNESS ||
      Math.abs(png.data[i + 1] - g0) > FLATNESS ||
      Math.abs(png.data[i + 2] - b0) > FLATNESS
    )
      return false;
  }
  return true;
}

function columnIsBar(png, x) {
  const first = x << 2;
  const r0 = png.data[first];
  const g0 = png.data[first + 1];
  const b0 = png.data[first + 2];
  if (!isBarColour(r0, g0, b0)) return false;
  for (let y = 1; y < png.height; y++) {
    const i = ((y * png.width + x) << 2);
    if (
      Math.abs(png.data[i] - r0) > FLATNESS ||
      Math.abs(png.data[i + 1] - g0) > FLATNESS ||
      Math.abs(png.data[i + 2] - b0) > FLATNESS
    )
      return false;
  }
  return true;
}

/**
 * @param {Buffer} buffer a PNG
 * @returns {{ buffer: Buffer, trimmed: null | {top:number,bottom:number,left:number,right:number} }}
 */
export function trimBorders(buffer) {
  let png;
  try {
    png = PNG.sync.read(buffer);
  } catch {
    // Not a PNG, or one this cannot read. The picture is still fine; it just
    // does not get trimmed.
    return { buffer, trimmed: null };
  }

  const maxV = Math.floor(png.height / 3);
  const maxH = Math.floor(png.width / 3);

  let top = 0;
  while (top < maxV && rowIsBar(png, top)) top++;
  let bottom = 0;
  while (bottom < maxV && rowIsBar(png, png.height - 1 - bottom)) bottom++;
  let left = 0;
  while (left < maxH && columnIsBar(png, left)) left++;
  let right = 0;
  while (right < maxH && columnIsBar(png, png.width - 1 - right)) right++;

  if (!top && !bottom && !left && !right) return { buffer, trimmed: null };

  const width = png.width - left - right;
  const height = png.height - top - bottom;
  // A trim that would leave a sliver means the detector has misread a picture
  // that happens to be very flat. Better to ship the original.
  if (width < png.width * 0.4 || height < png.height * 0.4)
    return { buffer, trimmed: null };

  const out = new PNG({ width, height });
  PNG.bitblt(png, out, left, top, width, height, 0, 0);
  return {
    buffer: PNG.sync.write(out),
    trimmed: { top, bottom, left, right },
  };
}
