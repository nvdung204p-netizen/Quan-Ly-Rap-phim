const { queryOne } = require("../db/queries");
const { apiOk } = require("../utils/apiResponse");

async function dbHealth(_req, res) {
  const row = await queryOne("SELECT DB_NAME() AS dbName, @@VERSION AS version");
  return apiOk(res, { connected: true, dbName: row?.dbName, version: row?.version });
}

module.exports = { dbHealth };
