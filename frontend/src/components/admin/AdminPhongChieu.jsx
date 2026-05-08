import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../../services/api";

// Màu & nhãn từng loại ghế
const LOAI_GHE = {
  THUONG: { label: "Thường", color: "#3b82f6", bg: "#1d3a6e" },
  VIP:    { label: "VIP",    color: "#f59e0b", bg: "#5a3a00" },
  DOI:    { label: "Đôi",    color: "#ec4899", bg: "#5a1a3a" },
  BAO_TRI: { label: "Bảo trì", color: "#ef4444", bg: "#3f1a1a" },
  KHAC:   { label: "Khác",   color: "#64748b", bg: "#1e293b" },
};

function resolveLoai(loaiGhe, trangThai) {
  if (trangThai === "BAO_TRI") return "BAO_TRI";
  const key = (loaiGhe || "").toUpperCase();
  if (key.includes("VIP")) return "VIP";
  if (key.includes("DOI") || key.includes("ĐÔI") || key.includes("COUPLE")) return "DOI";
  if (key.includes("THUONG") || key.includes("THƯỜNG") || key.includes("STANDARD")) return "THUONG";
  return "KHAC";
}

// Sơ đồ ghế dạng grid, click để chọn / bỏ chọn
function SeatMapEditor({ ghes, selected, onToggle, paintMode, disabled }) {
  const rows = useMemo(() => {
    const map = {};
    ghes.forEach(g => {
      if (!map[g.hangGhe]) map[g.hangGhe] = [];
      map[g.hangGhe].push(g);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [ghes]);

  const maxCot = useMemo(() => Math.max(...ghes.map(g => Number(g.cotGhe) || 0), 1), [ghes]);

  return (
    <div className="pc-seatmap-wrap">
      <div className="pc-screen"><span>MÀN HÌNH</span></div>
      <div className="pc-rows">
        {rows.map(([hang, seats]) => (
          <div key={hang} className="pc-row">
            <span className="pc-row-label">{hang}</span>
            <div className="pc-seats" style={{ gridTemplateColumns: `repeat(${maxCot}, 34px)` }}>
              {seats.map(g => {
                const loaiKey = resolveLoai(g.loaiGhe, g.trangThai);
                const info = LOAI_GHE[loaiKey] || LOAI_GHE.KHAC;
                const isSel = selected.has(g.gheId);
                return (
                  <button
                    key={g.gheId}
                    type="button"
                    title={`${g.maGhe} — ${g.loaiGhe}`}
                    className={`pc-seat${isSel ? " pc-seat--sel" : ""}`}
                    style={{
                      background: isSel ? (LOAI_GHE[paintMode]?.color || info.color) : info.bg,
                      borderColor: isSel ? (LOAI_GHE[paintMode]?.color || info.color) : info.color + "88",
                      color: "#fff",
                    }}
                    onClick={() => !disabled && onToggle(g.gheId)}
                  >
                    {g.maGhe}
                  </button>
                );
              })}
            </div>
            <span className="pc-row-label">{hang}</span>
          </div>
        ))}
      </div>

      {/* Chú thích */}
      <div className="pc-legend">
        {Object.entries(LOAI_GHE).filter(([k]) => k !== "KHAC").map(([key, info]) => (
          <span key={key} className="pc-legend-item">
            <i style={{ background: info.color }} />
            {info.label}
          </span>
        ))}
        <span className="pc-legend-item pc-legend-item--sel">
          <i style={{ background: "#a5b4fc" }} />
          Đang chọn
        </span>
      </div>
    </div>
  );
}

export default function AdminPhongChieu() {
  const [phongs, setPhongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  // Form tạo/sửa phòng
  const initForm = () => ({ maPhong: "", tenPhong: "", loaiPhong: "THUONG", soHang: 8, soCot: 10, trangThai: "HOAT_DONG" });
  const [form, setForm] = useState(initForm());
  const [editingId, setEditingId] = useState(null);

  // Sơ đồ ghế
  const [viewPhong, setViewPhong] = useState(null); // phong đang xem
  const [ghes, setGhes] = useState([]);
  const [ghesLoading, setGhesLoading] = useState(false);
  const [selected, setSelected] = useState(new Set()); // Set<gheId>
  const [paintMode, setPaintMode] = useState("VIP"); // THUONG | VIP | DOI
  const [saving, setSaving] = useState(false);

  const loadPhongs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.adminPhongChieu();
      setPhongs(Array.isArray(data) ? data : []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadPhongs(); }, [loadPhongs]);

  async function loadGhe(phong) {
    setViewPhong(phong);
    setGhes([]);
    setSelected(new Set());
    setGhesLoading(true);
    try {
      const data = await api.adminGheTheoPhong(phong.phongChieuId);
      setGhes(Array.isArray(data) ? data : []);
    } catch (e) { setErr(e.message); }
    finally { setGhesLoading(false); }
  }

  function toggleSeat(gheId) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(gheId)) next.delete(gheId);
      else next.add(gheId);
      return next;
    });
  }

  function selectRow(hang) {
    const rowIds = ghes.filter(g => g.hangGhe === hang).map(g => g.gheId);
    setSelected(prev => {
      const next = new Set(prev);
      const allIn = rowIds.every(id => next.has(id));
      rowIds.forEach(id => allIn ? next.delete(id) : next.add(id));
      return next;
    });
  }

  function selectAll() {
    if (selected.size === ghes.length) setSelected(new Set());
    else setSelected(new Set(ghes.map(g => g.gheId)));
  }

  async function applyPaint() {
    if (!selected.size || !viewPhong) return;
    setSaving(true); setErr(""); setSuccess("");
    try {
      const items = Array.from(selected).map(gheId => ({ gheId, maLoai: paintMode }));
      await api.adminBulkCapNhatLoaiGhe(viewPhong.phongChieuId, items);
      setSuccess(`Đã gán ${selected.size} ghế thành loại ${LOAI_GHE[paintMode]?.label || paintMode}.`);
      setSelected(new Set());
      await loadGhe(viewPhong);
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(""); setSuccess("");
    try {
      if (editingId) {
        await api.adminCapNhatPhongChieu(editingId, {
          maPhong: form.maPhong, tenPhong: form.tenPhong,
          loaiPhong: form.loaiPhong, trangThai: form.trangThai
        });
        setSuccess("Đã cập nhật phòng chiếu.");
      } else {
        await api.adminTaoPhongChieu(form);
        setSuccess(`Đã tạo phòng "${form.tenPhong}" với ${form.soHang * form.soCot} ghế.`);
      }
      setForm(initForm()); setEditingId(null);
      await loadPhongs();
    } catch (e) { setErr(e.message); }
  }

  // Thống kê ghế theo loại trong phòng đang xem
  const gheStat = useMemo(() => {
    const stat = {};
    ghes.forEach(g => {
      const k = resolveLoai(g.loaiGhe, g.trangThai);
      stat[k] = (stat[k] || 0) + 1;
    });
    return stat;
  }, [ghes]);

  return (
    <section className="admin-card">
      <h2 className="admin-card-title">🏟 Quản lý Phòng chiếu & Ghế</h2>

      {err && <p className="admin-alert admin-alert-error">{err}</p>}
      {success && <p className="admin-alert admin-alert-success">{success}</p>}

      {/* Form tạo / sửa phòng */}
      <div className="pc-form-section">
        <h3 className="pc-section-title">{editingId ? "✏️ Sửa phòng chiếu" : "➕ Tạo phòng chiếu mới"}</h3>
        <form onSubmit={handleSubmit} className="admin-form-grid">
          <div>
            <label>Mã phòng</label>
            <input value={form.maPhong} onChange={e => setForm({ ...form, maPhong: e.target.value })} placeholder="P01" required />
          </div>
          <div>
            <label>Tên phòng</label>
            <input value={form.tenPhong} onChange={e => setForm({ ...form, tenPhong: e.target.value })} placeholder="Phòng chiếu 1" required />
          </div>
          <div>
            <label>Loại phòng</label>
            <select value={form.loaiPhong} onChange={e => setForm({ ...form, loaiPhong: e.target.value })}>
              <option value="THUONG">Thường</option>
              <option value="VIP">VIP</option>
              <option value="IMAX">IMAX</option>
              <option value="4DX">4DX</option>
            </select>
          </div>
          <div>
            <label>Trạng thái</label>
            <select value={form.trangThai} onChange={e => setForm({ ...form, trangThai: e.target.value })}>
              <option value="HOAT_DONG">Hoạt động</option>
              <option value="BAO_TRI">Bảo trì</option>
              <option value="DONG_CUA">Đóng cửa</option>
            </select>
          </div>
          {!editingId && (
            <>
              <div>
                <label>Số hàng ghế (1–26)</label>
                <input type="number" min="1" max="26" value={form.soHang}
                  onChange={e => setForm({ ...form, soHang: Number(e.target.value) })} required />
              </div>
              <div>
                <label>Số cột ghế (1–50)</label>
                <input type="number" min="1" max="50" value={form.soCot}
                  onChange={e => setForm({ ...form, soCot: Number(e.target.value) })} required />
              </div>
            </>
          )}
          <div style={{ alignSelf: "end", display: "flex", gap: 8 }}>
            <button type="submit" className="btn-action btn-primary">
              {editingId ? "Lưu thay đổi" : `Tạo phòng (${form.soHang * form.soCot} ghế)`}
            </button>
            {editingId && (
              <button type="button" className="btn-action btn-ghost"
                onClick={() => { setEditingId(null); setForm(initForm()); }}>Huỷ</button>
            )}
          </div>
        </form>
        {!editingId && (
          <p className="admin-field-hint">
            💡 Khi tạo phòng, hệ thống tự sinh ghế theo hàng (A–Z) × cột. Sau khi tạo, vào <strong>Sơ đồ ghế</strong> để gán loại VIP / Thường / Đôi.
          </p>
        )}
      </div>

      {/* Bảng danh sách phòng */}
      <div className="admin-table-wrap" style={{ marginTop: 24 }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã</th><th>Tên phòng</th><th>Loại</th>
              <th>Sức chứa</th><th>Trạng thái</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="admin-empty">Đang tải...</td></tr>
            ) : phongs.length === 0 ? (
              <tr><td colSpan={6} className="admin-empty">Chưa có phòng chiếu nào.</td></tr>
            ) : phongs.map(p => (
              <tr key={p.phongChieuId} className={viewPhong?.phongChieuId === p.phongChieuId ? "pc-row-active" : ""}>
                <td><strong>{p.maPhong}</strong></td>
                <td>{p.tenPhong}</td>
                <td>
                  <span className="pc-loai-badge">{p.loaiPhong}</span>
                </td>
                <td>{p.sucChua} ({p.soHang}×{p.soCot})</td>
                <td>
                  <span className={`pc-tt-badge${p.trangThai === "HOAT_DONG" ? " pc-tt-badge--ok" : ""}`}>
                    {p.trangThai === "HOAT_DONG" ? "Hoạt động" : p.trangThai === "BAO_TRI" ? "Bảo trì" : p.trangThai}
                  </span>
                </td>
                <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="btn-action btn-ghost" onClick={() => {
                    setEditingId(p.phongChieuId);
                    setForm({ maPhong: p.maPhong, tenPhong: p.tenPhong, loaiPhong: p.loaiPhong, soHang: p.soHang, soCot: p.soCot, trangThai: p.trangThai || "HOAT_DONG" });
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}>✏️ Sửa</button>
                  <button className="btn-action btn-primary" onClick={() => loadGhe(p)}>
                    {viewPhong?.phongChieuId === p.phongChieuId ? "🔄 Tải lại" : "🪑 Sơ đồ ghế"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Khu vực sơ đồ ghế */}
      {viewPhong && (
        <div className="pc-seatmap-section">
          <div className="pc-seatmap-header">
            <div>
              <h3 className="pc-seatmap-title">
                🪑 Sơ đồ ghế — {viewPhong.tenPhong}
                <span className="pc-seatmap-subtitle"> ({viewPhong.maPhong} · {viewPhong.sucChua} ghế)</span>
              </h3>
              <div className="pc-ghe-stat">
                {Object.entries(gheStat).map(([k, n]) => (
                  <span key={k} className="pc-stat-chip" style={{ borderColor: LOAI_GHE[k]?.color, color: LOAI_GHE[k]?.color }}>
                    {LOAI_GHE[k]?.label || k}: {n}
                  </span>
                ))}
              </div>
            </div>
            <button className="btn-action btn-ghost" onClick={() => { setViewPhong(null); setGhes([]); setSelected(new Set()); }}>
              ✕ Đóng
            </button>
          </div>

          {/* Toolbar gán loại ghế */}
          <div className="pc-toolbar">
            <div className="pc-toolbar-left">
              <span className="pc-toolbar-label">Bút vẽ:</span>
              {Object.entries(LOAI_GHE).filter(([k]) => k !== "KHAC").map(([key, info]) => (
                <button key={key} type="button"
                  className={`pc-paint-btn${paintMode === key ? " pc-paint-btn--active" : ""}`}
                  style={{ "--c": info.color }}
                  onClick={() => setPaintMode(key)}>
                  {info.label}
                </button>
              ))}
            </div>
            <div className="pc-toolbar-right">
              <span className="pc-sel-count">{selected.size > 0 ? `${selected.size} ghế đang chọn` : "Nhấn vào ghế để chọn"}</span>
              <button className="btn-action btn-ghost pc-select-all-btn" onClick={selectAll}>
                {selected.size === ghes.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
              <button className="btn-action btn-primary" onClick={applyPaint}
                disabled={selected.size === 0 || saving}>
                {saving ? "Đang lưu..." : `✓ Gán ${LOAI_GHE[paintMode]?.label} (${selected.size})`}
              </button>
            </div>
          </div>

          <p className="pc-toolbar-hint">
            💡 <strong>Hướng dẫn:</strong> Chọn bút vẽ loại ghế → Nhấp vào từng ghế hoặc chọn nhiều → Nhấn <em>"Gán"</em> để lưu.
          </p>

          {ghesLoading ? (
            <div className="pc-loading">
              {[...Array(40)].map((_, i) => <div key={i} className="pc-seat-skeleton" />)}
            </div>
          ) : ghes.length === 0 ? (
            <p className="admin-field-hint" style={{ textAlign: "center", padding: 32 }}>
              Phòng này chưa có ghế. Hãy tạo lại phòng với số hàng/cột.
            </p>
          ) : (
            <SeatMapEditor
              ghes={ghes}
              selected={selected}
              onToggle={toggleSeat}
              paintMode={paintMode}
            />
          )}
        </div>
      )}
    </section>
  );
}
