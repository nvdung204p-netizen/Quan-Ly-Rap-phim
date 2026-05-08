import { useState, useEffect } from "react";
import { api } from "../../services/api";

export default function AdminSuKien() {
  const [suKiens, setSuKiens] = useState([]);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ tieuDe: "", moTaNgan: "", noiDung: "", anhDaiDienUrl: "", hienThiTrangChu: false, ngayBatDau: "", ngayKetThuc: "" });
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      const data = await api.adminSuKien();
      setSuKiens(Array.isArray(data) ? data : []);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(""); setSuccess("");
    try {
      if (editingId) {
        await api.adminCapNhatSuKien(editingId, form);
        setSuccess("Cập nhật sự kiện thành công.");
      } else {
        await api.adminTaoSuKien(form);
        setSuccess("Tạo sự kiện mới thành công.");
      }
      setEditingId(null);
      setForm({ tieuDe: "", moTaNgan: "", noiDung: "", anhDaiDienUrl: "", hienThiTrangChu: false, ngayBatDau: "", ngayKetThuc: "" });
      loadData();
    } catch (e) { setErr(e.message); }
  }

  async function deleteSuKien(id) {
    if (!window.confirm("Xóa sự kiện này?")) return;
    try {
      await api.adminXoaSuKien(id);
      setSuccess("Đã xóa sự kiện.");
      loadData();
    } catch (e) { setErr(e.message); }
  }

  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Quản Lý Sự Kiện & Tin Tức</h2>
      {err && <p className="admin-alert admin-alert-error">{err}</p>}
      {success && <p className="admin-alert admin-alert-success">{success}</p>}

      <form onSubmit={handleSubmit} className="admin-form-grid" style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #eee" }}>
        <div className="admin-form-span-2">
          <label>Tiêu đề</label>
          <input value={form.tieuDe} onChange={e => setForm({...form, tieuDe: e.target.value})} required />
        </div>
        <div className="admin-form-span-2">
          <label>Mô tả ngắn</label>
          <input value={form.moTaNgan} onChange={e => setForm({...form, moTaNgan: e.target.value})} />
        </div>
        <div className="admin-form-span-2">
          <label>Nội dung chi tiết</label>
          <textarea rows="4" value={form.noiDung} onChange={e => setForm({...form, noiDung: e.target.value})} />
        </div>
        <div>
          <label>Ảnh đại diện (URL)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input type="url" value={form.anhDaiDienUrl} onChange={e => setForm({...form, anhDaiDienUrl: e.target.value})} placeholder="https://..." />
            <button type="button" className="btn-action btn-ghost" onClick={() => document.getElementById("event-upload").click()}>Tải ảnh</button>
            <input 
              id="event-upload" 
              type="file" 
              hidden 
              accept="image/*" 
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                setErr(""); setSuccess("");
                try {
                  const url = await api.uploadPoster(file); // Dùng endpoint upload poster cho sự kiện
                  setForm({ ...form, anhDaiDienUrl: url });
                  setSuccess("Đã tải ảnh lên máy chủ.");
                } catch (err) {
                  setErr(err.message);
                }
              }}
            />
          </div>
        </div>
        <div>
          <label>Trang chủ</label>
          <div style={{ paddingTop: 8 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
              <input type="checkbox" checked={form.hienThiTrangChu} onChange={e => setForm({...form, hienThiTrangChu: e.target.checked})} style={{ width: "auto" }} />
              <strong>Hiển thị trên Trang chủ (Banner)</strong>
            </label>
          </div>
        </div>
        <div>
          <label>Từ ngày</label>
          <input type="datetime-local" value={form.ngayBatDau} onChange={e => setForm({...form, ngayBatDau: e.target.value})} />
        </div>
        <div>
          <label>Đến ngày</label>
          <input type="datetime-local" value={form.ngayKetThuc} onChange={e => setForm({...form, ngayKetThuc: e.target.value})} />
        </div>

        <div className="admin-form-span-2" style={{ textAlign: "right" }}>
          <button type="submit" className="btn-action btn-primary">{editingId ? "Cập nhật" : "Tạo sự kiện"}</button>
          {editingId && <button type="button" className="btn-action btn-ghost" onClick={() => { setEditingId(null); setForm({ tieuDe: "", moTaNgan: "", noiDung: "", anhDaiDienUrl: "", hienThiTrangChu: false, ngayBatDau: "", ngayKetThuc: "" }); }}>Huỷ</button>}
        </div>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Hình ảnh</th>
            <th>Tiêu đề</th>
            <th>Trang chủ</th>
            <th>Hiệu lực</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {suKiens.map(s => (
            <tr key={s.suKienId}>
              <td>{s.anhDaiDienUrl ? <img src={s.anhDaiDienUrl} alt="Thumbnail" width="60" style={{ borderRadius: 4 }} /> : "—"}</td>
              <td><strong>{s.tieuDe}</strong></td>
              <td>{s.hienThiTrangChu ? "✅ Có" : "—"}</td>
              <td>{s.ngayKetThuc ? new Date(s.ngayKetThuc).toLocaleDateString() : "Vô thời hạn"}</td>
              <td>
                <button className="btn-action btn-view" onClick={() => {
                  setEditingId(s.suKienId);
                  setForm({ tieuDe: s.tieuDe, moTaNgan: s.moTaNgan, noiDung: s.noiDung, anhDaiDienUrl: s.anhDaiDienUrl, hienThiTrangChu: s.hienThiTrangChu, ngayBatDau: s.ngayBatDau ? s.ngayBatDau.split('.')[0] : "", ngayKetThuc: s.ngayKetThuc ? s.ngayKetThuc.split('.')[0] : "" });
                }}>Sửa</button>
                <button className="btn-action btn-ghost" onClick={() => deleteSuKien(s.suKienId)}>Xoá</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
