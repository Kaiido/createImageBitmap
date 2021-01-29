// the properties we look for
// the ones that aren't real property names are prefixed with a _
// they are separated in two lists
// so we can perform synchronous and async tests separately
const synchronous_polyfills = [
  "_imageBitmapOptions",
  "resizeWidth",
  "resizeHeight",
  "resizeQuality",
  "imageOrientation"
]
const asynchronous_polyfills = [
  "_Blob",
  "_ImageData",
  "_SVGBlob",
  "_SVGImageElement",
];
// imageBitmapOptions properties we know of,
// we don't necessarily have a polyfill for all of these
// we still test them anyway
const known_properties = [
  "resizeWidth",
  "resizeHeight",
  "resizeQuality",
  "imageOrientation",
  "premultiplyAlpha",
  "colorSpaceConversion"
];
// https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#imagebitmap
const enums = {
  ResizeQuality: [ "pixelated", "low", "medium", "high" ],
  ImageOrientation: [ "none", "flipY" ]
};

const error_messages = {
  COMMON_HEADER:  "Failed to execute 'createImageBitmap': ",
  INVALID_STATE_IMAGE: "Provided image was in an invalid state.",
  ARGUMENT_COUNT_1: "At least one argument is required.",
  ARGUMENT_COUNT_N: "%s is not a valid argument count for any overload",
  CROP_RECT_ZERO: "The crop rect width passed to createImageBitmap must be nonzero",
  ALLOCATION_FAILED: "The ImageBitmap could not be allocated.",
  INVALID_SOURCE: "Argument 1 could not be converted to any of: HTMLImageElement, " + 
    "SVGImageElement, HTMLCanvasElement, HTMLVideoElement, ImageBitmap, Blob, " +
    "CanvasRenderingContext2D, ImageData.",
  ENUM: "'%v' is not a valid value for enumeration %e",
  ALLOCATION: "The ImageBitmap couldn't be allocated."
}

const canvas_sources = [
  "HTMLImageElement",
  "SVGImageElement",
  "HTMLVideoElement",
  "HTMLCanvasElement",
  "OffscreenCanvas",
  "ImageBitmap"
];

const SVG_MIME = "image/svg+xml";
const SVG_NS = "http://www.w3.org/2000/svg";
const XLINK_NS = "http://www.w3.org/1999/xlink";
const GIF_URL = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export {
  synchronous_polyfills,
  asynchronous_polyfills,
  enums,
  known_properties,
  error_messages,
  canvas_sources,
  SVG_MIME,
  SVG_NS,
  XLINK_NS,
  GIF_URL
};
