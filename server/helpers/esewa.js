// helpers/esewa.js
// -----------------
// Lightweight helper for eSewa ePay‑v2 (sandbox)
// Docs: https://developer.esewa.com.np

const crypto = require("crypto");

const config = {
  /** UAT / sandbox base URL */
  baseURL: process.env.ESEWA_BASE_URL ||
           "https://rc-epay.esewa.com.np/api/epay",

  /** Merchant / service code (test = EPAYTEST) */
  productCode: process.env.ESEWA_PRODUCT_CODE || "EPAYTEST",

  /** HMAC secret used to sign each request */
  secretKey: process.env.ESEWA_SECRET_KEY || "8gBm/:&EnhH.1/q",

  /** Optional — only if you’re using the mobile SDK */
  client_id: process.env.ESEWA_CLIENT_ID ||
             "JB0BBQ4aD0UqIThFJwAKBgAXEUkEGQUBBAwdOgABHD4DChwUAB0R",
  client_secret: process.env.ESEWA_CLIENT_SECRET ||
                 "BhwIWQQADhIYSxILExMcAgFXFhcOBwAKBgAXEQ==",
};

/** Build the form and redirect URL */
config.formEndpoint = `${config.baseURL}/main/v2/form`;

/** Status‑check URL for server‑side verification */
config.statusEndpoint = `${config.baseURL}/transaction/v2/status`;

/**
 * Generate the base‑64 HMAC‑SHA‑256 signature required by eSewa.
 * payload = { total_amount, transaction_uuid }
 */
function sign(payload) {
  const message =
    `total_amount=${payload.total_amount},` +
    `transaction_uuid=${payload.transaction_uuid},` +
    `product_code=${config.productCode}`;

  return crypto
    .createHmac("sha256", config.secretKey)
    .update(message)
    .digest("base64");
}

module.exports = { ...config, sign };
