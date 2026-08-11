"use server";

import { compare } from "bcryptjs";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  clearClientPagePasswordAttempts,
  recordClientPagePasswordAttempt,
} from "@/lib/publication/client-page-rate-limit";
import {
  grantClientPageAccess,
  revokeClientPageAccess,
} from "@/lib/publication/client-page-security";
import { loadPublishedClientPage } from "@/lib/supabase/publication";
import {
  CLIENT_PAGE_PASSWORD_MAX_LENGTH,
  isValidClientPageSlug,
} from "@/lib/validation/publication";
import type { ClientPagePasswordState } from "@/types/publication";

function requestIpAddress(requestHeaders: Headers) {
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  );
}

export async function unlockClientPage(
  slug: string,
  _previousState: ClientPagePasswordState,
  formData: FormData,
): Promise<ClientPagePasswordState> {
  void _previousState;

  const password = formData.get("password");
  if (
    typeof password !== "string" ||
    !password ||
    password.length > CLIENT_PAGE_PASSWORD_MAX_LENGTH
  ) {
    return { message: "Enter the page password." };
  }

  const record = await loadPublishedClientPage(slug).catch(() => null);
  if (!record) {
    return { message: "This protected page is currently unavailable." };
  }

  const ipAddress = requestIpAddress(await headers());
  if (!recordClientPagePasswordAttempt(slug, ipAddress)) {
    return { message: "Too many attempts. Please wait a few minutes and try again." };
  }

  const validPassword = await compare(password, record.passwordHash).catch(
    () => false,
  );
  if (!validPassword) {
    return { message: "The password is incorrect. Please try again." };
  }

  clearClientPagePasswordAttempts(slug, ipAddress);
  try {
    await grantClientPageAccess(record);
  } catch {
    return { message: "Unable to grant access right now. Please try again." };
  }
  redirect(`/client/${slug}`);
}

export async function logoutClientPage(slug: string, _formData: FormData) {
  void _formData;

  if (!isValidClientPageSlug(slug)) {
    redirect("/");
  }

  await revokeClientPageAccess(slug);
  redirect(`/client/${slug}`);
}
