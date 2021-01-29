import { XLINK_NS, error_messages } from "./constants.js";
import { checkUsability } from "./check-usability.js";
function loadImage( url ) {
  const img = new Image();
  img.src = url;
  return new Promise( (resolve, reject) => {
    img.onload = (evt) => {
      // might be broken
      checkUsability( img );
      resolve( img );
    };
    img.onerror = (evt) => {
      const error = new DOMException(
        error_messages.INVALID_STATE_IMAGE,
        "InvalidStateError"
      );
      reject( error );
    };
  } );
}
function loadSVGImage( elem ) {
  const url = elem.getAttribute( "href" ) || elem.getAttributeNS( XLINK_NS, "href" );
  return loadImage( url );
}

export { loadImage, loadSVGImage };
