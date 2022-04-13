import {
  known_properties,
  synchronous_polyfills,
  asynchronous_polyfills,
  SVG_MIME,
  SVG_NS,
  GIF_URL
} from "./constants.js";
import { checkUsability } from "./check-usability.js";
import { nativeCreateImageBitmap } from "./native-func.js";
import { createImageData, blobCanBeSVG, buildSourceIs } from "./misc.js";

// to avoid having the grabbing of the source's buffer delayed
// we try to return the results of the tests synchronously when possible.
// for this matter, we update a single list of results.
let async_tests_are_done = false;

// some tests can be performed synchronously
// we initiate our Set with these directly
const tests_results = performSynchronousTests();
const async_tests = performAsynchronousTests()

function performSynchronousTests() {
  // nothing to test...
  if( !nativeCreateImageBitmap ) {
    const all_polyfills = synchronous_polyfills.concat( asynchronous_polyfills );
    return new Set( all_polyfills );
  }
  const synchronous_tests = [ testOptionsBag() ];
  const supported_features = new Set( synchronous_tests.flat() );
  const required_polyfills = synchronous_polyfills
    .filter( (type) => !supported_features.has( type ) );

  return new Set( required_polyfills );
}
async function performAsynchronousTests() {

  // nothing to test...
  if( !nativeCreateImageBitmap ) {
    async_tests_are_done = true;
    return tests_results;
  }

  const asynchronous_tests = [
    testBitmapBlobSource(),
    testImageDataSource(),
    testSVGBlobSource(),
    testSVGImageElementSource()
  ];

  const results = await Promise.all( asynchronous_tests );
  const supported_features = new Set( results.flat() );

  const required_polyfills = asynchronous_polyfills
    .filter( (type) => !supported_features.has( type ) );  

  required_polyfills.forEach( (prop) => tests_results.add( prop ) );

  async_tests_are_done = true;

  return tests_results;

}

function testOptionsBag() {

  const out = [];
  const tester = {};
  const addTestProperty = ( prop ) => {
    Object.defineProperty( tester, prop , { get(){ out.push( prop ) } } );
  };
  known_properties.forEach( addTestProperty );

  nativeCreateImageBitmap( new ImageData(1,1), tester )
      .then( (img) => img.close() )
      .catch( () => {} );

  // some implementations will throw in the Promise
  // if the option bag is passed
  // to avoid doing it ourselves when calling the native method
  // we need to mark its support here
  // however since we need this method to be synchronous
  // we can't wait for the Promise to reject
  // so we assume any implementation supporting the options bag
  // will support at least one of the currently known options
  if( out.length ) {
    out.push( "_imageBitmapOptions" );
  }

  return out;

}
async function testBitmapBlobSource() {

  const out = [];
  const blob = await fetch( GIF_URL )
    .then( resp => resp.ok && resp.blob() );

  try {
    const img = await nativeCreateImageBitmap( blob );
    if( img.width === 1 ) {
      out.push( "_Blob" );
    }
  }
  catch( err ) {

  }  

  return out;

}
async function testImageDataSource() {

  const out = [];
  const image = createImageData( 1, 1 );

  try {
    const img = await nativeCreateImageBitmap( image );
    if( img.width === 1 ) {
      out.push( "_ImageData" );
    }
  }
  catch( err ) {

  }  

  return out;  

}
async function testSVGBlobSource() {

  const out = [];
  const svg_markup = `<svg width="1" height="1" xmlns="${ SVG_NS }">
      <rect width="1" height="1"/>
    </svg>`;
  const svg_blob = new Blob( [ svg_markup ], { type: SVG_MIME } );

  try {
    const img = await nativeCreateImageBitmap( svg_blob );
    if( img.width === 1 ) {
      out.push( '_SVGBlob' );
    }
  }
  catch( err ) {

  }

  return out;

}
async function testSVGImageElementSource() {

  const out = [];  
  if( !("SVGImageElement" in globalThis) ) { // Worker
    return out; 
  }

  const wait = (time) => new Promise( res => setTimeout( res, time ) );

  const img = document.createElementNS( SVG_NS, 'image' );
  img.setAttributeNS( 'http://www.w3.org/1999/xlink', 'xlink:href', GIF_URL );

  const imgIsNotAvailable = () => {
    try {
      checkUsability( img );
      return false;
    }
    catch( err ) {
      return true;
    }
  };

  let retries = 0;
  do {
    await wait( 10 );
  }
  while( imgIsNotAvailable() && (++retries < 300) );

  try {
    const bmp = await nativeCreateImageBitmap( img );
    out.push( "_SVGImageElement" );
  }
  catch( err ) {

  }

  return out;
        
}

function requiresPolyfill( missing_features, options, source ) {

  const sourceIs = buildSourceIs( source );

  if( sourceIs( "Blob" ) ) {
    if( missing_features.has( "_Blob" ) ) {
      return true;
    }
    const is_svg_blob = blobCanBeSVG( source );
    if( is_svg_blob && missing_features.has( "_SVGBlob" ) ) {
      return true;
    }  
  }
  if(
    sourceIs( "ImageData" ) &&
    missing_features.has( "_ImageData" )
  ) {
    return true;
  }
  if(
    sourceIs( "SVGImageElement" ) &&
    missing_features.has( "_SVGImageElement" )
  ) {
    return true;
  }
  if(
    Object.keys( options )
      .some( (key) => missing_features.has( key ) )
  ) {
    return true;
  }

  return false;

}

function requiresAsyncTests( source, options ) {
  if( async_tests_are_done ) {
    return false;
  }
  // async tests are currently all for different types of source
  // so we can currently only check for these types
  const sourceIs = buildSourceIs( source );
  const types_requiring_async_tests = [
    "Blob",
    "ImageData",
    "SVGImageElement"
  ];
  return types_requiring_async_tests.some( sourceIs );
}

export {
  requiresPolyfill,
  requiresAsyncTests,
  tests_results,
  async_tests
};
