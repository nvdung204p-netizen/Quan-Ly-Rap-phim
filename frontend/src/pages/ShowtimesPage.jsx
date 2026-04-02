import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function ShowtimesPage() {
  const [data, setData] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api.suatChieu()
      .then((res) => {
        setData(res || []);
        if (res?.length) {
          setSelectedDate(new Date(res[0].thoiGianBatDau).toISOString().slice(0, 10));
        }
      })
      .catch(() => setData([]));
  }, []);

  const dates = [...new Set(data.map((x) => new Date(x.thoiGianBatDau).toISOString().slice(0, 10)))].slice(0, 7);
  const filtered = data.filter((x) => new Date(x.thoiGianBatDau).toISOString().slice(0, 10) === selectedDate);

  const grouped = Object.values(
    filtered.reduce((acc, item) => {
      const key = item.phimId;
      if (!acc[key]) acc[key] = { ...item, shows: [] };
      acc[key].shows.push(item);
      return acc;
    }, {})
  );

  return (
    <div className="showtime-page">
      <section className="showtime-header">
        <h2>Phim đang chiếu</h2>
        <div className="date-strip">
          {dates.map((d) => {
            const dt = new Date(d);
            return (
              <button
                key={d}
                className={`date-item ${selectedDate === d ? "active" : ""}`}
                onClick={() => setSelectedDate(d)}
              >
                {dt.toLocaleDateString("vi-VN")}
              </button>
            );
          })}
        </div>
      </section>

      <div className="showtime-grid">
        {grouped.map((g, idx) => (
          <article key={g.phimId} className="showtime-card">
            <img src={`https://picsum.photos/seed/lich-${g.phimId || idx}/230/320`} alt={g.tenPhim} />
            <div className="showtime-info">
              <div className="showtime-topline">
                <small>{g.theLoai || "Hài, Hành động"} • 95 phút</small>
                <span className="badge-2d">2D</span>
              </div>
              <h3>{g.tenPhim}</h3>
              <p>Xuất xứ: Việt Nam</p>
              <p>Khởi chiếu: {new Date(g.thoiGianBatDau).toLocaleDateString("vi-VN")}</p>
              <p className="age-note">T16 - Phim được phổ biến đến người xem từ đủ 16 tuổi trở lên.</p>
              <h4>Lịch chiếu</h4>
              <div className="time-list">
                {g.shows.map((s) => (
                  <button key={s.suatChieuId} className="time-chip" onClick={() => navigate(`/dat-ve?suatChieuId=${s.suatChieuId}`)}>
                    {new Date(s.thoiGianBatDau).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
