import { useState, useEffect } from "react";
import { api } from "../../services/api";

export default function AdminNganHang() {
  const [nganHangs, setNganHangs] = useState([]);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ tenNganHang: "", chuTaiKhoan: "", soTaiKhoan: "", chiNhanh: "", logoUrl: "", laMacDinh: false });
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      const data = await api.adminNganHang();
      setNganHangs(Array.isArray(data) ? data : []);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(""); setSuccess("");
    try {
      if (editingId) {
        await api.adminCapNhatNganHang(editingId, form);
        setSuccess("Đã cập nhật ngân hàng.");
      } else {
        await api.adminTaoNganHang(form);
        setSuccess("Đã thêm ngân hàng.");
      }
      setEditingId(null);
      setForm({ tenNganHang: "", chuTaiKhoan: "", soTaiKhoan: "", chiNhanh: "", logoUrl: "", laMacDinh: false });
      loadData();
    } catch (e) { setErr(e.message); }
  }

  async function deleteNganHang(id) {
    if (!window.confirm("Xoá ngân hàng này?")) return;
    try {
      await api.adminXoaNganHang(id);
      setSuccess("Đã xoá ngân hàng.");
      loadData();
    } catch (e) { setErr(e.message); }
  }

  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Tài Khoản Ngân Hàng Nhận Tiền</h2>
      <p className="admin-field-hint" style={{ marginBottom: 16 }}>Khách hàng khi thanh toán chuyển khoản sẽ thấy các thông tin tài khoản này.</p>
      
      {err && <p className="admin-alert admin-alert-error">{err}</p>}
      {success && <p className="admin-alert admin-alert-success">{success}</p>}

      <form onSubmit={handleSubmit} className="admin-form-grid" style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #eee" }}>
        <div>
          <label>Tên Ngân Hàng (VD: Vietcombank)</label>
          <input value={form.tenNganHang} onChange={e => setForm({...form, tenNganHang: e.target.value})} required />
        </div>
        <div>
          <label>Chủ Tài Khoản</label>
          <input value={form.chuTaiKhoan} onChange={e => setForm({...form, chuTaiKhoan: e.target.value.toUpperCase()})} required />
        </div>
        <div>
          <label>Số Tài Khoản</label>
          <input value={form.soTaiKhoan} onChange={e => setForm({...form, soTaiKhoan: e.target.value})} required />
        </div>
        <div>
          <label>Chi Nhánh</label>
          <input value={form.chiNhanh} onChange={e => setForm({...form, chiNhanh: e.target.value})} />
        </div>
        <div className="admin-form-span-2" style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <label>Logo URL (Tuỳ chọn)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input type="url" value={form.logoUrl} onChange={e => setForm({...form, logoUrl: e.target.value})} placeholder="https://..." />
              <button type="button" className="btn-action btn-ghost" onClick={() => document.getElementById("logo-upload").click()}>Tải ảnh</button>
              <input 
                id="logo-upload" 
                type="file" 
                hidden 
                accept="image/*" 
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  setErr(""); setSuccess("");
                  try {
                    const url = await api.uploadQrThanhToan(file);
                    setForm({ ...form, logoUrl: url });
                    setSuccess("Đã tải ảnh lên máy chủ.");
                  } catch (err) {
                    setErr(err.message);
                  }
                }}
              />
            </div>
          </div>
          <div style={{ paddingTop: 24 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: "normal" }}>
              <input type="checkbox" checked={form.laMacDinh} onChange={e => setForm({...form, laMacDinh: e.target.checked})} style={{ width: "auto" }} />
              <strong>Đặt làm tài khoản mặc định</strong>
            </label>
          </div>
        </div>
        
        <div className="admin-form-span-2" style={{ textAlign: "right" }}>
          <button type="submit" className="btn-action btn-primary">{editingId ? "Cập nhật" : "Thêm mới"}</button>
          {editingId && <button type="button" className="btn-action btn-ghost" onClick={() => { setEditingId(null); setForm({ tenNganHang: "", chuTaiKhoan: "", soTaiKhoan: "", chiNhanh: "", logoUrl: "", laMacDinh: false }); }}>Huỷ</button>}
        </div>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Ngân hàng</th>
            <th>Chủ TK</th>
            <th>Số TK</th>
            <th>Mặc định</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {nganHangs.map(n => (
            <tr key={n.nganHangId}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {n.logoUrl && <img src={n.logoUrl} alt="Logo" width="24" height="24" style={{ borderRadius: 4, objectFit: "contain" }} />}
                  <strong>{n.tenNganHang}</strong>
                </div>
              </td>
              <td>{n.chuTaiKhoan}</td>
              <td>{n.soTaiKhoan}</td>
              <td>{n.laMacDinh ? "⭐" : ""}</td>
              <td>
                <button className="btn-action btn-view" onClick={() => {
                  setEditingId(n.nganHangId);
                  setForm({ tenNganHang: n.tenNganHang, chuTaiKhoan: n.chuTaiKhoan, soTaiKhoan: n.soTaiKhoan, chiNhanh: n.chiNhanh, logoUrl: n.logoUrl, laMacDinh: n.laMacDinh });
                }}>Sửa</button>
                <button className="btn-action btn-ghost" onClick={() => deleteNganHang(n.nganHangId)}>Xoá</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
