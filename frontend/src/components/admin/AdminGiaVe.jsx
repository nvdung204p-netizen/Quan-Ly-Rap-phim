import { useState, useEffect } from "react";
import { api } from "../../services/api";

export default function AdminGiaVe() {
  const [phimGiaVe, setPhimGiaVe] = useState([]);
  const [loaiGhes, setLoaiGhes] = useState([]);
  const [phimList, setPhimList] = useState([]);
  
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [giaVeForm, setGiaVeForm] = useState({ phimId: "", giaCoBan: 80000, tuNgay: "", denNgay: "" });
  const [editingGiaVeId, setEditingGiaVeId] = useState(null);

  const [editingLoaiGheId, setEditingLoaiGheId] = useState(null);
  const [loaiGheForm, setLoaiGheForm] = useState({ tenLoai: "", heSoGia: 1, mauHienThi: "" });

  async function loadData() {
    try {
      const [gvRes, lgRes, pRes] = await Promise.all([
        api.adminGiaVePhim(),
        api.adminLoaiGhe(),
        api.phim() // Lấy danh sách phim để chọn
      ]);
      setPhimGiaVe(Array.isArray(gvRes) ? gvRes : []);
      setLoaiGhes(Array.isArray(lgRes) ? lgRes : []);
      setPhimList(Array.isArray(pRes) ? pRes : []);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => { loadData(); }, []);

  // -- GIA VE PHIM --
  async function submitGiaVe(e) {
    e.preventDefault();
    setErr(""); setSuccess("");
    try {
      if (editingGiaVeId) {
        await api.adminCapNhatGiaVePhim(editingGiaVeId, giaVeForm);
        setSuccess("Đã cập nhật giá vé.");
      } else {
        await api.adminTaoGiaVePhim(giaVeForm);
        setSuccess("Đã tạo cấu hình giá vé.");
      }
      setEditingGiaVeId(null);
      setGiaVeForm({ phimId: "", giaCoBan: 80000, tuNgay: "", denNgay: "" });
      loadData();
    } catch (e) { setErr(e.message); }
  }

  async function deleteGiaVe(id) {
    if (!window.confirm("Xóa cấu hình giá vé này?")) return;
    try {
      await api.adminXoaGiaVePhim(id);
      setSuccess("Đã xóa giá vé.");
      loadData();
    } catch (e) { setErr(e.message); }
  }

  // -- LOAI GHE --
  async function submitLoaiGhe(e) {
    e.preventDefault();
    setErr(""); setSuccess("");
    try {
      await api.adminCapNhatLoaiGhe(editingLoaiGheId, loaiGheForm);
      setSuccess("Đã cập nhật loại ghế.");
      setEditingLoaiGheId(null);
      loadData();
    } catch (e) { setErr(e.message); }
  }

  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Cấu hình Giá vé & Loại ghế</h2>
      {err && <p className="admin-alert admin-alert-error">{err}</p>}
      {success && <p className="admin-alert admin-alert-success">{success}</p>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* CỘT 1: Giá vé cơ bản của Phim */}
        <div>
          <h3>Giá cơ bản theo phim</h3>
          <form onSubmit={submitGiaVe} className="admin-form-grid" style={{ marginBottom: 16 }}>
            <div className="admin-form-span-2">
              <label>Phim</label>
              <select value={giaVeForm.phimId} onChange={e => setGiaVeForm({...giaVeForm, phimId: e.target.value})} required>
                <option value="">-- Chọn phim --</option>
                {phimList.map(p => <option key={p.phimId} value={p.phimId}>{p.tenPhim}</option>)}
              </select>
            </div>
            <div>
              <label>Giá cơ bản (VNĐ)</label>
              <input type="number" min="0" value={giaVeForm.giaCoBan} onChange={e => setGiaVeForm({...giaVeForm, giaCoBan: Number(e.target.value)})} required />
            </div>
            <div>
              <label>Từ ngày</label>
              <input type="date" value={giaVeForm.tuNgay ? giaVeForm.tuNgay.split('T')[0] : ""} onChange={e => setGiaVeForm({...giaVeForm, tuNgay: e.target.value})} required />
            </div>
            <div>
              <label>Đến ngày</label>
              <input type="date" value={giaVeForm.denNgay ? giaVeForm.denNgay.split('T')[0] : ""} onChange={e => setGiaVeForm({...giaVeForm, denNgay: e.target.value})} />
            </div>
            <div style={{ alignSelf: "end" }}>
              <button type="submit" className="btn-action btn-primary">{editingGiaVeId ? "Cập nhật" : "Thêm mới"}</button>
              {editingGiaVeId && <button type="button" className="btn-action btn-ghost" onClick={() => setEditingGiaVeId(null)}>Huỷ</button>}
            </div>
          </form>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Phim</th>
                <th>Giá (VNĐ)</th>
                <th>Từ ngày</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {phimGiaVe.map(g => (
                <tr key={g.giaVePhimId}>
                  <td>{phimList.find(p => Number(p.phimId) === Number(g.phimId))?.tenPhim || g.phimId}</td>
                  <td>{g.giaCoBan}</td>
                  <td>{g.tuNgay ? new Date(g.tuNgay).toLocaleDateString("vi-VN") : ""}</td>
                  <td>
                    <button className="btn-action btn-view" onClick={() => {
                      setEditingGiaVeId(g.giaVePhimId);
                      setGiaVeForm({ phimId: g.phimId, giaCoBan: g.giaCoBan, tuNgay: g.tuNgay, denNgay: g.denNgay });
                    }}>Sửa</button>
                    <button className="btn-action btn-ghost" onClick={() => deleteGiaVe(g.giaVePhimId)}>Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CỘT 2: Hệ số loại ghế */}
        <div>
          <h3>Hệ số Loại ghế</h3>
          <p className="admin-field-hint">Giá vé cuối = Giá cơ bản × Hệ số ghế</p>

          {editingLoaiGheId && (
            <form onSubmit={submitLoaiGhe} className="admin-form-grid" style={{ marginBottom: 16, background: "#f8fafc", padding: 12, borderRadius: 8 }}>
              <div>
                <label>Tên loại</label>
                <input value={loaiGheForm.tenLoai} onChange={e => setLoaiGheForm({...loaiGheForm, tenLoai: e.target.value})} required />
              </div>
              <div>
                <label>Hệ số giá</label>
                <input type="number" step="0.1" min="0" value={loaiGheForm.heSoGia} onChange={e => setLoaiGheForm({...loaiGheForm, heSoGia: Number(e.target.value)})} required />
              </div>
              <div>
                <label>Mã màu (Hex)</label>
                <input value={loaiGheForm.mauHienThi} onChange={e => setLoaiGheForm({...loaiGheForm, mauHienThi: e.target.value})} />
              </div>
              <div style={{ alignSelf: "end" }}>
                <button type="submit" className="btn-action btn-primary">Cập nhật</button>
                <button type="button" className="btn-action btn-ghost" onClick={() => setEditingLoaiGheId(null)}>Huỷ</button>
              </div>
            </form>
          )}

          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã</th>
                <th>Tên loại</th>
                <th>Hệ số</th>
                <th>Màu</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loaiGhes.map(lg => (
                <tr key={lg.loaiGheId}>
                  <td>{lg.maLoai}</td>
                  <td>{lg.tenLoai}</td>
                  <td><strong>x{lg.heSoGia}</strong></td>
                  <td><span style={{ display: "inline-block", width: 16, height: 16, background: lg.mauHienThi, borderRadius: "50%" }}></span> {lg.mauHienThi}</td>
                  <td>
                    <button className="btn-action btn-view" onClick={() => {
                      setEditingLoaiGheId(lg.loaiGheId);
                      setLoaiGheForm({ tenLoai: lg.tenLoai, heSoGia: lg.heSoGia, mauHienThi: lg.mauHienThi });
                    }}>Sửa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
