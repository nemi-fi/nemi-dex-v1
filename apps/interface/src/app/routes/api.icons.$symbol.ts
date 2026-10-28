import type { Route } from "./+types/api.icons.$symbol.js";

export async function loader({ params }: Route.LoaderArgs) {
  const symbol = params.symbol?.toLowerCase();
  if (!symbol) {
    return new Response("No symbol", { status: 400 });
  }

  // raw.githubusercontent.com serves the file directly; github.com/blob/…?raw=true
  // adds a redirect and rejects requests from some networks
  const url = `https://raw.githubusercontent.com/Cryptofonts/cryptoicons/master/128/${encodeURIComponent(symbol)}.png`;
  const res = await fetch(url);

  if (!res.ok) {
    return new Response("Failed to fetch icon", { status: res.status });
  }

  return new Response(await res.arrayBuffer(), {
    headers: {
      "Content-Type": "image/png",
      // The server runs for every request unless its response is cacheable, so without this
      // every icon load would hit GitHub, which intermittently fails (503s). Workers Caching
      // (enabled in cloudflare.config.ts) and Vercel's CDN, which needs s-maxage, serve repeats
      // from the edge.
      "Cache-Control": "public, max-age=604800, s-maxage=604800",
    },
  });
}
