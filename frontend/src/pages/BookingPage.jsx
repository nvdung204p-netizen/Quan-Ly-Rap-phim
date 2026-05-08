import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, getToken } from "../services/api";

const money = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(n) || 0);

const LOAI_GHE_COLOR = { VIP: "#f59e0b", THUONG: "#3b82f6", DOI: "#ec4899" };
const LOAI_GHE_LABEL = { VIP: "VIP", THUONG: "Thường", DOI: "Đôi" };

function CountdownTimer({ expireMs, onExpired }) {
  const [remain, setRemain] = useState(Math.max(0, expireMs - Date.now()));
  useEffect(() => {
    if (expireMs <= 0) return;
    const t = setInterval(() => {
      const r = Math.max(0, expireMs - Date.now());
      setRemain(r);
      if (r === 0) { clearInterval(t); onExpired?.(); }
    }, 1000);
    return () => clearInterval(t);
  }, [expireMs, onExpired]);
  const m = Math.floor(remain / 60000);
  const s = Math.floor((remain % 60000) / 1000);
  const urgent = remain < 120000;
  if (remain === 0) return <span className="bk2-timer bk2-timer--expired">⏰ Đã hết thời gian giữ chỗ</span>;
  return (
    <span className={`bk2-timer${urgent ? " bk2-timer--urgent" : ""}`}>
      ⏱ Giữ chỗ còn: {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
}

function SeatMap({ ghe, picked, onToggle, disabled }) {
  const rows = useMemo(() => {
    const map = {};
    ghe.forEach(g => { if (!map[g.hangGhe]) map[g.hangGhe] = []; map[g.hangGhe].push(g); });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [ghe]);

  return (
    <div className="bk2-seatmap">
      <div className="bk2-screen"><span>MÀN HÌNH</span></div>
      <div className="bk2-rows">
        {rows.map(([hang, seats]) => (
          <div key={hang} className="bk2-row">
            <span className="bk2-row-label">{hang}</span>
            <div className="bk2-seats">
              {seats.map(g => {
                const isPicked = picked.includes(g.gheId);
                const color = LOAI_GHE_COLOR[g.loaiGhe] || "#3b82f6";
                return (
                  <button
                    key={g.gheId}
                    type="button"
                    className={`bk2-seat${g.daDat ? " bk2-seat--booked" : ""}${isPicked ? " bk2-seat--picked" : ""}${g.trangThai === "BAO_TRI" ? " bk2-seat--maintenance" : ""}`}
                    disabled={g.daDat || g.trangThai === "BAO_TRI" || disabled}
                    onClick={() => !g.daDat && g.trangThai !== "BAO_TRI" && onToggle(g)}
                    title={`${g.maGhe} — ${g.trangThai === "BAO_TRI" ? "Đang bảo trì" : (LOAI_GHE_LABEL[g.loaiGhe] || g.loaiGhe)}`}
                    style={isPicked ? { background: color, borderColor: color } : g.daDat || g.trangThai === "BAO_TRI" ? {} : { borderColor: color + "99" }}
                  >
                    {g.maGhe}
                  </button>
                );
              })}
            </div>
            <span className="bk2-row-label">{hang}</span>
          </div>
        ))}
      </div>
      <div className="bk2-legend">
        <span className="bk2-legend-item"><i style={{ background: "#1e3a5f", border: "1px solid #334155" }} />Trống</span>
        <span className="bk2-legend-item"><i style={{ background: "#3b82f6" }} />Thường (đã chọn)</span>
        <span className="bk2-legend-item"><i style={{ background: "#f59e0b" }} />VIP (đã chọn)</span>
        <span className="bk2-legend-item"><i style={{ background: "#374151", opacity: 0.5 }} />Đã đặt</span>
        <span className="bk2-legend-item"><i style={{ background: "#ef4444" }} />Bảo trì</span>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const suatChieuId = Number(searchParams.get("suatChieuId")) || 0;
  const donIdFromUrl = Number(searchParams.get("donDatVeId")) || 0;

  const [ghe, setGhe] = useState([]);
  const [suat, setSuat] = useState(null);
  const [picked, setPicked] = useState([]);
  const [loaiVeList, setLoaiVeList] = useState([]);
  const [ptttList, setPtttList] = useState([]);
  const [qrBanks, setQrBanks] = useState([]);
  // Map gheId → loaiVeId
  const [gheLoaiVe, setGheLoaiVe] = useState({});
  const [ptttId, setPtttId] = useState("");
  const [maKm, setMaKm] = useState(() => localStorage.getItem("savedPromoCode") || "");
  const [maGiaoDich, setMaGiaoDich] = useState("");
  const [don, setDon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [expireTime, setExpireTime] = useState(0);
  const me = useMemo(() => api.getMeFromToken(), []);

  const defaultLoaiVeId = useMemo(() => {
    if (!loaiVeList.length) return "";
    return String((loaiVeList.find(x => x.maLoai === "THUONG") || loaiVeList[0]).loaiVeId);
  }, [loaiVeList]);

  const loadPage = useCallback(async () => {
    if (!suatChieuId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [seats, suats, loai, pttt, qrList] = await Promise.all([
        api.soDoGhe(suatChieuId),
        api.suatChieu(),
        api.loaiVeDatVe(),
        api.phuongThucThanhToan(),
        api.qrThanhToanPublic().catch(() => [])
      ]);
      setGhe(seats || []);
      setSuat((suats || []).find(x => Number(x.suatChieuId) === suatChieuId) || null);
      setLoaiVeList(loai || []);
      const pt = pttt || [];
      setPtttList(pt);
      setQrBanks(Array.isArray(qrList) ? qrList : []);
      if (pt.length) {
        const preferred = pt.find(x => x.maPhuongThuc === "VI_DIEN_TU") || pt.find(x => x.maPhuongThuc === "CHUYEN_KHOAN") || pt[0];
        setPtttId(String(preferred.phuongThucThanhToanId));
      }
      setError("");
    } catch (e) {
      setError(e.message || "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  }, [suatChieuId]);

  useEffect(() => { loadPage(); }, [loadPage]);

  useEffect(() => {
    if (!donIdFromUrl || !getToken()) return;
    api.chiTietDon(donIdFromUrl).then(data => {
      if (!data) return;
      setDon({
        donDatVeId: data.donDatVeId, maDon: data.maDon,
        tongTienGoc: data.tongTienGoc, tongGiam: data.tongGiam,
        tongThanhToan: data.tongThanhToan, trangThai: data.trangThai,
        danhSachVe: data.danhSachVe || [],
        danhSachQrVe: (data.danhSachVe || []).map(v => v.qrVe).filter(Boolean)
      });
      if (data.trangThai === "CHO_THANH_TOAN") {
        setExpireTime(new Date(data.taoLuc).getTime() + 15 * 60 * 1000);
      }
    }).catch(() => {});
  }, [donIdFromUrl]);

  function toggleGhe(g) {
    if (g.daDat || don) return;
    setPicked(p => {
      if (p.includes(g.gheId)) {
        const next = { ...gheLoaiVe };
        delete next[g.gheId];
        setGheLoaiVe(next);
        return p.filter(i => i !== g.gheId);
      }
      setGheLoaiVe(prev => ({ ...prev, [g.gheId]: defaultLoaiVeId }));
      return [...p, g.gheId];
    });
    setError("");
  }

  const tongTienUocTinh = useMemo(() => {
    if (!picked.length || !loaiVeList.length) return 0;
    return picked.reduce((sum, gheId) => {
      const g = ghe.find(x => x.gheId === gheId);
      if (!g) return sum;
      const lvId = gheLoaiVe[gheId] || defaultLoaiVeId;
      // giá ước tính - thực tế backend tính
      return sum + 80000;
    }, 0);
  }, [picked, ghe, gheLoaiVe, defaultLoaiVeId, loaiVeList]);

  async function handleTaoDon() {
    if (!suatChieuId || !picked.length) { setError("Vui lòng chọn ít nhất một ghế."); return; }
    if (!getToken()) { setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại."); return; }
    setSubmitting(true); setError("");
    try {
      // Tạo đơn — backend tính giá theo ghế loại VIP/thường
      const d = await api.taoDon({
        suatChieuId, danhSachGheId: picked,
        loaiVeId: Number(defaultLoaiVeId),
        kenhDat: "ONLINE",
        maCodeGiamGia: maKm.trim() || undefined
      });
      setDon({ ...d, trangThai: "CHO_THANH_TOAN", danhSachQrVe: null });
      setExpireTime(Date.now() + 15 * 60 * 1000);
      setSearchParams({ suatChieuId: String(suatChieuId), donDatVeId: String(d.donDatVeId) }, { replace: true });
    } catch (e) {
      await loadPage();
      setError(e.message || "Tạo đơn thất bại.");
    } finally { setSubmitting(false); }
  }

  async function handleThanhToan() {
    if (!don?.donDatVeId || !ptttId) return;
    setSubmitting(true); setError("");
    try {
      const d = await api.thanhToan({
        donDatVeId: don.donDatVeId,
        phuongThucThanhToanId: Number(ptttId),
        maGiaoDich: maGiaoDich.trim() || undefined
      });
      const qrList = (d.danhSachVe || don.danhSachVe || []).map(v => v.qrVe).filter(Boolean);
      setDon(prev => ({ ...prev, trangThai: "DA_THANH_TOAN", danhSachQrVe: qrList.length ? qrList : d.danhSachQrVe || [] }));
    } catch (e) { setError(e.message || "Thanh toán thất bại."); }
    finally { setSubmitting(false); }
  }

  async function handleHuyDon() {
    if (!don?.donDatVeId || !window.confirm("Bạn có chắc muốn hủy đơn này?")) return;
    try {
      await api.huyDon(don.donDatVeId).catch(() => {});
      setDon(null); setPicked([]); setMaKm(""); setMaGiaoDich("");
      setSearchParams({ suatChieuId: String(suatChieuId) }, { replace: true });
      await loadPage();
    } catch (e) { setError(e.message); }
  }

  const ptttDangChon = ptttList.find(x => String(x.phuongThucThanhToanId) === ptttId);
  const laCK = ptttDangChon?.maPhuongThuc === "CHUYEN_KHOAN" || ptttDangChon?.maPhuongThuc === "VI_DIEN_TU";
  const laTienMat = ptttDangChon?.maPhuongThuc === "TIEN_MAT";
  const step = !don ? 1 : don.trangThai === "CHO_THANH_TOAN" ? 2 : 3;

  if (!suatChieuId) return (
    <div className="bk2-empty">
      <span>🎬</span>
      <h2>Chưa chọn suất chiếu</h2>
      <p>Hãy chọn phim và suất chiếu trước khi đặt vé.</p>
      <Link to="/lich-chieu" className="bk2-btn bk2-btn-primary">Xem lịch chiếu</Link>
    </div>
  );

  return (
    <div className="bk2-page">
      {/* Header thông tin suất chiếu */}
      {suat && (
        <div className="bk2-suat-info">
          {suat.posterUrl && <img src={suat.posterUrl} alt={suat.tenPhim} className="bk2-suat-poster" />}
          <div className="bk2-suat-detail">
            <h1 className="bk2-suat-title">{suat.tenPhim}</h1>
            <div className="bk2-suat-meta">
              <span>🏟 {suat.tenPhong}</span>
              <span>📅 {new Date(suat.thoiGianBatDau).toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric" })}</span>
              <span>🕐 {new Date(suat.thoiGianBatDau).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} → {new Date(suat.thoiGianKetThuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
              {suat.thoiLuongPhut && <span>⏱ {suat.thoiLuongPhut} phút</span>}
            </div>
            {me?.hoTen && <p className="bk2-buyer">Đặt cho: <strong>{me.hoTen}</strong></p>}
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="bk2-steps">
        {["Chọn ghế", "Thanh toán", "Nhận vé"].map((label, i) => (
          <div key={i} className={`bk2-step${step >= i + 1 ? " bk2-step--done" : ""}${step === i + 1 ? " bk2-step--active" : ""}`}>
            <div className="bk2-step-num">{step > i + 1 ? "✓" : i + 1}</div>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {error && <div className="bk2-alert bk2-alert-error">⚠ {error}</div>}

      {loading && (
        <div className="bk2-loading">
          {[...Array(20)].map((_, i) => <div key={i} className="bk2-seat-skeleton" />)}
        </div>
      )}

      {!loading && step === 1 && (
        <div className="bk2-layout">
          <div className="bk2-left">
            <div className="bk2-section-title">Chọn ghế ngồi</div>
            <SeatMap ghe={ghe} picked={picked} onToggle={toggleGhe} disabled={false} />
          </div>

          <div className="bk2-right">
            <div className="bk2-sidebar-card">
              <div className="bk2-sidebar-title">Ghế đã chọn ({picked.length})</div>

              {picked.length === 0 ? (
                <p className="bk2-sidebar-empty">Nhấn vào ghế trên sơ đồ để chọn</p>
              ) : (
                <>
                  <div className="bk2-picked-list">
                    {picked.map(gheId => {
                      const g = ghe.find(x => x.gheId === gheId);
                      if (!g) return null;
                      return (
                        <div key={gheId} className="bk2-picked-item">
                          <div>
                            <strong>{g.maGhe}</strong>
                            <small style={{ color: LOAI_GHE_COLOR[g.loaiGhe] || "#94a3b8" }}> {LOAI_GHE_LABEL[g.loaiGhe] || g.loaiGhe}</small>
                          </div>
                          <select
                            value={gheLoaiVe[gheId] || defaultLoaiVeId}
                            onChange={e => setGheLoaiVe(prev => ({ ...prev, [gheId]: e.target.value }))}
                            className="bk2-loaive-select"
                          >
                            {loaiVeList.map(lv => <option key={lv.loaiVeId} value={lv.loaiVeId}>{lv.tenLoai}</option>)}
                          </select>
                          <button className="bk2-remove-seat" onClick={() => toggleGhe(g)}>✕</button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bk2-promo-row">
                    <input className="bk2-promo-input" type="text" value={maKm} onChange={e => setMaKm(e.target.value)} placeholder="Mã khuyến mãi (nếu có)" />
                  </div>

                  <button className="bk2-btn bk2-btn-primary bk2-btn-full" onClick={handleTaoDon} disabled={submitting}>
                    {submitting ? "Đang xử lý…" : `Đặt ${picked.length} ghế →`}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && don && step === 2 && (
        <div className="bk2-layout">
          <div className="bk2-left">
            <div className="bk2-section-title">Xác nhận đơn hàng</div>
            <div className="bk2-order-card">
              <div className="bk2-order-header">
                <div>
                  <div className="bk2-order-code">Mã đơn: <code>{don.maDon}</code></div>
                  <CountdownTimer expireMs={expireTime} onExpired={() => setError("Hết thời gian giữ chỗ. Vui lòng đặt lại.")} />
                </div>
                <button className="bk2-cancel-btn" onClick={handleHuyDon}>Hủy đơn</button>
              </div>

              <table className="bk2-order-table">
                <thead><tr><th>Ghế</th><th>Loại vé</th><th>Giá</th></tr></thead>
                <tbody>
                  {(don.danhSachVe || []).map(v => (
                    <tr key={v.veId || v.gheId}>
                      <td><strong>{v.maGhe}</strong></td>
                      <td>{v.tenLoaiVe || "Thường"}</td>
                      <td>{money(v.giaVe)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bk2-order-total">
                {don.tongGiam > 0 && <div className="bk2-order-row"><span>Giảm giá</span><span className="bk2-discount">−{money(don.tongGiam)}</span></div>}
                <div className="bk2-order-row bk2-order-row--total"><span>Tổng cộng</span><span>{money(don.tongThanhToan)}</span></div>
              </div>
            </div>
          </div>

          <div className="bk2-right">
            <div className="bk2-sidebar-card">
              <div className="bk2-sidebar-title">Phương thức thanh toán</div>
              <div className="bk2-pttt-list">
                {ptttList.map(pt => (
                  <label key={pt.phuongThucThanhToanId} className={`bk2-pttt-item${String(pt.phuongThucThanhToanId) === ptttId ? " bk2-pttt-item--active" : ""}`}>
                    <input type="radio" name="pttt" value={pt.phuongThucThanhToanId}
                      checked={String(pt.phuongThucThanhToanId) === ptttId}
                      onChange={e => setPtttId(e.target.value)} />
                    <span>{pt.tenPhuongThuc}</span>
                  </label>
                ))}
              </div>

              {laTienMat && (
                <div className="bk2-info-box">
                  💵 Vui lòng đến quầy vé trước giờ chiếu để thanh toán và nhận vé.
                </div>
              )}

              {laCK && qrBanks.length > 0 && (
                <div className="bk2-qr-section">
                  <p className="bk2-qr-amount">Số tiền: <strong>{money(don.tongThanhToan)}</strong></p>
                  <p className="bk2-qr-note">Nội dung CK: <code>{don.maDon}</code></p>
                  <div className="bk2-qr-banks">
                    {qrBanks.map(q => (
                      <div key={q.qrThanhToanId} className="bk2-qr-bank-item">
                        <p className="bk2-qr-bank-name">{q.tenHienThi}</p>
                        <img src={q.urlAnhQr} alt={q.tenHienThi} className="bk2-qr-bank-img" loading="lazy" />
                        {q.huongDan && <p className="bk2-qr-bank-hint">{q.huongDan}</p>}
                      </div>
                    ))}
                  </div>
                  <label className="bk2-field-label">
                    Mã giao dịch (tuỳ chọn)
                    <input className="bk2-input" type="text" value={maGiaoDich} onChange={e => setMaGiaoDich(e.target.value)} placeholder="Để trống để tự sinh" />
                  </label>
                </div>
              )}

              {!laTienMat ? (
                <button className="bk2-btn bk2-btn-primary bk2-btn-full" onClick={handleThanhToan} disabled={submitting || !ptttId} style={{ marginTop: 16 }}>
                  {submitting ? "Đang xử lý…" : "✓ Xác nhận thanh toán"}
                </button>
              ) : (
                <Link to="/profile?tab=lich-su" className="bk2-btn bk2-btn-ghost bk2-btn-full" style={{ marginTop: 16, display: 'block', textAlign: 'center' }}>
                  ✓ Xem đơn trong lịch sử (Chờ thanh toán)
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && don && step === 3 && (
        <div className="bk2-success">
          <div className="bk2-success-icon">🎉</div>
          <h2 className="bk2-success-title">Đặt vé thành công!</h2>
          <p className="bk2-success-sub">Cảm ơn bạn đã đặt vé. Mã đơn: <code>{don.maDon}</code></p>
          <p className="bk2-success-sub">Tổng thanh toán: <strong>{money(don.tongThanhToan)}</strong></p>

          {don.danhSachQrVe?.length > 0 && (
            <div className="bk2-tickets">
              <div className="bk2-tickets-title">🎟 Vé của bạn (xuất trình khi vào rạp)</div>
              <div className="bk2-tickets-grid">
                {don.danhSachQrVe.map((qr, i) => {
                  const ve = don.danhSachVe?.[i];
                  return (
                    <div key={qr} className="bk2-ticket-card">
                      <div className="bk2-ticket-header">
                        <span>Vé {i + 1}</span>
                        {ve && <span>Ghế {ve.maGhe}</span>}
                      </div>
                      <div className="bk2-ticket-qr-wrap">
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(qr)}&bgcolor=ffffff&color=000000`}
                          alt={`QR vé ${i + 1}`}
                          className="bk2-ticket-qr"
                          loading="lazy"
                        />
                      </div>
                      <code className="bk2-ticket-code">{qr}</code>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bk2-success-actions">
            <Link to="/profile?tab=lich-su" className="bk2-btn bk2-btn-primary">📋 Lịch sử đặt vé</Link>
            <Link to="/phim" className="bk2-btn bk2-btn-ghost">🎬 Đặt thêm vé</Link>
          </div>
        </div>
      )}
    </div>
  );
}
