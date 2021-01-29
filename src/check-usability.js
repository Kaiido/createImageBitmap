import { error_messages } from "./constants.js";
import { get2dContext, buildSourceIs } from "./misc.js";
import { getSourceDimensions } from "./image-cropper.js";

function invalidStateImageError() {
  const message = error_messages.COMMON_HEADER + error_messages.INVALID_STATE_IMAGE;
  throw new DOMException( message, "InvalidStateError" );
}
//
// https://html.spec.whatwg.org/multipage/canvas.html#check-the-usability-of-the-image-argument
//
function checkUsability( source ) {

  const sourceIs = buildSourceIs( source );

  // HTMLCanvasElement, and OffscreenCanvas are only invalid if their width or height is zero
  // ImageBitmap would be when detached, but detaching it will set its width and height to zero
  // so we can share their check
  if(
    sourceIs( "HTMLCanvasElement" ) ||
    sourceIs( "OffscreenCanvas" ) ||
    sourceIs( "ImageBitmap" )
  ) {

    if( source.width === 0 || source.height === 0 ) {
      invalidStateImageError();
    }

  }
  // there is no synchronous way to tell if an HTMLImageElement
  // is in a broken state, such an element could have a width and height
  // at the time we check it
  // HTMLImageElement::decode() could tell this asynchronously
  // but 1. we need a synchrounous method, 2. it's not available everywhere
  // and 3. it only concerns HTMLImageElement
  // SVGImageElements don't have any API letting us know (not even a width nor height)
  // HTMLVideoElements only have unreliable videoWidth and videoHeight
  // however, CanvasRenderingContext2d.createPattern is supposed to call this algorithm too
  // so we can (ab)use it, even though it works only in Firefox...
  // see https://wpt.fyi/results/html/canvas/element/fill-and-stroke-styles/2d.pattern.image.broken.html
  else if(
    sourceIs( "HTMLImageElement" ) ||
    sourceIs( "HTMLVideoElement" ) ||
    sourceIs( "SVGImageElement" )
  ) {

    // we can still start by checking the size, if 0 no need to go farther
    const { width, height } = getSourceDimensions( source );
    // look for strict equality, SVGImageElement returns NaN
    if( width === 0 || height === 0 ) {
      invalidStateImageError();
    }

    let failed = false;
    try {
      const pat = get2dContext( 0, 0 ).createPattern( source, "no-repeat" );
      failed = !pat;
    }
    catch( err ) {
      // Safari doesn't support drawing SVGImageElement on a canvas,
      // nor do they support creating a CanvasPattern from it
      // we thus return a "maybe" string to let the other side handle it as they wish
      return "maybe";
    }
    if( failed ) {
      invalidStateImageError();
    }

  }

  return true;

}

export { checkUsability, invalidStateImageError };
