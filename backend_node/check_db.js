const { queryAll } = require('./src/db/queries');
async function main() {
  const g = await queryAll(`SELECT COUNT(*) as c FROM ghe WHERE phong_chieu_id = 1`);
  console.log('Seats in Room 1:', g[0].c);

  const lg = await queryAll(`SELECT * FROM loai_ghe`);
  console.log('Loai Ghe:', lg);

  const j = await queryAll(`SELECT TOP 5 g.loai_ghe_id as ghe_lg, lg.loai_ghe_id as lg_lg FROM ghe g LEFT JOIN loai_ghe lg ON g.loai_ghe_id = lg.loai_ghe_id WHERE g.phong_chieu_id = 1`);
  console.log('Join Check:', j);
}
main().catch(e => console.error(e.message));
