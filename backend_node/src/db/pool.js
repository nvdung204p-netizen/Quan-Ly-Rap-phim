const sql = require("mssql");
const { DB_CONNECTION_STRING } = require("../config/env");

let poolPromise = null;

function parseConnParts(raw) {
  return String(raw)
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .reduce((acc, kv) => {
      const idx = kv.indexOf("=");
      if (idx === -1) return acc;
      const k = kv.slice(0, idx).trim();
      const v = kv.slice(idx + 1).trim();
      acc[k] = v;
      return acc;
    }, {});
}

async function getPool() {
  if (poolPromise) return poolPromise;

  const parts = parseConnParts(DB_CONNECTION_STRING);

  let server = parts.Server || parts.server || parts["DATA SOURCE"] || parts["Data Source"];
  const database = parts.Database || parts.database || parts["INITIAL CATALOG"] || parts["Initial Catalog"];
  if (!server || !database) {
    throw new Error("DB_CONNECTION_STRING thieu Server hoac Database.");
  }

  let port = undefined;
  if (server.includes(",")) {
    const [h, p] = server.split(",").map((s) => s.trim());
    server = h;
    const n = Number(p);
    if (Number.isFinite(n)) port = n;
  }

  const encrypt = String(parts.Encrypt || parts.encrypt || "true").toLowerCase() === "true";
  const trustServerCertificate =
    String(parts.TrustServerCertificate || parts.trustServerCertificate || "true").toLowerCase() === "true";
  const integratedRaw = String(parts["Integrated Security"] || parts.integrated_security || "").toLowerCase();
  const integratedOn = integratedRaw === "true" || integratedRaw === "yes" || integratedRaw === "sspi";
  const trustedConnection =
    String(parts.Trusted_Connection || parts.trusted_connection || "false").toLowerCase() === "true" ||
    integratedOn;

  const connectTimeoutSec = Number(parts["Connect Timeout"] || parts.ConnectionTimeout || 30);
  const connectTimeout = Number.isFinite(connectTimeoutSec) ? connectTimeoutSec * 1000 : 30000;

  const user = parts["User ID"] || parts.Uid || parts.UserId;
  const password = parts.Password || parts.Pwd;

  const config = {
    server,
    database,
    port,
    options: {
      encrypt,
      trustServerCertificate,
      enableArithAbort: true,
      connectTimeout
    }
  };

  if (trustedConnection || (!user && !password)) {
    config.authentication = { type: "default" };
  } else {
    config.user = user;
    config.password = password;
  }

  poolPromise = new sql.ConnectionPool(config).connect();
  return poolPromise;
}

module.exports = { getPool, sql };
