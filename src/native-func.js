const native_func = globalThis.createImageBitmap;
const nativeCreateImageBitmap = native_func ?
  (...args) => native_func.call( globalThis, ...args ) : false;

export { nativeCreateImageBitmap };
