require("dotenv").config();

const PORT = Number(process.env.PORT || 5000);
const CORS_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const DB_CONNECTION_STRING = process.env.DB_CONNECTION_STRING;
if (!DB_CONNECTION_STRING) {
  throw new Error("Missing env DB_CONNECTION_STRING");
}

const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;
const JWT_SECRET_KEY = process.env.JWT_SECRET_KEY;
const JWT_ACCESS_TOKEN_MINUTES = Number(process.env.JWT_ACCESS_TOKEN_MINUTES || 180);
if (!JWT_ISSUER || !JWT_AUDIENCE || !JWT_SECRET_KEY) {
  throw new Error("Missing env JWT config");
}

module.exports = {
  PORT,
  CORS_ORIGINS,
  DB_CONNECTION_STRING,
  JWT_ISSUER,
  JWT_AUDIENCE,
  JWT_SECRET_KEY,
  JWT_ACCESS_TOKEN_MINUTES
};
