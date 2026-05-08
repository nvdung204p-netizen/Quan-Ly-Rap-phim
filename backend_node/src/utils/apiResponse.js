function apiOk(res, data, message = "Thanh cong", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}

function apiFail(res, statusCode, message, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors
  });
}

module.exports = { apiOk, apiFail };
