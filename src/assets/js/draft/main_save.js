import "../scss/style.scss";
import p5 from "p5";
import floydSteinbergDithering from "../modules/filter";
import { Pane } from "tweakpane";

// Setup variables
const size = 700;
const border = 20;
let img;
let dropImg;
let seedImage;

// Drop variables
let ratio;
let newImageDropped;
let posX, posY, dropWidth, dropHeight;

// Graphic containers
let main, buffer, bufferDisplayed;

// Handle the image drop placement and size
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
  p.setup = () => {
    // Setup basic canvas
    let canvas = p.createCanvas(size, size);
    canvas.id("dithered");
    p.background(255);

    // Drop file handler
    canvas.drop((file) => {
      dropImg = p.createImg(file.data, "").hide(); // https://p5js.org/reference/#/p5.Element/drop
      newImageDropped = true;
    });

    // Setup mainraphic
    main = p.createGraphics(size, size);
    // main.background(255, 0, 0);
    main.noSmooth();
  };

  function processAndDisplay() {
    if (seedImage) {
      // Clone the image
      img = seedImage.get();
      // Populate variables depending on the orientation
      imageDropRatio(img);
      // Create a new buffer at original image size
      buffer = p.createGraphics(img.width, img.height);
      bufferDisplayed = p.createGraphics(img.width, img.height);

      // Set the buffer to not smooth out the image when resizing or displaying
      buffer.noSmooth();

      // Apply grayscale filter if the flag is set
      if (PARAMS.isBlackAndWhite) {
        img.filter(p.GRAY);
      }

      // Apply floyd steinberg dithering filter to the buffer
      floydSteinbergDithering(p, img);

      // Draw the image onto the buffer at its original size
      buffer.image(img, 0, 0);
      bufferDisplayed.image(
        img,
        0,
        0,
        img.width / PARAMS.factor,
        img.height / PARAMS.factor
      );

      // Now, instead of resizing the buffer, create a new p5.Graphics
      // object that is a scaled-up version of the buffer.
      main = p.createGraphics(size, size);
      // main.noSmooth();
      main.image(buffer, posX, posY, dropWidth, dropHeight);
    }
  }

  // Tweakpane
  const PARAMS = {
    isBlackAndWhite: false,
    factor: 0.3, // between 1 and 10.
  };

  const pane = new Pane();

  pane
    .addBinding(PARAMS, "factor", {
      min: 0.1,
      max: 1,
      step: 0.1,
      label: "Scaling",
    })
    .on("change", () => {
      console.log(PARAMS.factor);
      processAndDisplay();
    });

  pane
    .addBinding(PARAMS, "isBlackAndWhite", {
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

  p.draw = () => {
    // If new image drop
    if (newImageDropped) {
      // Turn var to false avoid new loop
      newImageDropped = false;

      p.loadImage(dropImg.elt.src, (loadedImage) => {
        // Remove previous image
        main.background(255, 0, 0);
        // Load the image
        // img = loadedImage;
        seedImage = loadedImage; // Store the original image
        processAndDisplay();
      });
    }

    // Redraw mainraphic every frame
    p.image(main, border / 2, border / 2, size - border, size - border);
  };
};

export default tool;

new p5(tool);
