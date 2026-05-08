const { queryAll } = require('./src/db/queries');
async function test() {
  const cols = await queryAll(`
    SELECT COLUMN_NAME, IS_NULLABLE, DATA_TYPE 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'don_dat_ve'
  `);
  console.log(JSON.stringify(cols, null, 2));
}
test().catch(console.error);
