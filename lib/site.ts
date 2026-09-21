// Single source of truth for product identity. Edit this file to rebrand.
export const SITE = {
  name: "CoreBack",
  tagline: "Recover every core deposit, by voice.",
  description:
    "CoreBack is a voice-first workspace for repair shops to match old parts to their purchases, prepare supplier returns, and reconcile the credit that actually comes back.",
  owner: "Aditya Aman",
  year: 2026,
  url: process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:5173",
  supportEmail: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "",
} as const;
