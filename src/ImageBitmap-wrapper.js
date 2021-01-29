import { cropImage } from "./image-cropper.js";
import { nativeCreateImageBitmap } from "./native-func.js";

const getCanvasProtoDesc = ( prop ) =>
  Object.getOwnPropertyDescriptor( HTMLCanvasElement.prototype, prop );

// we can't use the 'class' syntax here
// see https://esdiscuss.org/topic/classes-and-enumerability
function ImageBitmapPolyfill() {
  throw new TypeError( "Illegal Constructor" );
}
ImageBitmapPolyfill.prototype = Object.create( {
  close() {
    // there is no real way to "detach" a canvas's buffer
    // after a drawing context has been created.
    // the closest is to set its width and height to 0
    const width_setter = getCanvasProtoDesc( "width" ).set;
    width_setter.call( this, 0);
    const height_setter = getCanvasProtoDesc( "height" ).set;
    height_setter.call( this, 0 );  
  },
  get width() {
    const canvas_getter = getCanvasProtoDesc( "width" ).get;
    return canvas_getter.call( this );
  },
  get height() {
    const canvas_getter = getCanvasProtoDesc( "height" ).get;
    return canvas_getter.call( this );  
  },
  get [ Symbol.toStringTag ]() {
    return "ImageBitmap";
  }
} );

function customWrapper( source ) {
  if( !(source instanceof HTMLCanvasElement) ) {
    source = cropImage( source );
  }
  Object.setPrototypeOf( source, ImageBitmapPolyfill.prototype );
  return source;
}

function convertToImageBitmap( source ) {
  if( (source instanceof globalThis.ImageBitmap) ) {
    return source;
  }
  if( nativeCreateImageBitmap ) {
    return nativeCreateImageBitmap( source );
  }
  return customWrapper( source );
}

export { convertToImageBitmap, ImageBitmapPolyfill };
