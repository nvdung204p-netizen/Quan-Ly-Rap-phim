const jwt = require("jsonwebtoken");
const { JWT_ISSUER, JWT_AUDIENCE, JWT_SECRET_KEY } = require("../config/env");
const { parseRoleList } = require("../utils/jwtTokens");
const { apiFail } = require("../utils/apiResponse");
const { asyncHandler } = require("./asyncHandler");

function requireAuth(requiredRoles = []) {
  return asyncHandler(async (req, res, next) => {
    const header = req.headers.authorization || "";
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match) return apiFail(res, 401, "Unauthorized");

    const token = match[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET_KEY, {
        algorithms: ["HS256"],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE
      });
    } catch (_e) {
      return apiFail(res, 401, "Unauthorized");
    }

    const roles = parseRoleList(decoded);
    const taiKhoanId = decoded?.taiKhoanId ? Number(decoded.taiKhoanId) : decoded?.sub ? Number(decoded.sub) : null;
    req.user = {
      taiKhoanId,
      roles,
      hoTen: decoded?.unique_name || decoded?.uniqueName || null
    };

    if (requiredRoles.length > 0) {
      const ok = requiredRoles.some((r) => roles.includes(r));
      if (!ok) return apiFail(res, 403, "Forbidden");
    }

    return next();
  });
}

module.exports = { requireAuth };
