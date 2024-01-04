import "../scss/style.scss";
import p5 from "p5";
import floydSteinbergDithering from "./modules/filter";
import { Pane } from "tweakpane";

// ----------------
// VARIABLES
// ----------------

// Basic setup
const size = 700;
const border = 20;

// Image related
let img;
let ratio;
let output;
let dropImg;
let seedImage;
let newImageDropped;
let posX, posY, dropWidth, dropHeight;

// Graphic containers
let main, buffer;

// Parameters
const PARAMS = {
  color: false,
  factor: 2, // between 1 and 10.
};

// ----------------
// IMAGE DROP RATIO
// ----------------

// Determine if the image is landscape or portrait. Return width, height, and position accordingly.

function imageDropRatio(img) {
  if (img.width < img.height) {
    ratio = img.width / img.height;
    dropWidth = main.width * ratio;
    dropHeight = main.height;
    posX = (main.width - dropWidth) / 2;
    posY = 0;
  } else {
    ratio = img.height / img.width;
    dropWidth = main.width;
    dropHeight = main.height * ratio;
    posX = 0;
    posY = (main.height - dropHeight) / 2;
  }
}

const tool = (p) => {
  // -----
  // SETUP
  // -----

  // Create basic canvas
  // Handle drop

  p.setup = () => {
    // Basic setup
    let canvas = p.createCanvas(size, size);
    canvas.id("dithered");
    p.background(255);

    // Handle dropped files
    canvas.drop(gotFile);

    // Setup maingraphic to receive the futur preview image
    main = p.createGraphics(size, size);
    main.noSmooth();

    // Set tweak pane
    setControllers();
  };

  // ------------------------
  // HANDLE THE DROPPED FILES
  // ------------------------

  function gotFile(file) {
    dropImg = p.createImg(file.data, "").hide();
    newImageDropped = true;
  }

  // -------------------
  // PROCESS AND DISPLAY
  // -------------------

  // Rescale the image, apply the filter,
  // display a preview, and prepare a dithered version at the original resolution for download.

  function processAndDisplay() {
    if (seedImage) {
      // Clone the image to always work with a clean seed
      // Resize source image in order to have consitent dithering across the sources
      // Create new buffer at orignal image size but don't display it
      img = seedImage.get();
      img.width > img.height ? img.resize(1920, 0) : img.resize(1080, 0);
      buffer = p.createGraphics(img.width, img.height);

      // Resize the image
      // Decide if it's black and white
      // Apply the filter
      img.resize(img.width / PARAMS.factor, img.height / PARAMS.factor);
      !PARAMS.color ? img.filter(p.GRAY) : "";
      floydSteinbergDithering(p, img);

      // Redraw the dithered image to download a clean version, without artefact
      // Apply the new image on the buffer
      upSampleImage(img, PARAMS.factor);
      buffer.pixelDensity(2);
      buffer.noSmooth();
      buffer.image(output, 0, 0);

      // Display the (now) dithered image on the canvas for preview
      imageDropRatio(img);
      main.image(img, posX, posY, dropWidth, dropHeight);
    }
  }

  // ---------------
  // UP SAMPLE IMAGE
  // ---------------

  // Resize the downsampled dithered image to its original dimensions by replicating the pixels from the downscaled version.
  // This function prevents artifacts during resizing.

  function upSampleImage(input, factor) {
    input.loadPixels();

    let w = input.width;
    let h = input.height;
    output = p.createImage(w * factor, h * factor);
    output.loadPixels();

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        // Find the original pixel's index
        let indexIn = (x + y * w) * 4;

        // Copy this color into a larger area on the output image
        for (let dy = 0; dy < factor; dy++) {
          for (let dx = 0; dx < factor; dx++) {
            let indexOut =
              (x * factor + dx + (y * factor + dy) * w * factor) * 4;
            output.pixels[indexOut] = input.pixels[indexIn];
            output.pixels[indexOut + 1] = input.pixels[indexIn + 1];
            output.pixels[indexOut + 2] = input.pixels[indexIn + 2];
            output.pixels[indexOut + 3] = input.pixels[indexIn + 3];
          }
        }
      }
    }

    output.updatePixels();
    return output;
  }

  // ---------------
  // SETUP TWEAKPANE
  // ---------------

  // Call the processAndDisplay() function when a change occurs.

  function setControllers() {
    const pane = new Pane();

    pane
      .addBinding(PARAMS, "factor", {
        min: 1,
        max: 60,
        step: 1,
        label: "Scale",
      })
      .on("change", () => {
        console.log(PARAMS.factor);
        processAndDisplay();
      });

    pane
      .addBinding(PARAMS, "color", {
        label: "Color",
      })
      .on("change", () => {
        processAndDisplay();
      });

    pane
      .addButton({
        title: "Download",
      })
      .on("click", () => {
        p.save(buffer, "buffer_output.png");
      });
  }

  // ----
  // DRAW
  // ----

  // For every frame:
  // Check if an image has been dropped.
  // If an image is found, load it, store it in the seedImage variable for future use, and apply Floyd-Steinberg dithering.
  // Display the newly dithered image on the canvas as a preview.

  p.draw = () => {
    if (newImageDropped) {
      newImageDropped = false;

      p.loadImage(dropImg.elt.src, (loadedImage) => {
        main.background(255);
        seedImage = loadedImage;
        processAndDisplay();
      });
    }

    p.image(main, border / 2, border / 2, size - border, size - border);
  };
};

new p5(tool);
