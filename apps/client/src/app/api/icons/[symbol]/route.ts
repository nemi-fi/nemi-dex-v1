import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ symbol: string }> },
) {
  const symbol = (await params).symbol?.toLowerCase();
  if (!symbol) {
    return new Response("No symbol", { status: 400 });
  }

  const url = `https://github.com/Cryptofonts/cryptoicons/blob/master/128/${symbol}.png?raw=true`;
  const res = await fetch(url);

  if (!res.ok) {
    return new Response("Failed to fetch icon", { status: res.status });
  }

  return new Response(await res.arrayBuffer(), {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/png",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
