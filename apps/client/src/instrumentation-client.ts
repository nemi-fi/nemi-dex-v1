import { Buffer as B } from "buffer";

// next.js has some crazy ass polyfills for Buffer which are magically appearing and cannot be re-assigned using `globalThis.Buffer = B`
// so we just monkey patch the Buffer prototype with the B prototype
const bufferMethods = Object.getOwnPropertyNames(B.prototype);
bufferMethods.forEach((method) => {
  const skipMethods = ["constructor", "slice", "parent", "offset"];
  if (skipMethods.includes(method)) {
    return;
  }

  if (!Buffer.prototype[method]) {
    Buffer.prototype[method] = B.prototype[method];
  }
});
