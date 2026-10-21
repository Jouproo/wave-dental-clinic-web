const ARABIC_INDIC_DIGITS: Record<string, string> = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9",
};

/** Arabic-Indic digits -> ASCII, strip spaces/dashes. Does not guess or "fix" ambiguous numbers. */
export function cleanPhoneInput(raw: string): string {
  return raw
    .split("")
    .map((ch) => ARABIC_INDIC_DIGITS[ch] ?? ch)
    .join("")
    .replace(/[\s\-()]/g, "")
    .trim();
}

// Egyptian mobile numbers only: 01 + {0,1,2,5} + 8 digits = 11 digits total
// (010/011/012/015 ranges). Deliberately stricter than a generic
// international phone library's "is this plausibly dialable in Egypt"
// check — landlines validate fine under general E.164 rules but can't
// receive WhatsApp, and this app's whole reason to validate a phone is to
// know whether WhatsApp/call actions on it will actually reach the patient.
const EG_MOBILE_LOCAL = /^01[0125]\d{8}$/;

export interface NormalizedPhone {
  raw: string;
  normalized: string | null; // E.164, e.g. +201091957525 — null when not confidently a valid EG mobile number
  valid: boolean;
}

export function normalizeEgyptianPhone(raw: string | null | undefined): NormalizedPhone {
  if (!raw || !raw.trim()) {
    return { raw: raw ?? "", normalized: null, valid: false };
  }

  let digits = cleanPhoneInput(raw).replace(/[^\d+]/g, "");

  // Fold +20 / 0020 / 20-prefixed international forms down to the local
  // 01XXXXXXXXX form before validating, without ever inventing digits.
  if (digits.startsWith("+20")) digits = "0" + digits.slice(3);
  else if (digits.startsWith("0020")) digits = "0" + digits.slice(4);
  else if (digits.startsWith("20") && digits.length === 12) digits = "0" + digits.slice(2);

  if (!EG_MOBILE_LOCAL.test(digits)) {
    // Leave ambiguous/invalid numbers for manual review instead of guessing a fix.
    return { raw, normalized: null, valid: false };
  }

  return { raw, normalized: "+20" + digits.slice(1), valid: true };
}
