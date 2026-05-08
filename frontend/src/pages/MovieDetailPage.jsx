import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

const money = (n) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(n) || 0);

const AGE_LABEL = { P: "P - Mọi lứa tuổi", T13: "T13", T16: "T16", T18: "T18", K: "K - Hạn chế" };
const AGE_COLOR = { P: "#22c55e", T13: "#3b82f6", T16: "#f59e0b", T18: "#ef4444", K: "#7f1d1d" };

function Badge({ text, color }) {
  return <span style={{ background: color + "22", color, border: `1px solid ${color}55`, padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>{text}</span>;
}

export default function MovieDetailPage() {
  const { phimId } = useParams();
  const navigate = useNavigate();
  const [phim, setPhim] = useState(null);
  const [gioiThieu, setGioiThieu] = useState([]);
  const [trailer, setTrailer] = useState([]);
  const [suatChieu, setSuatChieu] = useState([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("info");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (!phimId) return;
    Promise.all([
      api.phimById(phimId),
      api.gioiThieuPhim(phimId),
      api.trailerPhim(phimId),
      api.suatChieu()
    ]).then(([p, gt, tr, sc]) => {
      setPhim(p);
      setGioiThieu(gt || []);
      setTrailer(tr || []);
      const mine = (sc || []).filter(x => Number(x.phimId) === Number(phimId) && x.trangThai !== "HUY");
      setSuatChieu(mine);
      if (mine.length) setSelectedDate(new Date(mine[0].thoiGianBatDau).toISOString().slice(0, 10));
    }).catch(e => setError(e.message));
  }, [phimId]);

  const trailerEmbed = useMemo(() => {
    const url = trailer?.[0]?.trailerUrl || "";
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) return url.replace("watch?v=", "embed/");
    if (url.includes("youtu.be/")) return url.replace("youtu.be/", "www.youtube.com/embed/");
    return url;
  }, [trailer]);

  const showDates = [...new Set(suatChieu.map(x => new Date(x.thoiGianBatDau).toISOString().slice(0, 10)))].slice(0, 14);
  const filteredShows = suatChieu.filter(x => new Date(x.thoiGianBatDau).toISOString().slice(0, 10) === selectedDate);

  if (error) return <div className="md2-error">⚠ {error}</div>;
  if (!phim) return (
    <div className="md2-loading">
      <div className="md2-skeleton md2-skeleton-banner" />
    </div>
  );

  const posterBg = phim.posterUrl || `https://picsum.photos/seed/bg-${phim.phimId}/1600/800`;
  const ageColor = AGE_COLOR[phim.gioiHanTuoi] || "#64748b";

  return (
    <div className="md2-page">
      {/* Banner Hero */}
      <section className="md2-hero" style={{ "--bg": `url(${posterBg})` }}>
        <div className="md2-hero-blur" />
        <div className="md2-hero-inner">
          <div className="md2-poster-wrap">
            <img
              src={phim.posterUrl || `https://picsum.photos/seed/poster-${phim.phimId}/300/450`}
              alt={phim.tenPhim}
              className="md2-poster"
            />
            {phim.gioiHanTuoi && (
              <span className="md2-age-badge" style={{ background: ageColor }}>
                {phim.gioiHanTuoi}
              </span>
            )}
          </div>

          <div className="md2-meta">
            <div className="md2-badges">
              {phim.theLoai?.split(",").slice(0, 3).map(g => (
                <Badge key={g} text={g.trim()} color="#6366f1" />
              ))}
              <Badge text={phim.trangThai === "DANG_CHIEU" ? "Đang chiếu" : "Sắp chiếu"}
                color={phim.trangThai === "DANG_CHIEU" ? "#22c55e" : "#f59e0b"} />
            </div>
            <h1 className="md2-title">{phim.tenPhim}</h1>
            <div className="md2-info-row">
              {phim.thoiLuongPhut && <span>⏱ {phim.thoiLuongPhut} phút</span>}
              {phim.ngonNgu && <span>🌐 {phim.ngonNgu}</span>}
              {phim.quocGia && <span>🏳️ {phim.quocGia}</span>}
              {phim.ngayKhoiChieu && <span>📅 {new Date(phim.ngayKhoiChieu).toLocaleDateString("vi-VN")}</span>}
              {phim.gioiHanTuoi && <span style={{ color: ageColor }}>🔞 {AGE_LABEL[phim.gioiHanTuoi] || phim.gioiHanTuoi}</span>}
            </div>
            {phim.daoDien && <p className="md2-crew">🎬 Đạo diễn: <strong>{phim.daoDien}</strong></p>}
            {phim.dienVien && <p className="md2-crew">🎭 Diễn viên: <span>{phim.dienVien}</span></p>}

            <div className="md2-tab-btns">
              {[["info", "📋 Nội dung"], ["trailer", "▶ Trailer"]].map(([key, label]) => (
                <button key={key} className={`md2-tab-btn${tab === key ? " md2-tab-btn--active" : ""}`} onClick={() => setTab(key)}>{label}</button>
              ))}
            </div>

            {suatChieu.length > 0 && (
              <button className="md2-book-btn" onClick={() => {
                const el = document.getElementById("md2-showtimes");
                el?.scrollIntoView({ behavior: "smooth" });
              }}>
                🎟 Đặt vé ngay
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Tab nội dung */}
      <section className="md2-content">
        {tab === "info" ? (
          <div className="md2-desc">
            {phim.moTa && <p style={{ marginBottom: 20, fontStyle: "italic", opacity: 0.9 }}>{phim.moTa}</p>}
            {gioiThieu.length > 0
              ? gioiThieu.map(x => <p key={x.gioiThieuPhimId}>{x.noiDung}</p>)
              : !phim.moTa && <p className="md2-muted">Đang cập nhật nội dung phim...</p>}
          </div>
        ) : (
          <div className="md2-trailer">
            {trailerEmbed ? (
              <iframe title="Trailer" src={trailerEmbed} allowFullScreen
                style={{ width: "100%", aspectRatio: "16/9", border: 0, borderRadius: 12 }} />
            ) : <p className="md2-muted">Chưa có trailer.</p>}
          </div>
        )}
      </section>

      {/* Suất chiếu */}
      <section id="md2-showtimes" className="md2-showtimes">
        <h2 className="md2-section-title">🕐 Lịch chiếu</h2>

        {suatChieu.length === 0 ? (
          <p className="md2-muted">Hiện chưa có lịch chiếu cho phim này.</p>
        ) : (
          <>
            <div className="md2-dates">
              {showDates.map(d => {
                const dt = new Date(d);
                return (
                  <button key={d} className={`md2-date-btn${selectedDate === d ? " md2-date-btn--active" : ""}`}
                    onClick={() => setSelectedDate(d)}>
                    <small>{dt.toLocaleDateString("vi-VN", { weekday: "short" })}</small>
                    <strong>{String(dt.getDate()).padStart(2, "0")}/{String(dt.getMonth() + 1).padStart(2, "0")}</strong>
                  </button>
                );
              })}
            </div>

            <div className="md2-slots">
              {filteredShows.length === 0 ? (
                <p className="md2-muted">Không có suất chiếu ngày này.</p>
              ) : (
                filteredShows.map(x => {
                  const full = Number(x.soGheTrong) === 0;
                  return (
                    <div key={x.suatChieuId} className={`md2-slot${full ? " md2-slot--full" : ""}`}
                      onClick={() => !full && navigate(`/dat-ve?suatChieuId=${x.suatChieuId}`)}>
                      <div className="md2-slot-time">
                        {new Date(x.thoiGianBatDau).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        <span>→ {new Date(x.thoiGianKetThuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                      <div className="md2-slot-room">{x.tenPhong} {x.loaiPhong && <Badge text={x.loaiPhong} color="#6366f1" />}</div>
                      <div className={`md2-slot-seats${full ? " md2-slot-seats--full" : x.soGheTrong < 10 ? " md2-slot-seats--low" : ""}`}>
                        {full ? "Hết chỗ" : `${x.soGheTrong} ghế trống`}
                      </div>
                      {!full && <div className="md2-slot-cta">Đặt ngay →</div>}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
