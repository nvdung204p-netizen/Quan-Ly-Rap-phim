import { useState, useEffect } from "react";
import { api } from "../../services/api";

export default function AdminGiamGia() {
  const [maList, setMaList] = useState([]);
  const [hangList, setHangList] = useState([]);
  const [theList, setTheList] = useState([]);
  
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [maForm, setMaForm] = useState({ maCode: "", loaiGiamGia: "PHAN_TRAM", giaTriGiam: 0, giaTriDonToiThieu: 0, giamToiDa: "", ngayBatDau: "", ngayKetThuc: "", soLuongConLai: 100 });
  const [hangForm, setHangForm] = useState({ tenHang: "", diemToiThieu: 0, tyLeTichDiem: 0, quyenLoi: "" });

  const [editingHangId, setEditingHangId] = useState(null);

  async function loadData() {
    try {
      const [mRes, hRes, tRes] = await Promise.all([
        api.adminGiamGia(),
        api.adminHangThanhVien(),
        api.adminTheThanhVien()
      ]);
      setMaList(Array.isArray(mRes) ? mRes : []);
      setHangList(Array.isArray(hRes) ? hRes : []);
      setTheList(Array.isArray(tRes) ? tRes : []);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { loadData(); }, []);

  // -- MA GIAM GIA --
  async function submitMaGiamGia(e) {
    e.preventDefault();
    setErr(""); setSuccess("");
    try {
      await api.adminTaoGiamGia({
        ...maForm,
        giamToiDa: maForm.giamToiDa ? Number(maForm.giamToiDa) : null
      });
      setSuccess("Tạo mã giảm giá thành công.");
      setMaForm({ maCode: "", loaiGiamGia: "PHAN_TRAM", giaTriGiam: 0, giaTriDonToiThieu: 0, giamToiDa: "", ngayBatDau: "", ngayKetThuc: "", soLuongConLai: 100 });
      loadData();
    } catch (e) { setErr(e.message); }
  }

  async function deleteMaGiamGia(id) {
    if (!window.confirm("Xoá mã giảm giá này?")) return;
    try {
      await api.adminXoaGiamGia(id);
      setSuccess("Đã xoá mã giảm giá.");
      loadData();
    } catch (e) { setErr(e.message); }
  }

  // -- HANG THANH VIEN --
  async function submitHangThanhVien(e) {
    e.preventDefault();
    setErr(""); setSuccess("");
    try {
      if (editingHangId) {
        await api.adminCapNhatHangThanhVien(editingHangId, hangForm);
        setSuccess("Đã cập nhật hạng thành viên.");
      } else {
        await api.adminTaoHangThanhVien(hangForm);
        setSuccess("Đã tạo hạng thành viên.");
      }
      setEditingHangId(null);
      setHangForm({ tenHang: "", diemToiThieu: 0, tyLeTichDiem: 0, quyenLoi: "" });
      loadData();
    } catch (e) { setErr(e.message); }
  }

  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Khuyến Mãi & Thành Viên</h2>
      {err && <p className="admin-alert admin-alert-error">{err}</p>}
      {success && <p className="admin-alert admin-alert-success">{success}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        
        {/* CỘT 1: Mã giảm giá */}
        <div>
          <h3>Mã Giảm Giá</h3>
          <form onSubmit={submitMaGiamGia} className="admin-form-grid" style={{ marginBottom: 16 }}>
            <div>
              <label>Mã Code</label>
              <input value={maForm.maCode} onChange={e => setMaForm({...maForm, maCode: e.target.value.toUpperCase()})} placeholder="SALE100" required />
            </div>
            <div>
              <label>Loại giảm</label>
              <select value={maForm.loaiGiamGia} onChange={e => setMaForm({...maForm, loaiGiamGia: e.target.value})}>
                <option value="PHAN_TRAM">Phần trăm (%)</option>
                <option value="TRU_TIEN">Trừ tiền (VNĐ)</option>
              </select>
            </div>
            <div>
              <label>Giá trị giảm</label>
              <input type="number" value={maForm.giaTriGiam} onChange={e => setMaForm({...maForm, giaTriGiam: Number(e.target.value)})} required />
            </div>
            <div>
              <label>Đơn tối thiểu (VNĐ)</label>
              <input type="number" value={maForm.giaTriDonToiThieu} onChange={e => setMaForm({...maForm, giaTriDonToiThieu: Number(e.target.value)})} />
            </div>
            <div>
              <label>Từ ngày</label>
              <input type="datetime-local" value={maForm.ngayBatDau} onChange={e => setMaForm({...maForm, ngayBatDau: e.target.value})} required />
            </div>
            <div>
              <label>Đến ngày</label>
              <input type="datetime-local" value={maForm.ngayKetThuc} onChange={e => setMaForm({...maForm, ngayKetThuc: e.target.value})} required />
            </div>
            <div style={{ alignSelf: "end" }}>
              <button type="submit" className="btn-action btn-primary">Tạo mã</button>
            </div>
          </form>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Mức giảm</th>
                <th>Còn lại</th>
                <th>Hạn SD</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {maList.map(m => (
                <tr key={m.maGiamGiaId}>
                  <td><strong>{m.maCode}</strong></td>
                  <td>{m.giaTriGiam}{m.loaiGiamGia === 'PHAN_TRAM' ? '%' : 'đ'}</td>
                  <td>{m.soLuongConLai}</td>
                  <td>{new Date(m.ngayKetThuc).toLocaleDateString()}</td>
                  <td><button className="btn-action btn-ghost" onClick={() => deleteMaGiamGia(m.maGiamGiaId)}>Xoá</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CỘT 2: Thành viên & Hạng */}
        <div>
          <h3>Hạng Thành Viên</h3>
          <form onSubmit={submitHangThanhVien} className="admin-form-grid" style={{ marginBottom: 16 }}>
            <div>
              <label>Tên hạng</label>
              <input value={hangForm.tenHang} onChange={e => setHangForm({...hangForm, tenHang: e.target.value})} placeholder="Bronze / Silver..." required />
            </div>
            <div>
              <label>Điểm tối thiểu</label>
              <input type="number" value={hangForm.diemToiThieu} onChange={e => setHangForm({...hangForm, diemToiThieu: Number(e.target.value)})} required />
            </div>
            <div>
              <label>Tỷ lệ tích điểm (%)</label>
              <input type="number" step="0.1" value={hangForm.tyLeTichDiem} onChange={e => setHangForm({...hangForm, tyLeTichDiem: Number(e.target.value)})} required />
            </div>
            <div>
              <label>Quyền lợi</label>
              <input value={hangForm.quyenLoi} onChange={e => setHangForm({...hangForm, quyenLoi: e.target.value})} />
            </div>
            <div style={{ alignSelf: "end" }}>
              <button type="submit" className="btn-action btn-primary">{editingHangId ? "Cập nhật" : "Tạo hạng"}</button>
              {editingHangId && <button type="button" className="btn-action btn-ghost" onClick={() => { setEditingHangId(null); setHangForm({ tenHang: "", diemToiThieu: 0, tyLeTichDiem: 0, quyenLoi: "" }); }}>Huỷ</button>}
            </div>
          </form>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên hạng</th>
                <th>Điểm y/c</th>
                <th>Tích điểm</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {hangList.map(h => (
                <tr key={h.hangId}>
                  <td>{h.tenHang}</td>
                  <td>{h.diemToiThieu}</td>
                  <td>{h.tyLeTichDiem}%</td>
                  <td>
                    <button className="btn-action btn-view" onClick={() => {
                      setEditingHangId(h.hangId);
                      setHangForm({ tenHang: h.tenHang, diemToiThieu: h.diemToiThieu, tyLeTichDiem: h.tyLeTichDiem, quyenLoi: h.quyenLoi });
                    }}>Sửa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3 style={{ marginTop: 24 }}>Thẻ Thành Viên ({theList.length})</h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Tên khách</th>
                <th>Mã thẻ</th>
                <th>Hạng</th>
                <th>Điểm</th>
              </tr>
            </thead>
            <tbody>
              {theList.slice(0, 5).map(t => (
                <tr key={t.theId}>
                  <td>{t.hoTen}</td>
                  <td>{t.maThe}</td>
                  <td><strong>{t.tenHang}</strong></td>
                  <td>{t.diemKhaDung}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="admin-field-hint" style={{ marginTop: 8 }}>Chỉ hiển thị 5 thẻ phát hành gần đây nhất.</p>
        </div>
      </div>
    </section>
  );
}
