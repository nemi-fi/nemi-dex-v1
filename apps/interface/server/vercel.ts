// Vercel's React Router builder runs the default export of the SSR build's entry as a Node.js
// function. It serves the same handler as the Cloudflare Worker.
export { handleRequest as default } from "../workers/app.js";
