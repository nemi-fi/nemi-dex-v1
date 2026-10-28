import { createRequestHandler } from "react-router";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

/** Platform-neutral: the Cloudflare Worker below and the Vercel function (`server/vercel.ts`). */
export async function handleRequest(request: Request) {
  const response = await requestHandler(request);
  // needed for multithreaded proving. Static assets get these headers from public/_headers on
  // Cloudflare and from vercel.json on Vercel
  const headers = new Headers(response.headers);
  headers.set("Cross-Origin-Embedder-Policy", "require-corp");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export default {
  fetch: handleRequest,
} satisfies ExportedHandler<Env>;
