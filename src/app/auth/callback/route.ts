import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next");
  const next = requestedNext === "/update-password" ? requestedNext : "/login";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return noStoreRedirect(new URL(next, requestUrl.origin));
    }
  }

  return noStoreRedirect(
    new URL("/login?error=invalid-reset-link", requestUrl.origin),
  );
}
