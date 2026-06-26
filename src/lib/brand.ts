/** Product display name — used in UI, emails, metadata, and iCal feed labels. */
export const SITE_NAME = "InnkeeperOS";

/** Canonical site origin (sitemap, JSON-LD, OAuth, email links). */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://renttools.io";

/** Default support contact when SUPPORT_EMAIL is unset. */
export const SUPPORT_EMAIL =
  process.env.SUPPORT_EMAIL || "support@renttools.io";

/** Default transactional email sender when EMAIL_FROM is unset. */
export const DEFAULT_EMAIL_FROM = `${SITE_NAME} <noreply@renttools.io>`;
