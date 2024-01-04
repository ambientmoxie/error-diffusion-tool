function index(x, y, w) {
  return (x + y * w) * 4;
}

function distributeError(dithIndex, errR, errG, errB, factor, img) {
  let cR = img.pixels[dithIndex];
  let cG = img.pixels[dithIndex + 1];
  let cB = img.pixels[dithIndex + 2];

  img.pixels[dithIndex] = cR + errR * factor;
  img.pixels[dithIndex + 1] = cG + errG * factor;
  img.pixels[dithIndex + 2] = cB + errB * factor;
}

function returnErr(oldR, newR, oldG, newG, oldB, newB) {
  let err = {
    R: oldR - newR,
    G: oldG - newG,
    B: oldB - newB,
  };
  return err;
}

export default function floydSteinbergDithering(p, img) {
  img.loadPixels();

  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const idx = index(x, y, img.width);

      let oldR = img.pixels[idx];
      let oldG = img.pixels[idx + 1];
      let oldB = img.pixels[idx + 2];

      const factor = 1;
      let newR = p.round((factor * oldR) / 255) * (255 / factor);
      let newG = p.round((factor * oldG) / 255) * (255 / factor);
      let newB = p.round((factor * oldB) / 255) * (255 / factor);

      img.pixels[idx] = newR;
      img.pixels[idx + 1] = newG;
      img.pixels[idx + 2] = newB;

      let err = returnErr(oldR, newR, oldG, newG, oldB, newB);

      distributeError(
        index(x + 1, y, img.width),
        err.R,
        err.G,
        err.B,
        7 / 16,
        img
      );
      distributeError(
        index(x - 1, y + 1, img.width),
        err.R,
        err.G,
        err.B,
        3 / 16,
        img
      );
      distributeError(
        index(x, y + 1, img.width),
        err.R,
        err.G,
        err.B,
        5 / 16,
        img
      );
      distributeError(
        index(x + 1, y + 1, img.width),
        err.R,
        err.G,
        err.B,
        1 / 16,
        img
      );
    }
  }

  img.updatePixels();
}


