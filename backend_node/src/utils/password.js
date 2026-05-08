const crypto = require("crypto");

function hashMatKhau(matKhau) {
  const iterations = 100_000;
  const saltSize = 16;
  const keySize = 32;

  const salt = crypto.randomBytes(saltSize);
  const hash = crypto.pbkdf2Sync(matKhau, salt, iterations, keySize, "sha256");
  return `${iterations}.${salt.toString("base64")}.${hash.toString("base64")}`;
}

function KiemTraMatKhau(matKhau, matKhauHash) {
  try {
    const parts = String(matKhauHash).split(".");
    if (parts.length !== 3) return false;
    const iterations = Number(parts[0]);
    if (!Number.isFinite(iterations)) return false;

    const salt = Buffer.from(parts[1], "base64");
    const expectedHash = Buffer.from(parts[2], "base64");
    const actualHash = crypto.pbkdf2Sync(matKhau, salt, iterations, expectedHash.length, "sha256");
    return crypto.timingSafeEqual(actualHash, expectedHash);
  } catch {
    return false;
  }
}

module.exports = { hashMatKhau, KiemTraMatKhau };
