import { createHmac, timingSafeEqual } from "node:crypto";

const SIGNATURE_PREFIX = "sha256=";

/**
 * Verifies Meta's X-Hub-Signature-256 header against the raw request body.
 * Must be computed over the exact raw bytes Meta sent — never over a
 * re-serialized JSON object, since re-serialization can differ byte for
 * byte from what Meta actually signed.
 */
export function isValidMetaSignature(
  rawBody: Buffer,
  signatureHeader: string | undefined,
  appSecret: string
): boolean {
  if (!signatureHeader || !signatureHeader.startsWith(SIGNATURE_PREFIX)) return false;

  const providedHex = signatureHeader.slice(SIGNATURE_PREFIX.length);
  if (!/^[0-9a-f]+$/i.test(providedHex)) return false;

  const expectedHex = createHmac("sha256", appSecret).update(rawBody).digest("hex");

  const provided = Buffer.from(providedHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(provided, expected);
}
