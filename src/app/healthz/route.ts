import { connection } from "next/server";

/** Process liveness only: it says nothing about the pages. */
export async function GET() {
  await connection();
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
