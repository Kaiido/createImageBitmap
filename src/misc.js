import { error_messages } from "./constants.js";

// we could be lazy an just check for length 0,
// which would probably be enough in 99% of the case
// but we won't call it many times anyway,
// so better be precise
function isDetachedBuffer( buffer ) {
  try {
    buffer.slice( 0,0 );
    return false;
  }
  catch( err ) { return true; }
}

// https://heycam.github.io/webidl/#idl-long
const long_tester = new Int32Array( 1 );
function convertToLong( value ) {
  if( !Number.isFinite( value ) ) {
    return NaN;
  }
  long_tester[ 0 ] = value;
  return long_tester[ 0 ];
}
// https://heycam.github.io/webidl/#EnforceRange
function enforceRangeLong( value ) {
  const as_long = convertToLong( value );
  if( isNaN( as_long ) ) {
    throw new TypeError( "Invalid long value" );
  }
  return as_long;
}
// we can be quite strict here
// because to load it in a <img>,
// the type must be set to this value
function blobCanBeSVG( blob ) {
  return blob?.type === "image/svg+xml";
}

function get2dContext( width, height ) {
  const canvas = Object.assign( document.createElement( "canvas" ), { width, height } );
  const ctx = canvas.getContext( "2d" );
  // not yet in the specs
  // https://github.com/whatwg/html/issues/3323
  if(
    width && height && // 0 width and height should not throw here
    !contextIsCorrectlyAllocated( ctx )
  ) {
    throw new DOMException( error_messages.ALLOCATION, "InvalidStateError" );
  }
  return ctx;
}

function contextIsCorrectlyAllocated( ctx ) {
  // https://github.com/fserb/canvas2D/blob/master/spec/context-loss.md
  if( ctx.isContextLost ) {
    // weirdness in the API, 
    // we need to interact with the context for the status to change
    ctx.translate( 0, 0 );
    return !ctx.isContextLost();
  }
  // Chrome has a isContextLost method, but it seems to only work async...
  let allocated = false;
  // Firefox does throw if the context is lost when we call getImageData
  try {
    ctx.fillRect( 0, 0, 1, 1 );
    allocated = ctx.getImageData( 0, 0, 1, 1 ).data[ 3 ] !== 0;
  }
  finally {
    ctx.clearRect( 0, 0, 1, 1 );
    return allocated;
  }
}

// ImageData constructor may not be available
// fortunately we can fall back to ctx2D.createImageData
function createImageData( width, height ) {
  try {
    // low finger-print if available
    return new ImageData( width, height );
  }
  catch( err ) {
    const context = create2dContext( 0, 0 );
    return context.createImageData( width, height );
  }
}

// a helper to build a 'sourceIs' function
function buildSourceIs( source ) {
  return ( type ) => {
    const constructor = globalThis[ type ];
    return constructor && (source instanceof constructor);
  };
}

export {
  isDetachedBuffer,
  convertToLong,
  enforceRangeLong,
  blobCanBeSVG,
  get2dContext,
  createImageData,
  buildSourceIs
};
