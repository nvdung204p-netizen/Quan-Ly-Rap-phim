import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

const DAYS_AHEAD = 14;

function getDaysRange() {
  const days = [];
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    days.push(`${y}-${m}-${day}`);
  }
  return days;
}

export default function ShowtimesPage() {
  const navigate = useNavigate();
  const [suats, setSuats] = useState([]);
  const [phimList, setPhimList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [filterPhim, setFilterPhim] = useState("");
  const [error, setError] = useState("");

  const days = useMemo(() => getDaysRange(), []);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.suatChieu(), api.phim()])
      .then(([sc, ph]) => {
        setSuats(sc || []);
        setPhimList(ph || []);
        setError("");
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return suats.filter(x => {
      const d = new Date(x.thoiGianBatDau);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const matchDate = dateStr === selectedDate;
      const matchPhim = !filterPhim || String(x.phimId) === filterPhim;
      return matchDate && matchPhim && x.trangThai !== "HUY";
    });
  }, [suats, selectedDate, filterPhim]);

  // Nhóm theo phim
  const grouped = useMemo(() => {
    const map = {};
    filtered.forEach(x => {
      if (!map[x.phimId]) map[x.phimId] = { tenPhim: x.tenPhim, posterUrl: x.posterUrl, phimId: x.phimId, slots: [] };
      map[x.phimId].slots.push(x);
    });
    return Object.values(map);
  }, [filtered]);

  return (
    <div className="lc2-page">
      <div className="lc2-header">
        <h1 className="lc2-title">🎬 Lịch chiếu phim</h1>
        <p className="lc2-sub">Chọn ngày và phim để xem suất chiếu phù hợp</p>
      </div>

      {/* Thanh lọc ngày */}
      <div className="lc2-dates">
        {days.map(d => {
          const dt = new Date(d);
          const today = new Date();
          const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          const isToday = d === todayStr;
          return (
            <button key={d} className={`lc2-date-btn${selectedDate === d ? " lc2-date-btn--active" : ""}`}
              onClick={() => setSelectedDate(d)}>
              <small>{isToday ? "Hôm nay" : dt.toLocaleDateString("vi-VN", { weekday: "short" })}</small>
              <strong>{String(dt.getDate()).padStart(2, "0")}/{String(dt.getMonth() + 1).padStart(2, "0")}</strong>
            </button>
          );
        })}
      </div>

      {/* Lọc phim */}
      <div className="lc2-filters">
        <select className="lc2-filter-select" value={filterPhim} onChange={e => setFilterPhim(e.target.value)}>
          <option value="">Tất cả phim</option>
          {phimList.map(p => (
            <option key={p.phimId} value={p.phimId}>{p.tenPhim}</option>
          ))}
        </select>
        {filterPhim && (
          <button className="lc2-filter-clear" onClick={() => setFilterPhim("")}>✕ Xóa lọc</button>
        )}
      </div>

      {error && <div className="lc2-error">⚠ {error}</div>}

      {loading ? (
        <div className="lc2-loading">
          {[...Array(3)].map((_, i) => <div key={i} className="lc2-skeleton" />)}
        </div>
      ) : grouped.length === 0 ? (
        <div className="lc2-empty">
          <span>🎭</span>
          <p>Không có suất chiếu nào vào ngày này.</p>
          <small>Hãy chọn ngày khác hoặc xem lại sau.</small>
        </div>
      ) : (
        <div className="lc2-groups">
          {grouped.map(g => (
            <div key={g.phimId} className="lc2-group">
              <div className="lc2-group-header" onClick={() => navigate(`/phim/${g.phimId}`)}>
                <img
                  src={g.posterUrl || `https://picsum.photos/seed/lc-${g.phimId}/80/120`}
                  alt={g.tenPhim}
                  className="lc2-group-poster"
                />
                <div>
                  <h2 className="lc2-group-title">{g.tenPhim}</h2>
                  <p className="lc2-group-count">{g.slots.length} suất chiếu</p>
                </div>
              </div>

              <div className="lc2-slots">
                {g.slots.map(s => {
                  const full = Number(s.soGheTrong) === 0;
                  return (
                    <div key={s.suatChieuId} className={`lc2-slot${full ? " lc2-slot--full" : ""}`}
                      onClick={() => !full && navigate(`/dat-ve?suatChieuId=${s.suatChieuId}`)}>
                      <div className="lc2-slot-time">
                        {new Date(s.thoiGianBatDau).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="lc2-slot-end">
                        → {new Date(s.thoiGianKetThuc).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </div>
                      <div className="lc2-slot-room">{s.tenPhong}</div>
                      {s.loaiPhong && <div className="lc2-slot-type">{s.loaiPhong}</div>}
                      <div className={`lc2-slot-seats${full ? " lc2-slot-seats--full" : s.soGheTrong < 10 ? " lc2-slot-seats--low" : ""}`}>
                        {full ? "Hết chỗ" : `${s.soGheTrong} trống`}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
