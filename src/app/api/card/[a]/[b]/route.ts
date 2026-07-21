import { resolvePlayer } from "@/lib/data";
import { buildCardSVG } from "@/lib/card";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { a: string; b: string } }
) {
  const a = resolvePlayer(params.a);
  const b = resolvePlayer(params.b);
  if (!a || !b) return new Response("Not found", { status: 404 });

  const svg = await buildCardSVG(a, b);
  return new Response(svg, {
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "public, max-age=86400, immutable",
    },
  });
}
