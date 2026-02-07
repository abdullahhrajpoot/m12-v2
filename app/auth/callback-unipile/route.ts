import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies as nextCookies } from "next/headers";

export async function GET(req: Request) {
  // 1️⃣ Create Supabase client with proper App Router cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return nextCookies().getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              nextCookies().set(name, value, options)
            )
          } catch {
            // ...
          }
        },
      },
    }
  );

  // 2️⃣ Get logged-in Supabase user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect("/?error=no_user");

  // 3️⃣ Get Unipile code from query
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect("/?error=no_code");

  // 4️⃣ Exchange code for Unipile token
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

  if (!unipileAccountId) return NextResponse.redirect("/?error=no_account_id");

  // 5️⃣ Store Unipile account ID linked to Supabase user
  await supabase
    .from("users")
    .update({
      unipile_account_id: unipileAccountId,
      unipile_linked: true
    })
    .eq("id", user.id);

  // 6️⃣ Redirect to whatwefound
  return NextResponse.redirect(new URL("/whatwefound", req.url));
}
