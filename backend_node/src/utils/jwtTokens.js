const jwt = require("jsonwebtoken");
const { JWT_ISSUER, JWT_AUDIENCE, JWT_SECRET_KEY, JWT_ACCESS_TOKEN_MINUTES } = require("../config/env");
const { JWT_ROLE_CLAIM_URI } = require("../config/constants");

function parseRoleList(decoded) {
  const raw = decoded?.[JWT_ROLE_CLAIM_URI];
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);
  return [String(raw)];
}

function TaoAccessToken(taiKhoanId, hoTen, vaiTro) {
  const claims = {
    sub: String(taiKhoanId),
    unique_name: hoTen,
    taiKhoanId: String(taiKhoanId),
    [JWT_ROLE_CLAIM_URI]: vaiTro
  };

  return jwt.sign(claims, JWT_SECRET_KEY, {
    algorithm: "HS256",
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: JWT_ACCESS_TOKEN_MINUTES * 60
  });
}

module.exports = { TaoAccessToken, parseRoleList, JWT_ROLE_CLAIM_URI };
