const crypto = require("crypto");

function TaoOtp(doDai = 6) {
  const max = 10 ** doDai;
  const value = crypto.randomInt(0, max);
  return String(value).padStart(doDai, "0");
}

function utcNowIso() {
  return new Date();
}

function formatMaDonLikeCSharp(d) {
  const yyyy = String(d.getUTCFullYear());
  const MM = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const HH = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  const fff = String(d.getUTCMilliseconds()).padStart(3, "0");
  const random3 = String(crypto.randomInt(100, 999));
  return `DV${yyyy}${MM}${dd}${HH}${mm}${ss}${fff}${random3}`;
}

function formatGiaoDichLikeCSharp(d) {
  const yyyy = String(d.getUTCFullYear());
  const MM = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const HH = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  const fff = String(d.getUTCMilliseconds()).padStart(3, "0");
  return `GD${yyyy}${MM}${dd}${HH}${mm}${ss}${fff}`;
}

function makeInClauseParams(values, baseName = "id") {
  const unique = Array.from(new Set(values)).filter((v) => v !== null && v !== undefined);
  const placeholders = unique.map((_, i) => `@${baseName}${i}`);
  const params = {};
  unique.forEach((v, i) => {
    params[`${baseName}${i}`] = v;
  });
  return { inSql: placeholders.join(", "), params, values: unique };
}

module.exports = {
  TaoOtp,
  utcNowIso,
  formatMaDonLikeCSharp,
  formatGiaoDichLikeCSharp,
  makeInClauseParams
};
