import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

const money = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(n) || 0);

const fmtDate = (d) => (d ? new Date(d).toLocaleString("vi-VN") : "—");
const fmtDateOnly = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "—");

const TRANG_THAI_DON = {
  CHO_THANH_TOAN: { label: "Chờ thanh toán", color: "#f59e0b" },
  DA_THANH_TOAN:  { label: "Đã thanh toán",  color: "#10b981" },
  HUY:            { label: "Đã huỷ",          color: "#ef4444" },
  HOAN_TIEN:      { label: "Hoàn tiền",        color: "#8b5cf6" },
};

const HANG_TV = {
  THUONG: { label: "Thành viên Thường", color: "#64748b", pct: 10, icon: "🥈" },
  VIP:    { label: "Thành viên VIP",    color: "#d97706", pct: 20, icon: "👑" },
};

/* ─── In vé ─── */
function printVe(don) {
  const veHtml = don.danhSachVe
    .map(
      (v) => `
      <div class="ve-card">
        <div class="ve-title">${v.tenPhim}</div>
        <div class="ve-row"><span>Phòng</span><span>${v.tenPhong} (${v.maPhong})</span></div>
        <div class="ve-row"><span>Suất chiếu</span><span>${fmtDate(v.thoiGianBatDau)}</span></div>
        <div class="ve-row"><span>Ghế</span><span>${v.maGhe} — ${v.loaiGhe}</span></div>
        <div class="ve-row"><span>Loại vé</span><span>${v.loaiVe}</span></div>
        <div class="ve-row"><span>Giá</span><span>${money(v.giaVe)}</span></div>
        <div class="ve-qr"><strong>Mã vé:</strong><br/><code>${v.maQrVe || "Chưa có mã"}</code></div>
        <div class="ve-status">${v.daCheckin ? "✅ Đã check-in" : "⏳ Chưa check-in"}</div>
      </div>`
    )
    .join("");

  const win = window.open("", "_blank");
  win.document.write(`
    <!DOCTYPE html><html><head>
    <meta charset="utf-8"/>
    <title>Vé — ${don.maDon}</title>
    <style>
      body{font-family:sans-serif;padding:24px;color:#111}
      h2{text-align:center;margin-bottom:4px}
      .meta{text-align:center;color:#666;margin-bottom:20px;font-size:13px}
      .ve-card{border:1.5px solid #ddd;border-radius:10px;padding:16px;margin-bottom:16px;break-inside:avoid}
      .ve-title{font-size:17px;font-weight:700;margin-bottom:10px;color:#1e3a5f}
      .ve-row{display:flex;justify-content:space-between;font-size:13px;padding:3px 0;border-bottom:1px dashed #eee}
      .ve-qr{margin-top:10px;background:#f8f8f8;padding:10px;border-radius:6px;font-size:13px;word-break:break-all}
      .ve-qr code{display:block;margin-top:4px;font-size:14px;font-weight:600;color:#1e3a5f}
      .ve-status{text-align:right;font-size:12px;margin-top:8px;color:#555}
      .summary{background:#f0f7ff;border-radius:8px;padding:12px;margin-bottom:20px;font-size:13px}
      .summary b{float:right}
      @media print{body{padding:0}button{display:none}}
    </style>
    </head><body>
    <h2>🎬 Vé Xem Phim</h2>
    <div class="meta">Mã đơn: <strong>${don.maDon}</strong> &nbsp;|&nbsp; Ngày đặt: ${fmtDate(don.taoLuc)}</div>
    <div class="summary">
      Tổng tiền: <b>${money(don.tongTienGoc)}</b><br/>
      ${don.tongGiam > 0 ? `Giảm giá: <b>-${money(don.tongGiam)}</b><br/>` : ""}
      Thanh toán: <b style="color:#10b981">${money(don.tongThanhToan)}</b>
    </div>
    ${veHtml}
    <div style="text-align:center;margin-top:20px">
      <button onclick="window.print()" style="padding:10px 28px;background:#1e3a5f;color:#fff;border:none;border-radius:6px;font-size:14px;cursor:pointer">🖨 In vé</button>
    </div>
    </body></html>`);
  win.document.close();
}

/* ─── Modal chi tiết đơn ─── */
function ModalChiTietDon({ don, onClose }) {
  const modalRef = useRef();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!don) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === modalRef.current && onClose()}
    >
      <div className="modal-box" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>Chi tiết đơn #{don.maDon}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="don-info-grid">
          <span>Trạng thái</span>
          <span style={{ color: TRANG_THAI_DON[don.trangThai]?.color || "#666", fontWeight: 700 }}>
            {TRANG_THAI_DON[don.trangThai]?.label || don.trangThai}
          </span>
          <span>Ngày đặt</span><span>{fmtDate(don.taoLuc)}</span>
          <span>Kênh đặt</span><span>{don.kenhDat === "ONLINE" ? "🌐 Online" : "🏢 Tại quầy"}</span>
          {don.thanhToan && (<><span>Thanh toán qua</span><span>{don.thanhToan.phuongThuc}</span></>)}
          <span>Tổng gốc</span><span>{money(don.tongTienGoc)}</span>
          {don.tongGiam > 0 && (<><span>Giảm giá</span><span style={{ color: "#10b981" }}>-{money(don.tongGiam)}</span></>)}
          <span style={{ fontWeight: 700 }}>Thanh toán</span>
          <span style={{ fontWeight: 700, color: "#1e3a5f" }}>{money(don.tongThanhToan)}</span>
        </div>

        <h4 style={{ margin: "16px 0 8px" }}>Danh sách vé ({don.danhSachVe?.length || 0} vé)</h4>
        <div className="ve-list">
          {(don.danhSachVe || []).map((v) => (
            <div key={v.veId} className="ve-item-card">
              <div className="ve-item-head">
                <strong>{v.tenPhim}</strong>
                <span className={`ve-badge ${v.daCheckin ? "checked" : ""}`}>
                  {v.daCheckin ? "✅ Đã check-in" : "⏳ Chưa dùng"}
                </span>
              </div>
              <div className="ve-item-row">
                <span>🕐 {fmtDate(v.thoiGianBatDau)}</span>
                <span>🎭 {v.tenPhong}</span>
              </div>
              <div className="ve-item-row">
                <span>💺 Ghế <strong>{v.maGhe}</strong> — {v.loaiGhe}</span>
                <span>🎫 {v.loaiVe}</span>
              </div>
              <div className="ve-item-row">
                <span>💰 {money(v.giaVe)}</span>
                {v.checkinLuc && <span>⏱ Check-in: {fmtDate(v.checkinLuc)}</span>}
              </div>
              <div className="ve-qr-box">
                <span className="ve-qr-label">Mã QR vé:</span>
                <code className="ve-qr-code">{v.maQrVe || "Chưa có mã (chưa thanh toán)"}</code>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          {don.trangThai === "CHO_THANH_TOAN" && (
            <Link
              to={`/dat-ve?donDatVeId=${don.donDatVeId}`}
              className="btn-action btn-primary"
              onClick={onClose}
            >
              💳 Thanh toán ngay
            </Link>
          )}
          {don.trangThai === "DA_THANH_TOAN" && (
            <button className="btn-action btn-print" onClick={() => printVe(don)}>
              🖨 In vé / Tải PDF
            </button>
          )}
          <button className="btn-action btn-ghost" onClick={onClose}>Đóng</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   TABS
══════════════════════════════════════════ */

function TabThongTin({ user, setToken }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [vaiTroHienThi, setVaiTroHienThi] = useState(user?.vaiTro || []);
  const [form, setForm] = useState({ hoTen: "", email: "", soDienThoai: "" });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await api.hoSoCaNhan();
        if (cancelled) return;
        setForm({ hoTen: data.hoTen ?? "", email: data.email ?? "", soDienThoai: data.soDienThoai ?? "" });
        if (Array.isArray(data.vaiTro)) setVaiTroHienThi(data.vaiTro);
      } catch (e) { if (!cancelled) setErr(e.message); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  async function onLuu(ev) {
    ev.preventDefault();
    setErr(""); setSuccess("");
    if (!form.hoTen.trim()) { setErr("Vui lòng nhập họ tên."); return; }
    if (!form.email.trim() && !form.soDienThoai.trim()) { setErr("Cần ít nhất email hoặc SĐT."); return; }
    setSaving(true);
    try {
      const data = await api.capNhatHoSo({ hoTen: form.hoTen.trim(), email: form.email.trim(), soDienThoai: form.soDienThoai.trim() });
      if (data.accessToken) { localStorage.setItem("accessToken", data.accessToken); setToken(data.accessToken); }
      setForm({ hoTen: data.hoTen ?? "", email: data.email ?? "", soDienThoai: data.soDienThoai ?? "" });
      if (Array.isArray(data.vaiTro)) setVaiTroHienThi(data.vaiTro);
      setSuccess("Đã lưu thông tin cá nhân.");
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  if (loading) return <p className="profile-muted">Đang tải…</p>;
  return (
    <div className="profile-card">
      <h3>Thông tin cá nhân</h3>
      {err && <p className="profile-alert profile-alert--error">{err}</p>}
      {success && <p className="profile-alert profile-alert--success">{success}</p>}
      <form className="profile-form" onSubmit={onLuu}>
        <label className="profile-label">Họ và tên
          <input value={form.hoTen} onChange={(e) => setForm({ ...form, hoTen: e.target.value })} placeholder="Nguyễn Văn A" required />
        </label>
        <label className="profile-label">Email
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
        </label>
        <label className="profile-label">Số điện thoại
          <input value={form.soDienThoai} onChange={(e) => setForm({ ...form, soDienThoai: e.target.value })} placeholder="09xxxxxxxx" />
        </label>
        <div className="profile-form-meta">
          <span>Mã tài khoản: <strong>{user?.taiKhoanId}</strong></span>
          <span>Vai trò: {vaiTroHienThi?.length ? vaiTroHienThi.join(", ") : "—"}</span>
        </div>
        <button type="submit" className="profile-btn-save" disabled={saving}>
          {saving ? "Đang lưu…" : "Lưu thay đổi"}
        </button>
      </form>
    </div>
  );
}



function TabLichSuVe() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selectedDon, setSelectedDon] = useState(null);
  const [loadingDon, setLoadingDon] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const data = await api.lichSuDatVe();
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) { setErr(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  async function xemChiTiet(donDatVeId) {
    setLoadingDon(true);
    try {
      const data = await api.chiTietVeDayDu(donDatVeId);
      setSelectedDon(data);
    } catch (e) { alert(e.message); }
    finally { setLoadingDon(false); }
  }

  if (loading) return <p className="profile-muted">Đang tải lịch sử…</p>;
  if (err) return <p className="profile-alert profile-alert--error">{err}</p>;
  if (!orders.length) return (
    <div className="profile-card empty-state">
      <div style={{ fontSize: 48 }}>🎟</div>
      <p>Bạn chưa có đơn đặt vé nào.</p>
      <Link to="/lich-chieu" className="profile-btn-save" style={{ display: "inline-block", textDecoration: "none", textAlign: "center" }}>Xem lịch chiếu</Link>
    </div>
  );

  return (
    <>
      {selectedDon && (
        <ModalChiTietDon don={selectedDon} onClose={() => setSelectedDon(null)} />
      )}
      {loadingDon && <p className="profile-muted">Đang tải chi tiết…</p>}
      <div className="order-list">
        {orders.map((o) => {
          const tt = TRANG_THAI_DON[o.trangThai] || { label: o.trangThai, color: "#888" };
          return (
            <div key={o.donDatVeId} className="order-card">
              <div className="order-head">
                <div>
                  <span className="order-ma">{o.maDon}</span>
                  <span className="order-status" style={{ background: tt.color }}>{tt.label}</span>
                </div>
                <span className="order-date">{fmtDate(o.taoLuc)}</span>
              </div>
              {o.tenPhim && (
                <div className="order-phim">
                  <strong>{o.tenPhim}</strong>
                  {o.thoiGianBatDau && <span> · {fmtDate(o.thoiGianBatDau)}</span>}
                  {o.tenPhong && <span> · {o.tenPhong}</span>}
                </div>
              )}
              <div className="order-meta">
                <span>🎫 {o.soVe} vé</span>
                <span>💰 {money(o.tongThanhToan)}</span>
                {o.tongGiam > 0 && <span className="order-giam">Giảm {money(o.tongGiam)}</span>}
              </div>
              <div className="order-actions">
                <button
                  className="btn-action btn-view"
                  onClick={() => xemChiTiet(o.donDatVeId)}
                  disabled={loadingDon}
                >
                  👁 Xem chi tiết
                </button>
                {o.trangThai === "CHO_THANH_TOAN" && (
                  <button
                    className="btn-action btn-primary"
                    onClick={() => navigate(`/dat-ve?donDatVeId=${o.donDatVeId}`)}
                  >
                    💳 Thanh toán
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─── Thẻ thành viên ─── */
const HANG_CONFIG = {
  THUONG: { label: "Thành viên Thường", icon: "🥈", color: "#64748b", gradient: "linear-gradient(135deg,#334155,#1e293b)", pct: 5 },
  VIP:    { label: "Thành viên VIP",    icon: "👑", color: "#d97706", gradient: "linear-gradient(135deg,#92400e,#78350f)", pct: 15 },
  VANG:   { label: "Thành viên Vàng",   icon: "🌟", color: "#eab308", gradient: "linear-gradient(135deg,#a16207,#854d0e)", pct: 20 },
};

function MemberCard({ the }) {
  const hang = HANG_CONFIG[the.tenHang?.toUpperCase()] || HANG_CONFIG.THUONG;
  const isExpired = the.ngayHetHan && new Date(the.ngayHetHan) < new Date();
  return (
    <div className="tv-card" style={{ background: hang.gradient }}>
      <div className="tv-card-top">
        <div>
          <div className="tv-hang-icon">{hang.icon}</div>
          <div className="tv-hang-label">{hang.label}</div>
        </div>
        <div className="tv-logo">NCC Cinema</div>
      </div>
      <div className="tv-card-mid">
        <div className="tv-ma-the">{the.maThe}</div>
        <div className={`tv-status${isExpired ? " tv-status--exp" : ""}`}>
          {isExpired ? "❌ Hết hạn" : "✅ Đang hoạt động"}
        </div>
      </div>
      <div className="tv-card-bot">
        <div className="tv-field">
          <span>Ngày phát hành</span>
          <strong>{the.ngayPhatHanh ? new Date(the.ngayPhatHanh).toLocaleDateString("vi-VN") : "—"}</strong>
        </div>
        <div className="tv-field">
          <span>Hết hạn</span>
          <strong>{the.ngayHetHan ? new Date(the.ngayHetHan).toLocaleDateString("vi-VN") : "—"}</strong>
        </div>
        <div className="tv-field">
          <span>Điểm tích lũy</span>
          <strong style={{ color: "#fbbf24" }}>{Number(the.diemKhaDung || 0).toLocaleString("vi-VN")} điểm</strong>
        </div>
      </div>
    </div>
  );
}

function TabTheThanhVien({ user }) {
  const [the, setThe] = useState(undefined); // undefined = chưa tải; null = chưa có thẻ
  const [hangs, setHangs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    Promise.all([api.theCuaToi(), api.hangThanhVien()])
      .then(([tv, hg]) => {
        setThe(tv);
        setHangs(Array.isArray(hg) ? hg : []);
      })
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleDangKy() {
    if (!window.confirm("Bạn muốn đăng ký thẻ thành viên miễn phí?\nBạn sẽ được tặng 100 điểm chào mừng!")) return;
    setRegistering(true); setErr(""); setSuccess("");
    try {
      const result = await api.dangKyTheThanhVien();
      setThe(result);
      setSuccess("🎉 Đăng ký thành công! Bạn đã được tặng 100 điểm chào mừng.");
    } catch (e) { setErr(e.message); }
    finally { setRegistering(false); }
  }

  if (loading) return <div className="tv-loading"><div className="bao-cao-spinner" /></div>;

  return (
    <div className="tv-page">
      {err && <p className="admin-alert admin-alert-error">{err}</p>}
      {success && <p className="admin-alert admin-alert-success">{success}</p>}

      {/* Đã có thẻ */}
      {the ? (
        <>
          <MemberCard the={the} />

          {/* Quyền lợi */}
          <div className="tv-benefits">
            <h3 className="tv-section-title">🎁 Quyền lợi thành viên</h3>
            <div className="tv-benefit-grid">
              {[
                { icon: "🎟", title: "Ưu tiên đặt vé", desc: "Đặt vé sớm hơn 24h trước khi mở bán đại trà" },
                { icon: "💰", title: "Giảm giá exclusive", desc: `Giảm tới ${HANG_CONFIG[the.tenHang?.toUpperCase()]?.pct || 5}% mỗi lần đặt vé` },
                { icon: "⭐", title: "Tích điểm thưởng", desc: "Mỗi 10.000đ được 1 điểm, đổi vé hoặc combo bắp nước" },
                { icon: "🎂", title: "Ưu đãi sinh nhật", desc: "1 vé miễn phí trong tháng sinh nhật" },
                { icon: "📱", title: "App độc quyền", desc: "Xem lịch sử vé, điểm thưởng và nhận thông báo" },
                { icon: "🚀", title: "Nâng hạng VIP", desc: "Đạt 500 điểm để lên hạng VIP với nhiều ưu đãi hơn" },
              ].map((b, i) => (
                <div key={i} className="tv-benefit-card">
                  <span className="tv-benefit-icon">{b.icon}</span>
                  <div><strong>{b.title}</strong><p>{b.desc}</p></div>
                </div>
              ))}
            </div>
          </div>

          {/* Điểm & tiến trình lên hạng */}
          <div className="tv-progress-section">
            <div className="tv-progress-header">
              <span>Tiến trình lên hạng VIP</span>
              <span className="tv-progress-pts">{Number(the.diemKhaDung || 0)} / 500 điểm</span>
            </div>
            <div className="tv-progress-bar">
              <div className="tv-progress-fill" style={{ width: `${Math.min((the.diemKhaDung / 500) * 100, 100)}%` }} />
            </div>
            <p className="tv-progress-hint">
              {the.diemKhaDung >= 500 ? "🎉 Đủ điều kiện nâng hạng VIP! Liên hệ quầy vé." : `Cần thêm ${500 - Number(the.diemKhaDung || 0)} điểm để lên VIP.`}
            </p>
          </div>
        </>
      ) : (
        /* Chưa có thẻ — form đăng ký */
        <div className="tv-register-page">
          <div className="tv-register-hero">
            <div className="tv-register-icon">💳</div>
            <h2>Tham gia NCC Club</h2>
            <p>Đăng ký thẻ thành viên miễn phí và nhận ngay 100 điểm chào mừng!</p>
          </div>

          {/* So sánh hạng */}
          <div className="tv-tiers">
            {Object.entries(HANG_CONFIG).map(([key, cfg]) => (
              <div key={key} className="tv-tier-card" style={{ "--tc": cfg.color }}>
                <div className="tv-tier-icon">{cfg.icon}</div>
                <div className="tv-tier-name">{cfg.label}</div>
                <div className="tv-tier-pct">Giảm {cfg.pct}%</div>
                <ul className="tv-tier-perks">
                  {key === "THUONG" && <>
                    <li>✓ Tích điểm mỗi lần đặt vé</li>
                    <li>✓ Ưu đãi sinh nhật</li>
                    <li>✓ Thông báo phim mới</li>
                  </>}
                  {key === "VIP" && <>
                    <li>✓ Tất cả quyền lợi Thường</li>
                    <li>✓ Ưu tiên chọn ghế VIP</li>
                    <li>✓ Combo bắp nước ưu đãi</li>
                  </>}
                  {key === "VANG" && <>
                    <li>✓ Tất cả quyền lợi VIP</li>
                    <li>✓ Vé miễn phí hàng tháng</li>
                    <li>✓ Quản gia cá nhân</li>
                  </>}
                </ul>
                {key === "THUONG" && <div className="tv-tier-start">Bắt đầu tại đây</div>}
                {key === "VIP" && <div className="tv-tier-req">Cần 500 điểm</div>}
                {key === "VANG" && <div className="tv-tier-req">Cần 2000 điểm</div>}
              </div>
            ))}
          </div>

          {/* Bước đăng ký */}
          <div className="tv-steps-section">
            <h3>Cách nhận thẻ thành viên</h3>
            <div className="tv-steps">
              {[
                { n: 1, title: "Nhấn đăng ký", desc: "Miễn phí, chỉ 1 lần duy nhất" },
                { n: 2, title: "Nhận 100 điểm", desc: "Điểm chào mừng được cộng ngay" },
                { n: 3, title: "Đặt vé & tích điểm", desc: "Mỗi đơn hàng thành công tích thêm điểm" },
                { n: 4, title: "Đổi ưu đãi", desc: "Dùng điểm đổi vé, combo và quà" },
              ].map(s => (
                <div key={s.n} className="tv-step">
                  <div className="tv-step-num">{s.n}</div>
                  <strong>{s.title}</strong>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 32 }}>
            <button className="tv-register-btn" onClick={handleDangKy} disabled={registering}>
              {registering ? "Đang xử lý..." : "🎉 Đăng ký thành viên miễn phí"}
            </button>
            <p className="tv-register-note">Hoàn toàn miễn phí · Không cần thẻ ngân hàng</p>
          </div>
        </div>
      )}
    </div>
  );
}

function TabDiemThuong() {
  return (
    <div className="profile-card">
      <h3>⭐ Lịch sử điểm thưởng</h3>
      <p className="profile-muted">
        Điểm thưởng tích lũy từ mỗi lần đặt vé thành công. Xem điểm hiện tại tại tab <strong>🎖 Thẻ thành viên</strong>.
      </p>
      <div className="diem-placeholder">
        <div style={{ fontSize: 48 }}>⭐</div>
        <p>Lịch sử chi tiết sắp ra mắt</p>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function ProfilePage({ user, setToken }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "info";

  const TABS = [
    { key: "info",   label: "👤 Thông tin" },
    { key: "the",    label: "🎖 Thẻ thành viên" },
    { key: "lich-su", label: "🎟 Lịch sử vé" },
    { key: "diem",   label: "⭐ Điểm thưởng" },
  ];

  return (
    <section className="profile-page">
      <div className="profile-page-head">
        <h2>Trang cá nhân</h2>
        {user?.hoTen && <p className="profile-muted">Xin chào, <strong>{user.hoTen}</strong>!</p>}
      </div>

      <nav className="profile-subnav" aria-label="Tab trang cá nhân">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`profile-tab-btn ${tab === t.key ? "is-active" : ""}`}
            onClick={() => setSearchParams({ tab: t.key })}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="profile-content">
        {tab === "info"    && <TabThongTin user={user} setToken={setToken} />}
        {tab === "the"     && <TabTheThanhVien user={user} />}
        {tab === "lich-su" && <TabLichSuVe />}
        {tab === "diem"    && <TabDiemThuong />}
      </div>
    </section>
  );
}
