import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../services/api";

export default function MovieDetailPage() {
  const { phimId } = useParams();
  const navigate = useNavigate();
  const [phim, setPhim] = useState(null);
  const [gioiThieu, setGioiThieu] = useState([]);
  const [trailer, setTrailer] = useState([]);
  const [suatChieu, setSuatChieu] = useState([]);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("content");
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    if (!phimId) return;
    Promise.all([
      api.phimById(phimId),
      api.gioiThieuPhim(phimId),
      api.trailerPhim(phimId),
      api.suatChieu()
    ])
      .then(([p, gt, tr, sc]) => {
        setPhim(p);
        setGioiThieu(gt || []);
        setTrailer(tr || []);
        const onlyMovieShows = (sc || []).filter((x) => Number(x.phimId) === Number(phimId));
        setSuatChieu(onlyMovieShows);
        if (onlyMovieShows.length > 0) {
          setSelectedDate(new Date(onlyMovieShows[0].thoiGianBatDau).toISOString().slice(0, 10));
        }
      })
      .catch((e) => setError(e.message));
  }, [phimId]);

  const trailerEmbed = useMemo(() => {
    const url = trailer?.[0]?.trailerUrl || "";
    if (!url) return "";
    if (url.includes("youtube.com/watch?v=")) {
      return url.replace("watch?v=", "embed/");
    }
    return url;
  }, [trailer]);

  if (error) return <p className="error">{error}</p>;
  if (!phim) return <p>Đang tải chi tiết phim...</p>;

  const showDates = [...new Set(suatChieu.map((x) => new Date(x.thoiGianBatDau).toISOString().slice(0, 10)))].slice(0, 7);
  const filteredShows = suatChieu.filter(
    (x) => new Date(x.thoiGianBatDau).toISOString().slice(0, 10) === selectedDate
  );

  return (
    <div className="movie-detail-modern">
      <section className="movie-banner" style={{ backgroundImage: `url(${phim.posterUrl || `https://picsum.photos/seed/detailbg-${phim.phimId}/1400/700`})` }}>
        <div className="movie-banner-overlay">
          <img
            className="movie-poster-lg"
            src={phim.posterUrl || `https://picsum.photos/seed/detail-${phim.phimId}/400/600`}
            alt={phim.tenPhim}
          />
          <div className="movie-meta">
            <h2>{phim.tenPhim}</h2>
            <p>{phim.theLoai || "Tâm lý"} | {phim.ngonNgu || "Tiếng Việt"} | {phim.thoiLuongPhut || 0} phút</p>
            <p>Đạo diễn: {phim.daoDien || "Đang cập nhật"}</p>
            <p>Diễn viên: {phim.dienVien || "Đang cập nhật"}</p>
            <p>Khởi chiếu: {phim.ngayKhoiChieu || "Đang cập nhật"}</p>
            <p className="age-note">Kiểm duyệt {phim.gioiHanTuoi || "P"} - Phim dành cho người xem phù hợp độ tuổi.</p>
            <div className="detail-actions">
              <button className={tab === "content" ? "detail-tab active" : "detail-tab"} onClick={() => setTab("content")}>
                Chi tiết nội dung
              </button>
              <button className={tab === "trailer" ? "detail-tab active" : "detail-tab"} onClick={() => setTab("trailer")}>
                Xem trailer
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-content">
        {tab === "content" ? (
          <>
            <h3>Giới thiệu phim</h3>
            {gioiThieu.length === 0 ? (
              <p>Đang cập nhật nội dung giới thiệu.</p>
            ) : (
              gioiThieu.map((x) => <p key={x.gioiThieuPhimId}>{x.noiDung}</p>)
            )}
          </>
        ) : (
          <>
            <h3>Trailer</h3>
            {trailerEmbed ? (
              <iframe
                title="Trailer"
                src={trailerEmbed}
                width="100%"
                height="420"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ border: 0, borderRadius: "12px" }}
              />
            ) : (
              <p>Chưa có trailer.</p>
            )}
          </>
        )}
      </section>

      <section className="showtime-modern">
        <h3>Suất chiếu của phim</h3>
        <div className="date-strip">
          {showDates.map((d) => {
            const dateObj = new Date(d);
            const thu = dateObj.toLocaleDateString("vi-VN", { weekday: "short" });
            return (
              <button
                key={d}
                className={`date-item ${selectedDate === d ? "active" : ""}`}
                onClick={() => setSelectedDate(d)}
              >
                <small>{thu}</small>
                <strong>{dateObj.getDate()}</strong>
              </button>
            );
          })}
        </div>

        {suatChieu.length === 0 ? (
          <p>Hiện chưa có suất chiếu.</p>
        ) : (
          <div className="showtime-list">
            {filteredShows.map((x) => (
              <button key={x.suatChieuId} className="time-chip" onClick={() => navigate(`/dat-ve?suatChieuId=${x.suatChieuId}`)}>
                {new Date(x.thoiGianBatDau).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - {x.tenPhong}
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
