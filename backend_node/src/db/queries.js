const sql = require("mssql");
const { getPool } = require("./pool");

async function queryOne(sqlText, params = {}, tx = null) {
  const pool = await getPool();
  const request = tx ? new sql.Request(tx) : pool.request();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) {
      const key = k.toLowerCase();
      if (key.includes("taikhoanid")) {
        request.input(k, sql.BigInt, null);
      } else if (key.endsWith("id") || key.includes("id_")) {
        request.input(k, sql.BigInt, null);
      } else {
        request.input(k, sql.NVarChar, null);
      }
    } else {
      request.input(k, v);
    }
  }
  const result = await request.query(sqlText);
  return result.recordset?.[0] ?? null;
}

async function queryAll(sqlText, params = {}, tx = null) {
  const pool = await getPool();
  const request = tx ? new sql.Request(tx) : pool.request();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) {
      const key = k.toLowerCase();
      if (key.includes("taikhoanid")) {
        request.input(k, sql.BigInt, null);
      } else if (key.endsWith("id") || key.includes("id_")) {
        request.input(k, sql.BigInt, null);
      } else {
        request.input(k, sql.NVarChar, null);
      }
    } else {
      request.input(k, v);
    }
  }
  const result = await request.query(sqlText);
  return result.recordset ?? [];
}

async function exec(sqlText, params = {}, tx = null) {
  const pool = await getPool();
  const request = tx ? new sql.Request(tx) : pool.request();
  for (const [k, v] of Object.entries(params)) {
    if (v === null || v === undefined) {
      const key = k.toLowerCase();
      if (key.includes("taikhoanid")) {
        request.input(k, sql.BigInt, null);
      } else if (key.endsWith("id") || key.includes("id_")) {
        request.input(k, sql.BigInt, null);
      } else {
        request.input(k, sql.NVarChar, null);
      }
    } else {
      request.input(k, v);
    }
  }
  await request.query(sqlText);
}

module.exports = { queryOne, queryAll, exec };
