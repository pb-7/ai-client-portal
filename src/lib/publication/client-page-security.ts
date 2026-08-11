import "server-only";

import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

import { cookies } from "next/headers";

import type { PublishedClientPageRecord } from "@/types/publication";

const CLIENT_PAGE_SESSION_SECONDS = 30 * 60;
const MINIMUM_SECRET_LENGTH = 32;

type ClientPageSession = {
  expiresAt: number;
  narrativeVersionId: string;
  publicationId: string;
  publicationUpdatedAt: string;
  slug: string;
};

function requiredSecret(name: "CLIENT_PAGE_DATA_ACCESS_SECRET" | "CLIENT_PAGE_SESSION_SECRET") {
  const value = process.env[name];
  if (!value || value.length < MINIMUM_SECRET_LENGTH) {
    throw new Error(`${name} must contain at least ${MINIMUM_SECRET_LENGTH} characters.`);
  }
  return value;
}

export function createPublicationSlug(clientName: string) {
  const base = clientName
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const suffix = randomBytes(5).toString("hex");
  return `${base || "client"}-${suffix}`;
}

export function derivePublicationAccessToken(slug: string) {
  return createHmac(
    "sha256",
    requiredSecret("CLIENT_PAGE_DATA_ACCESS_SECRET"),
  )
    .update(slug)
    .digest("hex");
}

export function hashPublicationAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function cookieName(slug: string) {
  const suffix = createHash("sha256").update(slug).digest("hex").slice(0, 16);
  return `ff-client-page-${suffix}`;
}

function signPayload(encodedPayload: string) {
  return createHmac(
    "sha256",
    requiredSecret("CLIENT_PAGE_SESSION_SECRET"),
  )
    .update(encodedPayload)
    .digest("base64url");
}

export async function grantClientPageAccess(record: PublishedClientPageRecord) {
  const expiresAt = Math.floor(Date.now() / 1000) + CLIENT_PAGE_SESSION_SECONDS;
  const payload: ClientPageSession = {
    expiresAt,
    narrativeVersionId: record.narrativeVersionId,
    publicationId: record.publicationId,
    publicationUpdatedAt: record.publicationUpdatedAt,
    slug: record.slug,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const value = `${encodedPayload}.${signPayload(encodedPayload)}`;
  const cookieStore = await cookies();

  cookieStore.set(cookieName(record.slug), value, {
    httpOnly: true,
    maxAge: CLIENT_PAGE_SESSION_SECONDS,
    path: `/client/${record.slug}`,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function revokeClientPageAccess(slug: string) {
  const cookieStore = await cookies();

  cookieStore.set(cookieName(slug), "", {
    httpOnly: true,
    maxAge: 0,
    path: `/client/${slug}`,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function hasClientPageAccess(record: PublishedClientPageRecord) {
  const cookieStore = await cookies();
  const value = cookieStore.get(cookieName(record.slug))?.value;
  if (!value) return false;

  const [encodedPayload, suppliedSignature, extra] = value.split(".");
  if (!encodedPayload || !suppliedSignature || extra) return false;

  const expectedSignature = signPayload(encodedPayload);
  const suppliedBuffer = Buffer.from(suppliedSignature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");
  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as Partial<ClientPageSession>;

    return (
      typeof payload.expiresAt === "number" &&
      payload.expiresAt > Math.floor(Date.now() / 1000) &&
      payload.slug === record.slug &&
      payload.publicationId === record.publicationId &&
      payload.narrativeVersionId === record.narrativeVersionId &&
      payload.publicationUpdatedAt === record.publicationUpdatedAt
    );
  } catch {
    return false;
  }
}
