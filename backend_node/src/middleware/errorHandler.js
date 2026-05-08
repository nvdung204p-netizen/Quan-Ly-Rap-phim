const { apiFail } = require("../utils/apiResponse");

function errorHandler(err, req, res, _next) {
  // eslint-disable-next-line no-console
  console.error(err);
  if (res.headersSent) return;
  apiFail(res, 500, "Loi he thong, vui long thu lai sau.");
}

module.exports = { errorHandler };
