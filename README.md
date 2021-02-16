# createImageBitmap MonkeyPatch
 
### A monkey-patch to the HTML's [`createImageBitmap`][1] method.

Only Chromium based browsers currently support the full API, Firefox supporting it only partially and Safari not at all.
This means that for cross-browser projects, we can't use it, despite its great usefulness and ease of use.

This monkey-patch aims at filling as much gaps as possible between all these browsers.

However, truth be told, it can not polyfill everything in this API, here is a list of what it supports in every browsers and what it doesn't:

Feature                                   | ![Chromium based][2] | ![Firefox][3]         | ![Safari][4]
----------------------------------------- | -------------------- | --------------------- | ----------------
createImageBitmap + cropping              | native               | native                | ✔ <sup>(1)</sup>
HTMLImageElement as source                | native               | native                | ✔
HTMLCanvasElement as source               | native               | native                | ✔
OffscreenCanvas as source                 | native               | :x:                   | :x:
SVGImageElement as source                 | native               | native                | ✔
ImageBitmap as source                     | native               | native                | ✔
ImageData as source                       | native               | native                | ✔
Raster image in Blob as source            | native               | native                | ✔
SVG image in Blob as source <sup>(2)</sup>| ✔                    | ✔                     | ✔
ImageBitmapOptions                        | native               | ✔                     | ✔
resizeWidth & resizeHeight                | native               | ✔                     | ✔
resizeQuality: pixelated                  | native               | ✔                     | ✔
resizeQuality: low                        | native               | native                | ✔
resizeQuality: medium                     | native               | :x:                   | :x:
resizeQuality: high                       | native               | :x:                   | :x:
imageOrientation                          | native               | ✔                     | ✔
colorSpaceConversion                      | native               | :x:                   | :x:
premultiplyAlpha                          | native               | :x:                   | :x:
Available in Workers                      | native               | native <sup>(3)</sup> | :x:
Transferrable                             | native               | native                | :x:

<sup>(1) Returns a modified HTMLCanvasElement instance in place of an ImageBitmap object.</sup>  
<sup>(2) Only for SVG images with an intrinsic width and height, as per the specs recommendation.</sup>  
<sup>(3) Only the native implementation is available in Workers</sup>

### How to use

You can include the bundled version available in `/src/` in a &lt;script> tag before the first use of `createImageBitmap`,

```html
<script src="/path/to/the/script/createImageBitmap.js"></script>
```

or you can use the ESM modules available in `/src/`.

```html
<script type="module" src="/path/to/the/script/monkeypatch.js"></script>
```

### Why isn't the monkey-patch available in web Workers?

The monkey-patch makes most of its work on an HTMLCanvasElement 2d context, and relies in various places in the ability to have DOM Elements (for instance HTMLImageElements are used to load images from Blobs).
Since Web-Workers don't have access to the DOM nor any Elements, the scope of what this monkey-patch could do currently seems too limited to be worth the pain.

### Why isn't the monkey-patch available in node-js?

People at [node-canvas][2] probably are the best to implement such a thing.
It should take only a few tweaks from here to get a node-canvas + jsdom version working though, so feel free to fork this repo and propose them a PR if you wish.

### Why doesn't this monkey-patch add support for options like all resize qualities, *colorSpaceConversion* or *premultiplyAlpha**?

Mainly lack of time. We accept PR though ¯\_(ツ)_/¯

### Why no ImageBitmapRenderer at least?

Still lack of time, and a Safari weirdness where they do expose this interface, even though they don't have the `ImageBitmap` that goes with it, and which won't accept our "fake" version.
But hopefully, this will be one of the first next additions.

### What about my old Internet Explorer? Can I use it there?

Not as-is. The scripts are written using ES2021 syntax and are targeting recent browsers.  
You should be able to transpile it to ES5 though, and it should work even in IE9, **but it hasn't been tested there**.

### Does this mean even my shiny Chromium browser will use the less than optimal 2D context instead of a true ImageBitmap?

No, the monkey-patch only patches what it detects is not supported by the current browser. It leaves the native implementation do its job when it can do it.

[1]: https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/createImageBitmap
[2]: https://raw.githubusercontent.com/alrra/browser-logos/main/src/chromium/chromium_48x48.png
[3]: https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png
[4]: https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png
[5]: https://github.com/Automattic/node-canvas
