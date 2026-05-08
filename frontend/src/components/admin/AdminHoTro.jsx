import { useState, useEffect } from "react";
import { api } from "../../services/api";

export default function AdminHoTro() {
  const [kenhs, setKenhs] = useState([]);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ tenPhuongThuc: "", giaTriHienThi: "", linkDich: "", iconUrl: "", thuTu: 0 });
  const [editingId, setEditingId] = useState(null);

  async function loadData() {
    try {
      const data = await api.adminKenhHoTro();
      setKenhs(Array.isArray(data) ? data : []);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { loadData(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(""); setSuccess("");
    try {
      if (editingId) {
        await api.adminCapNhatKenhHoTro(editingId, form);
        setSuccess("Cập nhật kênh hỗ trợ thành công.");
      } else {
        await api.adminTaoKenhHoTro(form);
        setSuccess("Thêm kênh hỗ trợ thành công.");
      }
      setEditingId(null);
      setForm({ tenPhuongThuc: "", giaTriHienThi: "", linkDich: "", iconUrl: "", thuTu: 0 });
      loadData();
    } catch (e) { setErr(e.message); }
  }

  async function deleteKenh(id) {
    if (!window.confirm("Xóa kênh liên hệ này?")) return;
    try {
      await api.adminXoaKenhHoTro(id);
      setSuccess("Đã xóa kênh liên hệ.");
      loadData();
    } catch (e) { setErr(e.message); }
  }

  return (
    <section className="admin-card">
      <h2 className="admin-card-title">Kênh Hỗ Trợ Khách Hàng</h2>
      <p className="admin-field-hint" style={{ marginBottom: 16 }}>Thông tin sẽ hiển thị ở phần Footer hoặc trang Liên hệ của khách hàng.</p>

      {err && <p className="admin-alert admin-alert-error">{err}</p>}
      {success && <p className="admin-alert admin-alert-success">{success}</p>}

      <form onSubmit={handleSubmit} className="admin-form-grid" style={{ marginBottom: 24, paddingBottom: 24, borderBottom: "1px solid #eee" }}>
        <div>
          <label>Kênh liên hệ (Zalo, Hotline...)</label>
          <input value={form.tenPhuongThuc} onChange={e => setForm({...form, tenPhuongThuc: e.target.value})} required />
        </div>
        <div>
          <label>Hiển thị (0988xxx...)</label>
          <input value={form.giaTriHienThi} onChange={e => setForm({...form, giaTriHienThi: e.target.value})} required />
        </div>
        <div>
          <label>Link đích (URL nếu có)</label>
          <input type="url" value={form.linkDich} onChange={e => setForm({...form, linkDich: e.target.value})} placeholder="https://zalo.me/..." />
        </div>
        <div>
          <label>Icon URL (Ảnh nhỏ)</label>
          <input type="url" value={form.iconUrl} onChange={e => setForm({...form, iconUrl: e.target.value})} />
        </div>
        <div>
          <label>Thứ tự sắp xếp (số)</label>
          <input type="number" value={form.thuTu} onChange={e => setForm({...form, thuTu: Number(e.target.value)})} />
        </div>

        <div style={{ alignSelf: "end", textAlign: "right" }}>
          <button type="submit" className="btn-action btn-primary">{editingId ? "Cập nhật" : "Thêm mới"}</button>
          {editingId && <button type="button" className="btn-action btn-ghost" onClick={() => { setEditingId(null); setForm({ tenPhuongThuc: "", giaTriHienThi: "", linkDich: "", iconUrl: "", thuTu: 0 }); }}>Huỷ</button>}
        </div>
      </form>

      <table className="admin-table">
        <thead>
          <tr>
            <th>Kênh</th>
            <th>Thông tin</th>
            <th>Thứ tự</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {kenhs.map(k => (
            <tr key={k.phuongThucId}>
              <td>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {k.iconUrl && <img src={k.iconUrl} alt="Icon" width="20" height="20" style={{ borderRadius: 4, objectFit: "contain" }} />}
                  <strong>{k.tenPhuongThuc}</strong>
                </div>
              </td>
              <td>{k.linkDich ? <a href={k.linkDich} target="_blank" rel="noreferrer">{k.giaTriHienThi}</a> : k.giaTriHienThi}</td>
              <td>{k.thuTu}</td>
              <td>
                <button className="btn-action btn-view" onClick={() => {
                  setEditingId(k.phuongThucId);
                  setForm({ tenPhuongThuc: k.tenPhuongThuc, giaTriHienThi: k.giaTriHienThi, linkDich: k.linkDich, iconUrl: k.iconUrl, thuTu: k.thuTu });
                }}>Sửa</button>
                <button className="btn-action btn-ghost" onClick={() => deleteKenh(k.phuongThucId)}>Xoá</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
