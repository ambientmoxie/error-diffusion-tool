import ninaImage from "../images/nina.jpeg";
import { index, distributeError, returnErr } from "./modules/utils";
import { Pane } from "tweakpane";

const size = 512;

// Initial variables
let img,
  dropImg,
  s = "drop your image here in the grey area";
let imageNeedsUpdate = true;
let newImageDropped = false;
let originalImg;
let pg;

// FLOYD STEINBERG DITHERING
// --------------------------
// This function is executed once per frame. Use "noLoop()" in the setup() to halt the loop.

// Purpose of this function:
// (1) Load the pixels from the image initialized in the setup (the placeholder image visible upon page load).
// (2) Iterate over all the image pixels using the custom index function (found in utils.js).
// (3) Capture the red, green, and blue values of each pixel into separate variables.
// ----> Pixels are stored in a one-dimensional array: red is at position 0, green at position 1, and blue at position 2.
// (4) New variables are introduced to recalculate the value of each pixel. While the original values range between 0 and 255, the recalculated values can only be 0 or 255.
// (5) The image is reconstructed by substituting the old pixel values with the new ones.
// (6) The error between the old and new pixel values is computed, and the error is distributed among neighboring pixels.
// (7) The image's pixel data is updated, and the modified image is rendered on the canvas.

function processImage(p, PARAMS) {
  if (!PARAMS.colored) {
    img.filter(p.GRAY);
  }
  img.loadPixels(); // (1)

  // (2)
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const idx = index(x, y, img.width);

      // (3)
      let oldR = img.pixels[idx];
      let oldG = img.pixels[idx + 1];
      let oldB = img.pixels[idx + 2];

      // (4)
      const factor = 1;
      let newR = p.round((factor * oldR) / 255) * (255 / factor);
      let newG = p.round((factor * oldG) / 255) * (255 / factor);
      let newB = p.round((factor * oldB) / 255) * (255 / factor);

      // (5)
      img.pixels[idx] = newR;
      img.pixels[idx + 1] = newG;
      img.pixels[idx + 2] = newB;

      // (6)
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

  // (7)
  img.updatePixels();
  pg.image(img, 0, 0, size, size);
}

// Tweakpane setup
function setupPane(p, PARAMS) {
  const pane = new Pane();
  pane
    .addBinding(PARAMS, "scaleFactor", {
      min: 1,
      max: 100,
      step: 1,
      label: "Scaling",
    })
    .on("change", () => updateAndDisplay(p, PARAMS));

  pane
    .addBinding(PARAMS, "colored")
    .on("change", () => updateAndDisplay(p, PARAMS));
}

// Helper function to update the image and display it
function updateAndDisplay(p, PARAMS) {
  if (originalImg) {
    img = originalImg.get();
    img.resize(size / PARAMS.scaleFactor, size / PARAMS.scaleFactor);
    processImage(p, PARAMS);
    p.image(pg, size, 0);
  }
}

const floydSteinbergFilter = (p) => {
  const PARAMS = {
    scaleFactor: 1,
    colored: true,
  };

  setupPane(p, PARAMS);
  
  // (2*)
  p.preload = () => {
    // img = p.loadImage(ninaImage);
    originalImg = img = p.loadImage(ninaImage);
  };

  // (*)
  // function gotFile(file) {
  //   dropImg = p.createImg(file.data, "").hide();
  //   newImageDropped = true;
  // }


  // SETUP FUNCTION
  // --------------------------
  // Runs once at the beginning when the program starts

  // Purpose of this function:
  // (1) Create the main canvas and give it it's size
  // (2) Resize the image already loaded in the preload function (2*)
  // (*) Catch the dropped file
  // (3) Create a buffer to display the newly created image
  // (4) Display the dithered preloaded image on the buffer
  // (5) No smooth keep the pixel sharp after resizing the buffer

  p.setup = () => {
    // (1)
    const canvas = p.createCanvas(size * 2, size);
    p.background(200);
    canvas.drop(file => {
      dropImg = p.createImg(file.data, "").hide();
      newImageDropped = true;
    });
    // (3)
    pg = p.createGraphics(size, size);
    // (4)
    p.image(pg, size, 0);
    // (5)
    pg.noSmooth();

    p.text(s, 10, 10);
  };

  // DRAW FUNCTION
  // ----------------
  // This function is called once per frame. Call "noLoop()" in setup() to stop the loop.

  // Purpose of this function:
  // (1) Check if the image has been dropped
  // (*) False: process the placeholder image loaded in setup
  // (2) True: load the new image, reassigne the "img" variable and resize the image depending on the scale factor.
  // (3) Apply floyd steinberg dithering
  // (4) Display the new dithered image at size.

  // (↓) Download the graphic element (aka the new dithered image)

  p.draw = () => {
    // (1)
    if (newImageDropped) {
      p.loadImage(dropImg.elt.src, (loadedImage) => {
        originalImg = img = loadedImage;
        img.resize(size / PARAMS.scaleFactor, size / PARAMS.scaleFactor);
        processImage(p, PARAMS);
        newImageDropped = false; // Reset the flag
      });
    }
    if (imageNeedsUpdate) {
      processImage(p, PARAMS);
      imageNeedsUpdate = false;
    }

    p.image(pg, size, 0);
  };

  // (↓)
  p.keyPressed = () => {
    if (p.key === "s" || p.key === "S") {
      p.save(pg2, "buffer_output.png");
    }
  };
};

export default floydSteinbergFilter;
