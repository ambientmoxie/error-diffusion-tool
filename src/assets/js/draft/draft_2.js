import floydSteinbergDithering from "./modules/utils";

// Setup variables
const size = 512;
const border = 20;
let img;
let dropImg;

// Graphic parameters
const PARAMS = {
  isBlackAndWhite: true,
  factor: 0.5, // between 0 and 1.
};

// Resize image on drop variables
let ratio;
let newImageDropped;
let posX, posY, dropWidth, dropHeight;

// Graphic containers
let main, buffer;

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
    p.background(240);

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

  p.draw = () => {
    // If new image drop
    if (newImageDropped) {
      // Turn var to false avoid new loop
      newImageDropped = false;

      p.loadImage(dropImg.elt.src, (loadedImage) => {
        // Load the image
        img = loadedImage;
        // Populate variables depending on the orientation
        imageDropRatio(img);
        // Display image
        main.image(img, posX, posY, dropWidth, dropHeight);
        // Create new buffer at orignal image size but dont display it
        buffer = p.createGraphics(img.width, img.height);
        // Handle
        img.resize(img.width * PARAMS.factor, img.height * PARAMS.factor);
        // Refine the pixel
        buffer.noSmooth();
        // Color version or not
        PARAMS.isBlackAndWhite ? img.filter(p.GRAY) : "";
        // Apply floyd steinberg filter
        floydSteinbergDithering(p, img);
        // Draw image on the buffer;
        buffer.image(
          img,
          0,
          0,
          img.width / PARAMS.factor,
          img.height / PARAMS.factor
        );
        // Download the buffer
        p.save(buffer, "buffer_output.png");
      });
    }

    // Redraw mainraphic every frame
    p.image(main, border / 2, border / 2, size - border, size - border);
  };
};

export default tool;
