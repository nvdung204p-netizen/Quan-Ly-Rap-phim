function sqlUniqueViolationMessage(err) {
  const n = err?.number ?? err?.originalError?.info?.number;
  if (n === 2627 || n === 2601) {
    return "Email hoac so dien thoai da duoc su dung.";
  }
  return null;
}

module.exports = { sqlUniqueViolationMessage };
