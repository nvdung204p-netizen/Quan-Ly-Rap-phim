const { queryAll } = require('./src/db/queries');
async function test() {
  const q = `
    SELECT 
        k.name AS Constraint_Name,
        c.name AS Column_Name
    FROM sys.key_constraints k
    JOIN sys.index_columns ic ON k.parent_object_id = ic.object_id AND k.unique_index_id = ic.index_id
    JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
    WHERE k.parent_object_id = OBJECT_ID('ve') AND k.type = 'UQ'
  `;
  const res = await queryAll(q);
  console.log(JSON.stringify(res, null, 2));
}
test().catch(console.error);
