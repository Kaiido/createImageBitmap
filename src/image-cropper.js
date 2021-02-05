import { nativeCreateImageBitmap } from "./native-func.js";
import { blobCanBeSVG, get2dContext, buildSourceIs } from "./misc.js";
import { loadImage } from "./image-loaders.js";
import { cleanArguments } from "./options-parser.js";

function getSourceDimensions( source ) {
  const sourceIs = buildSourceIs( source );
  if( sourceIs( "HTMLImageElement" ) ) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  else if( sourceIs( "HTMLVideoElement" ) ) {
    return { width: source.videoWidth, height: source.videoHeight };
  }
  else if( sourceIs( "SVGImageElement" ) ) {
    return { width: NaN, height: NaN };
  }
  else if(
    sourceIs( "HTMLCanvasElement" ) ||
    sourceIs( "OffscreenCanvas" ) ||
    sourceIs( "ImageBitmap" ) ||
    sourceIs( "ImageData" )
  ) {
    return source;
  }
  return { width: NaN, height: NaN };
}

function cropImage( source, options ) {

  // merge passed cropRect with resize and orientation options
  const safe_rect = getFinalCropRect( source, options );

  const { height } = getSourceDimensions( source );
  const { sx, sy, sw, sh, dx, dy, dw, dh, flipY, resizeQuality } = safe_rect;
  const out_ctx = get2dContext( safe_rect.width, safe_rect.height );
  const out_canvas = out_ctx.canvas;

  if( resizeQuality === "pixelated" ) {
    out_ctx.imageSmoothingEnabled = false;
  }
  else if( resizeQuality ) {
    // to do:  better image quality resizers
    out_ctx.imageSmoothingQuality = resizeQuality;
  }
  out_ctx.drawImage( source, sx, sy, sw, sh, dx, dy, dw, dh );

  if( flipY ) {
    out_ctx.globalCompositeOperation = "copy";
    out_ctx.setTransform( 1, 0, 0, -1, 0, out_canvas.height );
    out_ctx.drawImage( out_canvas, 0, 0 );
  }

  return out_canvas;

}


async function cropBlobImage( blob, options ) {

  const url = globalThis.URL.createObjectURL( blob );
  const img = await loadImage( url );
  globalThis.URL.revokeObjectURL( blob );

  return cropImage( img, options );

}
async function cropImageData( img, options ) {

  const {
    resizeWidth,
    resizeHeight,
    resizeQuality,
    imageOrientation
  } = options;
  const cropRect = options.cropRect || {};
  // beware, sw and sh can be negative
  const sx = cropRect.sx || 0;
  const sy = cropRect.sy || 0;
  const sw = cropRect.sw || img.width;
  const sh = cropRect.sh || img.height;
  const dx = sw < 0 ? (sw * -1) - sx : -sx;
  const dy = sh < 0 ? (sh * -1) - sy : -sy;
  const dw = Math.abs( sw );
  const dh = Math.abs( sh );

  const a_ctx = get2dContext( dw, dh )
  a_ctx.putImageData( img, dx, dy, sx, sy, sw, sh );

  const flipY = imageOrientation === "flipY";
  const should_redraw = resizeWidth || flipY;
  let out_ctx;

  if( resizeWidth ) {
    out_ctx = get2dContext( resizeWidth, resizeHeight );
    if( resizeQuality === "pixelated" ) {
      out_ctx.imageSmoothingEnabled = false;
    }
    else {
      out_ctx.imageSmoothingQuality = resizeQuality;
    }
  }
  else {
    out_ctx = a_ctx;
    a_ctx.globalCompositeOperation = "copy";
  }

  const a_canvas = a_ctx.canvas;
  const out_canvas = out_ctx.canvas;

  if( flipY ){
    out_ctx.setTransform( 1, 0, 0, -1, 0, out_canvas.height );
  }

  if( should_redraw ) {    
    out_ctx.drawImage( a_canvas,
      0, 0, a_canvas.width, a_canvas.height,
      0, 0, out_canvas.width, out_canvas.height
    );
  }

  return out_canvas;

}

function getFinalCropRect( source, options ) {

  const { width, height } = getSourceDimensions( source );
  const { resizeWidth, resizeHeight } = options;
  const crop_rect = options.cropRect ||
    { sx: 0, sy: 0, sw: width, sh: height };
  const dest_rect = {
    dx: 0,
    dy: 0,
    dw: resizeWidth || Math.abs( crop_rect.sw ), // resizeXXX must be non-zero
    dh: resizeHeight || Math.abs( crop_rect.sh )
  };

  const safe_rect = getSafeRect( width, height, crop_rect, dest_rect );
  safe_rect.resizeQuality = options.resizeQuality;
  safe_rect.flipY = options.imageOrientation === "flipY";
  safe_rect.width = dest_rect.dw;
  safe_rect.height = dest_rect.dh;

  return safe_rect;

}

function getSafeRect( width, height, { sx, sy, sw, sh }, { dx, dy, dw, dh } ) {
  // Safari doesn't support cropping outside of source's boundaries through drawImage
  // so we need to provide a "safe" rect
    
  if( sw < 0 ) {
    sx += sw;
    sw = Math.abs( sw );
  }
  if( sh < 0 ) {
    sy += sh;
    sh = Math.abs( sh );
  }
  if( dw < 0 ) {
    dx += dw;
    dw = Math.abs( dw );
  }
  if( dh < 0 ) {
    dy += dh;
    dh = Math.abs( dh );
  }
  const x1 = Math.max( sx, 0 );
  const x2 = Math.min( sx + sw, width );
  const y1 = Math.max( sy, 0 );
  const y2 = Math.min( sy + sh, height );
  const w_ratio = dw / sw;
  const h_ratio = dh / sh;

  return {
    sx: x1,
    sy: y1,
    sw: x2 - x1,
    sh: y2 - y1,
    dx: sx < 0 ? dx - (sx * w_ratio) : dx,
    dy: sy < 0 ? dy - (sy * h_ratio) : dy,
    dw: (x2 - x1) * w_ratio,
    dh: (y2 - y1) * h_ratio
  };

}

export {
  getSourceDimensions,
  cropImage,
  cropBlobImage,
  cropImageData
};
