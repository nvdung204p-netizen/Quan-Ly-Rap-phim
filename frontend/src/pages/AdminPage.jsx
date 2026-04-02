import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";

function formatDateTime(value) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function isToday(isoOrDate) {
  if (!isoOrDate) return false;
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

/** So với hôm nay (local): sau hôm nay → sắp chiếu; còn lại → đang chiếu. Chưa chọn ngày → SAP_CHIEU. */
function computeTrangThaiFromNgay(yyyyMmDd) {
  if (!yyyyMmDd || !String(yyyyMmDd).trim()) return "SAP_CHIEU";
  const [y, m, d] = String(yyyyMmDd)
    .split("-")
    .map((x) => parseInt(x, 10));
  if (!y || !m || !d) return "SAP_CHIEU";
  const release = new Date(y, m - 1, d);
  release.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return release > today ? "SAP_CHIEU" : "DANG_CHIEU";
}

const initialPhimForm = () => ({
  tenPhim: "",
  theLoai: "",
  daoDien: "",
  dienVien: "",
  thoiLuongPhut: "",
  gioiHanTuoi: "T16",
  ngonNgu: "Tiếng Việt",
  ngayKhoiChieu: "",
  posterUrl: "",
  trailerUrl: "",
  trangThai: "SAP_CHIEU",
  trangThaiTuDong: true
});

export default function AdminPage() {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "tong-quan";

  const [phim, setPhim] = useState([]);
  const [suats, setSuats] = useState([]);

  const [selectedPhimId, setSelectedPhimId] = useState(0);
  const [p, setP] = useState(initialPhimForm);
  const [s, setS] = useState({
    phimId: 0,
    phongChieuId: 1,
    thoiGianBatDau: "",
    thoiGianKetThuc: "",
    trangThai: "DANG_MO_BAN"
  });

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [posterUploading, setPosterUploading] = useState(false);
  const [trailerUploading, setTrailerUploading] = useState(false);
  const [posterLocalUrl, setPosterLocalUrl] = useState(null);

  useEffect(() => {
    return () => {
      if (posterLocalUrl) URL.revokeObjectURL(posterLocalUrl);
    };
  }, [posterLocalUrl]);

  async function loadPhim() {
    try {
      const list = await api.phim();
      setPhim(Array.isArray(list) ? list : []);
    } catch {
      setPhim([]);
    }
  }

  async function loadSuats() {
    try {
      const list = await api.suatChieu();
      setSuats(Array.isArray(list) ? list : []);
    } catch {
      setSuats([]);
    }
  }

  useEffect(() => {
    loadPhim();
    loadSuats();
  }, []);

  useEffect(() => {
    if (!p.trangThaiTuDong) return;
    const next = computeTrangThaiFromNgay(p.ngayKhoiChieu);
    setP((prev) => (prev.trangThai === next ? prev : { ...prev, trangThai: next }));
  }, [p.ngayKhoiChieu, p.trangThaiTuDong]);

  useEffect(() => {
    if (!phim.length) return;
    if (selectedPhimId) return;
    const firstId = phim[0].phimId;
    setSelectedPhimId(firstId);
    setS((prev) => ({ ...prev, phimId: prev.phimId || firstId }));
  }, [phim, selectedPhimId]);

  const suatsHomNay = useMemo(() => suats.filter((x) => isToday(x.thoiGianBatDau)).length, [suats]);

  const suatsForTable = useMemo(() => {
    const list = selectedPhimId
      ? suats.filter((x) => Number(x.phimId) === Number(selectedPhimId))
      : suats;

    return [...list].sort((a, b) => new Date(a.thoiGianBatDau) - new Date(b.thoiGianBatDau));
  }, [suats, selectedPhimId]);

  async function handlePosterFile(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Vui lòng chọn file ảnh (jpg, png, webp...).");
      return;
    }
    setErr("");
    if (posterLocalUrl) {
      URL.revokeObjectURL(posterLocalUrl);
      setPosterLocalUrl(null);
    }
    const local = URL.createObjectURL(file);
    setPosterLocalUrl(local);
    setPosterUploading(true);
    try {
      const url = await api.uploadPoster(file);
      setP((prev) => ({ ...prev, posterUrl: url }));
      URL.revokeObjectURL(local);
      setPosterLocalUrl(null);
      setSuccess("Đã tải ảnh poster lên máy chủ.");
    } catch (e) {
      setErr(e.message);
      URL.revokeObjectURL(local);
      setPosterLocalUrl(null);
      setP((prev) => ({ ...prev, posterUrl: "" }));
    } finally {
      setPosterUploading(false);
    }
  }

  async function handleTrailerFile(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    const okType = file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
    if (!okType) {
      setErr("Vui lòng chọn file video (mp4, webm, mov, mkv).");
      return;
    }
    setErr("");
    setTrailerUploading(true);
    try {
      const url = await api.uploadTrailer(file);
      setP((prev) => ({ ...prev, trailerUrl: url }));
      setSuccess("Đã tải trailer lên máy chủ.");
    } catch (e) {
      setErr(e.message);
      setP((prev) => ({ ...prev, trailerUrl: "" }));
    } finally {
      setTrailerUploading(false);
    }
  }

  async function taoPhim() {
    try {
      setErr("");
      setSuccess("");

      if (!p.tenPhim.trim()) {
        setErr("Vui lòng nhập tên phim.");
        return;
      }

      let thoiLuongPhut = null;
      if (p.thoiLuongPhut !== "" && p.thoiLuongPhut != null) {
        const n = Number(p.thoiLuongPhut);
        if (Number.isNaN(n) || n < 1) {
          setErr("Thời lượng (phút) phải là số dương.");
          return;
        }
        thoiLuongPhut = n;
      }

      const trangThaiGui = p.trangThaiTuDong ? computeTrangThaiFromNgay(p.ngayKhoiChieu) : p.trangThai;

      const created = await api.taoPhim({
        tenPhim: p.tenPhim.trim(),
        theLoai: p.theLoai.trim() || null,
        daoDien: p.daoDien.trim() || null,
        dienVien: p.dienVien.trim() || null,
        thoiLuongPhut,
        gioiHanTuoi: p.gioiHanTuoi.trim() || null,
        ngayKhoiChieu: p.ngayKhoiChieu || null,
        ngonNgu: p.ngonNgu.trim() || null,
        posterUrl: p.posterUrl.trim() || null,
        trangThai: trangThaiGui
      });

      const phimId = created?.phimId;
      if (phimId && p.trailerUrl.trim()) {
        try {
          await api.taoTrailerPhim(phimId, {
            tieuDe: "Trailer",
            trailerUrl: p.trailerUrl.trim(),
            thuTuHienThi: 1
          });
        } catch (te) {
          setErr(`Đã tạo phim nhưng thêm trailer thất bại: ${te.message}`);
          await loadPhim();
          return;
        }
      }

      setSuccess("Tạo phim thành công.");
      if (posterLocalUrl) {
        URL.revokeObjectURL(posterLocalUrl);
        setPosterLocalUrl(null);
      }
      setP(initialPhimForm());
      await loadPhim();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function taoSuat() {
    try {
      setErr("");
      setSuccess("");

      if (!s.phimId) {
        setErr("Vui lòng chọn phim.");
        return;
      }
      if (!s.phongChieuId) {
        setErr("Vui lòng nhập phòng chiếu.");
        return;
      }
      if (!s.thoiGianBatDau || !s.thoiGianKetThuc) {
        setErr("Vui lòng chọn thời gian bắt đầu/kết thúc.");
        return;
      }

      await api.taoSuatChieu({
        ...s,
        phimId: Number(s.phimId),
        phongChieuId: Number(s.phongChieuId)
      });

      setSuccess("Đã tạo suất chiếu.");
      await loadSuats();
    } catch (e) {
      setErr(e.message);
    }
  }

  const titles = {
    "tong-quan": { h: "Tổng quan", sub: "Số liệu nhanh hệ thống rạp" },
    phim: { h: "Quản lý phim", sub: "Thêm phim và xem danh sách" },
    suat: { h: "Quản lý suất chiếu", sub: "Tạo lịch chiếu và theo dõi suất" }
  };
  const head = titles[tab] || titles["tong-quan"];

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">{head.h}</h1>
          <p className="admin-page-sub">{head.sub}</p>
        </div>
      </div>

      {err && <p className="admin-alert admin-alert-error">{err}</p>}
      {success && <p className="admin-alert admin-alert-success">{success}</p>}

      {tab === "tong-quan" && (
        <>
          <div className="admin-stat-grid">
            <article className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon--film">🎬</div>
              <div>
                <p className="admin-stat-label">Tổng phim</p>
                <p className="admin-stat-value">{phim.length}</p>
              </div>
            </article>
            <article className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon--ticket">🎫</div>
              <div>
                <p className="admin-stat-label">Tổng suất chiếu</p>
                <p className="admin-stat-value">{suats.length}</p>
              </div>
            </article>
            <article className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon--today">📅</div>
              <div>
                <p className="admin-stat-label">Suất hôm nay</p>
                <p className="admin-stat-value">{suatsHomNay}</p>
              </div>
            </article>
          </div>

          <section className="admin-card">
            <h2 className="admin-card-title">Thao tác nhanh</h2>
            <p className="admin-card-hint">Dùng menu bên trái để thêm phim hoặc xếp suất chiếu.</p>
          </section>
        </>
      )}

      {tab === "phim" && (
        <section className="admin-card">
          <h2 className="admin-card-title">Tạo phim mới</h2>
          <p className="admin-card-hint admin-card-hint--tight">
            Trạng thái có thể <strong>tự chọn theo ngày khởi chiếu</strong> (bật ô bên dưới).
          </p>

          <div className="admin-form-grid">
            <div className="admin-form-span-2">
              <label>Ảnh phim</label>
              <div className="admin-poster-file-row">
                <label className={`admin-file-btn ${posterUploading ? "is-disabled" : ""}`}>
                  <input type="file" accept="image/*" onChange={handlePosterFile} disabled={posterUploading} />
                  {posterUploading ? "…" : "Up file"}
                </label>
              </div>
              <input
                type="url"
                placeholder="URL poster (tuỳ chọn)"
                value={p.posterUrl}
                onChange={(e) => setP({ ...p, posterUrl: e.target.value })}
              />
              {(p.posterUrl.trim() || posterLocalUrl) && (
                <div className="admin-poster-preview">
                  <img
                    src={p.posterUrl.trim() || posterLocalUrl}
                    alt="Xem trước poster"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div className="admin-form-span-2">
              <label>Trailer</label>
              <div className="admin-poster-file-row">
                <label className={`admin-file-btn ${trailerUploading ? "is-disabled" : ""}`}>
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.mov,.mkv"
                    onChange={handleTrailerFile}
                    disabled={trailerUploading}
                  />
                  {trailerUploading ? "…" : "Up file"}
                </label>
              </div>
              <input
                type="url"
                placeholder="URL trailer (YouTube / mp4 — tuỳ chọn)"
                value={p.trailerUrl}
                onChange={(e) => setP({ ...p, trailerUrl: e.target.value })}
              />
            </div>
            <div>
              <label>Tên phim</label>
              <input placeholder="Tên phim" value={p.tenPhim} onChange={(e) => setP({ ...p, tenPhim: e.target.value })} />
            </div>
            <div>
              <label>Thể loại</label>
              <input placeholder="Ví dụ: Tâm lý, tình cảm" value={p.theLoai} onChange={(e) => setP({ ...p, theLoai: e.target.value })} />
            </div>
            <div>
              <label>Đạo diễn</label>
              <input placeholder="Họ tên đạo diễn" value={p.daoDien} onChange={(e) => setP({ ...p, daoDien: e.target.value })} />
            </div>
            <div>
              <label>Diễn viên</label>
              <input placeholder="Cách nhau bởi dấu phẩy" value={p.dienVien} onChange={(e) => setP({ ...p, dienVien: e.target.value })} />
            </div>
            <div>
              <label>Thời lượng (phút)</label>
              <input
                type="number"
                min={1}
                placeholder="120"
                value={p.thoiLuongPhut}
                onChange={(e) => setP({ ...p, thoiLuongPhut: e.target.value })}
              />
            </div>
            <div>
              <label>Giới hạn tuổi</label>
              <select value={p.gioiHanTuoi} onChange={(e) => setP({ ...p, gioiHanTuoi: e.target.value })}>
                <option value="P">P — Mọi lứa tuổi</option>
                <option value="T13">T13</option>
                <option value="T16">T16</option>
                <option value="T18">T18</option>
                <option value="K">K — Hạn chế</option>
              </select>
            </div>
            <div>
              <label>Ngày khởi chiếu</label>
              <input
                type="date"
                value={p.ngayKhoiChieu}
                onChange={(e) => setP({ ...p, ngayKhoiChieu: e.target.value })}
              />
            </div>
            <div>
              <label>Ngôn ngữ</label>
              <input placeholder="Tiếng Việt, phụ đề Anh..." value={p.ngonNgu} onChange={(e) => setP({ ...p, ngonNgu: e.target.value })} />
            </div>
            <div className="admin-form-span-2 admin-form-status-row">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={p.trangThaiTuDong}
                  onChange={(e) => setP({ ...p, trangThaiTuDong: e.target.checked })}
                />
                Tự động trạng thái theo ngày khởi chiếu (sau hôm nay = sắp chiếu; đã đến hoặc qua = đang chiếu)
              </label>
              <div>
                <label>Trạng thái</label>
                <select
                  value={p.trangThai}
                  disabled={p.trangThaiTuDong}
                  onChange={(e) => setP({ ...p, trangThai: e.target.value })}
                >
                  <option value="SAP_CHIEU">Sắp chiếu (SAP_CHIEU)</option>
                  <option value="DANG_CHIEU">Đang chiếu (DANG_CHIEU)</option>
                </select>
                {p.trangThaiTuDong && (
                  <p className="admin-field-hint">Đang dùng: <strong>{p.trangThai}</strong> — đổi bằng cách tắt ô phía trên.</p>
                )}
              </div>
            </div>
            <div className="admin-form-actions admin-form-span-2">
              <button type="button" className="admin-btn-primary" onClick={taoPhim}>
                Thêm phim
              </button>
            </div>
          </div>

          <div className="admin-divider" />
          <h2 className="admin-card-title">Danh sách phim</h2>
          <ul className="admin-list-plain">
            {phim.map((x) => (
              <li key={x.phimId}>
                <span>
                  {x.tenPhim}
                  {x.theLoai ? ` — ${x.theLoai}` : ""}
                  {x.trangThai ? ` — ${x.trangThai}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tab === "suat" && (
        <section className="admin-card">
          <h2 className="admin-card-title">Tạo suất chiếu</h2>

          <div className="admin-form-grid">
            <div>
              <label>Phim</label>
              <select value={s.phimId} onChange={(e) => setS({ ...s, phimId: Number(e.target.value) })}>
                <option value={0}>Chọn phim</option>
                {phim.map((x) => (
                  <option key={x.phimId} value={x.phimId}>
                    {x.tenPhim}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Phòng chiếu ID</label>
              <input
                placeholder="Ví dụ: 1"
                type="number"
                value={s.phongChieuId}
                onChange={(e) => setS({ ...s, phongChieuId: Number(e.target.value) })}
              />
            </div>
            <div>
              <label>Thời gian bắt đầu</label>
              <input type="datetime-local" value={s.thoiGianBatDau} onChange={(e) => setS({ ...s, thoiGianBatDau: e.target.value })} />
            </div>
            <div>
              <label>Thời gian kết thúc</label>
              <input type="datetime-local" value={s.thoiGianKetThuc} onChange={(e) => setS({ ...s, thoiGianKetThuc: e.target.value })} />
            </div>
            <div>
              <label>Trạng thái</label>
              <input placeholder="DANG_MO_BAN..." value={s.trangThai} onChange={(e) => setS({ ...s, trangThai: e.target.value })} />
            </div>
            <div className="admin-form-actions">
              <button type="button" className="admin-btn-primary" onClick={taoSuat}>
                Thêm suất chiếu
              </button>
            </div>
          </div>

          <div className="admin-divider" />

          <h2 className="admin-card-title">Danh sách suất chiếu</h2>
          <div className="admin-filter-row">
            <div>
              <label>Lọc theo phim</label>
              <select value={selectedPhimId} onChange={(e) => setSelectedPhimId(Number(e.target.value))}>
                <option value={0}>Tất cả phim</option>
                {phim.map((x) => (
                  <option key={x.phimId} value={x.phimId}>
                    {x.tenPhim}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Phim</th>
                  <th>Phòng</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {suatsForTable.length ? (
                  suatsForTable.map((x) => (
                    <tr key={x.suatChieuId}>
                      <td>{x.tenPhim || `Phim #${x.phimId}`}</td>
                      <td>{x.phongChieuId ?? "-"}</td>
                      <td>{formatDateTime(x.thoiGianBatDau)}</td>
                      <td>{formatDateTime(x.thoiGianKetThuc)}</td>
                      <td>
                        <span className="admin-badge">{x.trangThai ?? "-"}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="admin-empty">
                      Chưa có suất chiếu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
