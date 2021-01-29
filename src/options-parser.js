import { convertToLong, enforceRangeLong } from "./misc.js";
import { enums, error_messages } from "./constants.js";

const common_error_header = error_messages.COMMON_HEADER;

function testEnum( options, property, enum_name ) {
  const enum_list = enums[ enum_name ];
  const value = options[ property ];
  if( value !== undefined && !enum_list.includes( value ) ) {
    const error_msg = error_messages.ENUM
      .replace( "%v", value )
      .replace( "%e", enum_name );
    throw new TypeError( error_msg );
  }
}
function parseOptions( source, ...args ) {

  let [ sx, sy, sw, sh ] = args.map( convertToLong );
  let cropRect; // optional  
  const options = (args.length === 1 ? args[ 0 ] : args[ 4 ]) || {};

  const resizeWidth = ("resizeWidth" in options) &&
    enforceRangeLong( options.resizeWidth );
  const resizeHeight = ("resizeHeight" in options) &&
    enforceRangeLong( options.resizeHeight );

  testEnum( options, "resizeQuality", "ResizeQuality" );
  testEnum( options, "imageOrientation", "ImageOrientation" );

  const arguments_count = arguments.length;

  if( !arguments_count ) {
    throw new TypeError( common_error_header + error_messages.ARGUMENT_COUNT_1 );
  }
  if( arguments_count > 2 && arguments_count < 5 ) {
    const error_count_msg = error_messages.ARGUMENT_COUNT_N.replace( "%s", arguments_count );
    throw new TypeError( common_error_header + err_count_msg );
  }
  if( arguments_count >= 5 ) { // 'sw' and 'sh' are defined
    if( !sw || !sh ) { // convertToLong converts invalid longs to NaN
      throw new RangeError( common_error_header + error_messages.CROP_RECT_ZERO );
    }
    // invalid sx and sy are treated as 0
    sx = sx || 0;
    sy = sy || 0;
    cropRect = { sx, sy, sw, sh };
  }
  if( resizeWidth === 0 || resizeHeight === 0 ) {
    const message = common_error_header + error_messages.ALLOCATION_FAILED;
    throw new DOMException( message, "InvalidStateError" );
  }

  return {
    cropRect,
    ...options
  };

}
function cleanArguments( missing_features, ...args ) {
  const number_of_arguments = args.length;
  if(
    missing_features.has( "_imageBitmapOptions" ) &&
    [ 2, 6 ].includes( number_of_arguments )
  ) {
    return args.slice( 0, number_of_arguments - 1 );
  }
  return args;
}

export { parseOptions, cleanArguments };
