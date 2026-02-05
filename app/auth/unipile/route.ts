import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");

  if (!code) return NextResponse.redirect("/?error=no_code");

  // Exchange code for Unipile token
  const tokenRes = await fetch("https://api.unipile.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.UNIPILE_CLIENT_ID,
      client_secret: process.env.UNIPILE_CLIENT_SECRET,
      code,
      redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/unipile/callback`,
      grant_type: "authorization_code",
    }),
  });

  const data = await tokenRes.json();

  const unipileAccountId = data.unipile_account_id;

  // TODO: save unipileAccountId linked to your internal user_id in your DB
  // Example: await prisma.user.update({ where: { id: userId }, data: { unipile_account_id: unipileAccountId } })

  return NextResponse.redirect("/dashboard");
}
