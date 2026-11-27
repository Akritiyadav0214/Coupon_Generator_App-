const crypto = require('crypto');

const ALPHANUMERIC_SAFE = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRandomCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += ALPHANUMERIC_SAFE[bytes[i] % ALPHANUMERIC_SAFE.length];
  }
  return code;
}

function generateCouponId(compactDate) {
  return `MM-${compactDate}-${generateRandomCode(6)}`;
}

function getCouponSecret() {
  return process.env.COUPON_SECRET || process.env.JWT_SECRET || 'fallback-dev-coupon-secret';
}

function generateVerificationToken(couponId, studentId, couponDate) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${couponId}:${studentId}:${couponDate}:${nonce}`;
  const hmac = crypto
    .createHmac('sha256', getCouponSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 24);
  return `${nonce}.${hmac}`;
}

function timingSafeMatch(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Parses QR scan input: accepts either JSON string `{"couponId":"...","token":"..."}`,
 * raw coupon ID (`MM-20261125-XXXXXX`), or verification token.
 */
function parseQrPayload(rawInput) {
  if (!rawInput || typeof rawInput !== 'string') {
    return { couponId: null, verificationToken: null };
  }

  const trimmed = rawInput.trim();
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        couponId: typeof parsed.couponId === 'string' ? parsed.couponId.trim().toUpperCase() : null,
        verificationToken:
          typeof parsed.token === 'string'
            ? parsed.token.trim()
            : typeof parsed.verificationToken === 'string'
              ? parsed.verificationToken.trim()
              : null,
      };
    } catch {
      return { couponId: null, verificationToken: null };
    }
  }

  if (/^MM-\d{8}-[A-Z0-9]{6}$/i.test(trimmed)) {
    return { couponId: trimmed.toUpperCase(), verificationToken: null };
  }

  if (/^[a-f0-9]{32}\.[a-f0-9]{24}$/i.test(trimmed)) {
    return { couponId: null, verificationToken: trimmed };
  }

  return { couponId: trimmed.toUpperCase(), verificationToken: null };
}

module.exports = {
  generateCouponId,
  generateVerificationToken,
  timingSafeMatch,
  parseQrPayload,
};
