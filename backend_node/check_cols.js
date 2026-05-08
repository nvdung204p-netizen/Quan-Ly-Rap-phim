const { queryAll } = require('./src/db/queries');
async function main() {
  const r = await queryAll(`SELECT ho_ten, CAST(ho_ten AS VARBINARY) as bytes FROM tai_khoan WHERE ho_ten LIKE '%Admin%'`);
  console.log('Values in DB:', JSON.stringify(r, null, 2));
}
main().catch(e => console.error(e.message));
