const { queryAll, queryOne, exec } = require('./src/db/queries');

function generateGheData(phongId, soHang, soCot, thuongId, vipId, doiId) {
  const gheArr = [];
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < soHang; r++) {
    const hang = alphabet[r] || `H${r}`;
    let loaiGheId = thuongId;
    if (soHang > 3) {
      if (r === soHang - 1) {
        loaiGheId = doiId || thuongId;
      } else if (r >= 2 && r < soHang - 1) {
        loaiGheId = vipId || thuongId;
      }
    }
    for (let c = 1; c <= soCot; c++) {
      gheArr.push({
        phong_chieu_id: phongId,
        loai_ghe_id: loaiGheId,
        ma_ghe: `${hang}${c}`,
        hang_ghe: hang,
        cot_ghe: c,
        trang_thai: 'BINH_THUONG'
      });
    }
  }
  return gheArr;
}

async function main() {
  const rooms = await queryAll('SELECT phong_chieu_id, so_hang, so_cot FROM phong_chieu');
  const thuong = await queryOne("SELECT TOP 1 loai_ghe_id AS id FROM loai_ghe WHERE ma_loai = 'THUONG'");
  const vip = await queryOne("SELECT TOP 1 loai_ghe_id AS id FROM loai_ghe WHERE ma_loai = 'VIP'");
  const doi = await queryOne("SELECT TOP 1 loai_ghe_id AS id FROM loai_ghe WHERE ma_loai = 'DOI'");

  let count = 0;
  for (const r of rooms) {
    const seats = await queryAll(`SELECT COUNT(*) as c FROM ghe WHERE phong_chieu_id = ${r.phong_chieu_id}`);
    if (seats[0].c === 0 && r.so_hang > 0 && r.so_cot > 0) {
      console.log(`Generating seats for Room ${r.phong_chieu_id}...`);
      const gheArr = generateGheData(r.phong_chieu_id, r.so_hang, r.so_cot, thuong.id, vip.id, doi.id);
      for (const g of gheArr) {
        await exec(
          `INSERT INTO ghe (phong_chieu_id, loai_ghe_id, ma_ghe, hang_ghe, cot_ghe, trang_thai)
           VALUES (@pid, @lid, @mg, @hg, @cg, @st)`,
          {
            pid: g.phong_chieu_id,
            lid: g.loai_ghe_id,
            mg: g.ma_ghe,
            hg: g.hang_ghe,
            cg: g.cot_ghe,
            st: g.trang_thai
          }
        );
        count++;
      }
    }
  }
  console.log(`Successfully generated ${count} seats.`);
}
main().catch(e => console.error(e.message));
