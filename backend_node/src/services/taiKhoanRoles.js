const { queryAll } = require("../db/queries");

async function layVaiTroTheoTaiKhoanId(taiKhoanId) {
  const vaiTroRows = await queryAll(
    `
      SELECT vt.ma_vai_tro AS role
      FROM tai_khoan_vai_tro tvr
      JOIN vai_tro vt ON vt.vai_tro_id = tvr.vai_tro_id
      WHERE tvr.tai_khoan_id = @taiKhoanId
    `,
    { taiKhoanId }
  );
  return vaiTroRows.map((x) => x.role);
}

module.exports = { layVaiTroTheoTaiKhoanId };
