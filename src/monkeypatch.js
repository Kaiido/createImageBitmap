import {
  requiresPolyfill,
  requiresAsyncTests,
  tests_results,
  async_tests
} from "./test-support.js";
import { checkUsability, invalidStateImageError } from "./check-usability.js";
import { parseOptions, cleanArguments } from "./options-parser.js";
import { nativeCreateImageBitmap } from "./native-func.js";
import { canvas_sources, error_messages } from "./constants.js";
import { loadImage, loadSVGImage } from "./image-loaders.js";
import { cropImage, cropBlobImage, cropImageData } from "./image-cropper.js";
import { convertToImageBitmap, ImageBitmapPolyfill } from "./ImageBitmap-wrapper.js";
import { isDetachedBuffer, buildSourceIs } from "./misc.js";

if( !nativeCreateImageBitmap ) {
  globalThis.ImageBitmap = ImageBitmapPolyfill;
}

// https://html.spec.whatwg.org/multipage/imagebitmap-and-animations.html#dom-createimagebitmap
globalThis.createImageBitmap = async function( source, ...args ) { // length 1

  const options = parseOptions( ...arguments );

  // with some sources (canvas & video) we need to stay synchronous until
  // the source's buffer gets painted
  // but some tests are async (e.g SVGImageElement)
  // so we only await for these tests when we are sure they are required
  const missing_features = requiresAsyncTests( source, options ) ?
    await async_tests : tests_results;

  // full compat
  if( missing_features.size === 0 ) {
    return nativeCreateImageBitmap( ...arguments );
  }

  // polyfill is not required, but some features may not be supported
  if(
    nativeCreateImageBitmap &&
    !requiresPolyfill( missing_features, options, source )
  ) {
    return nativeCreateImageBitmap( ...cleanArguments( missing_features, ...arguments ) );
  }

  const sourceIs = buildSourceIs( source );

  let cropped_image;
  if( canvas_sources.some( sourceIs ) ) {
    
    const is_usable = checkUsability( source );

    // checkUsability failed to determine if source is usable,
    // as of this writing, this only concerns SVGImageElement
    // and since we do convert SVGImageElements anyway right after
    // we don't have much to do now
    if( is_usable === "maybe" ) {
      // might want to do something someday.
    }

    // SVGImageElement have a very poor API to work with
    // (e.g no intrinsic dimension is exposed)
    // so we convert these to HTMLImageElement
    // must be called after 'checkUsability' for we correctly throw with unusable media
    // (that is, for UAs that do support SVGImageElement as CanvasSource)
    if( sourceIs( "SVGImageElement" ) ) {
      source = await loadSVGImage( source );
    }
    
    if( sourceIs( "HTMLImageElement" ) ) {
      // Since we can't detect true "image has no dimensions" (see test-support.js)
      // we unfortunately can't fall here...
      // so while per specs this should work, it's just dead code...
      if(
        (!source.naturalWidth && !source.naturalHeight) &&
        (!options.resizeWidth || !options.resizeHeight)
      ) {
        invalidStateImageError()
      }
      
    }
    cropped_image = cropImage( source, options );

  }
  else if( sourceIs( "Blob" ) ) {
    cropped_image = await cropBlobImage( source, options );
  }
  else if( sourceIs( "ImageData" ) ) {
    if( isDetachedBuffer( source.data.buffer ) ) {
      invalidStateImageError();
    }
    cropped_image = await cropImageData( source, options );
  }
  if( !cropped_image ) {
    throw new TypeError( error_messages.INVALID_SOURCE );
  }

  return await convertToImageBitmap( cropped_image );

};

globalThis.createImageBitmap._original = nativeCreateImageBitmap;