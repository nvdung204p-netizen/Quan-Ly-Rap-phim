import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.suKien().then(d => setEvents(Array.isArray(d) ? d : [])).catch(() => setEvents([])).finally(() => setLoading(false));
  }, []);

  return (
    <div className="content-page">
      <div className="content-page-header">
        <h1>🎪 Sự kiện & Tin tức</h1>
        <p>Cập nhật những sự kiện điện ảnh mới nhất từ NCC</p>
      </div>

      {loading ? (
        <div className="content-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="content-skeleton" />)}
        </div>
      ) : events.length === 0 ? (
        <div className="content-empty"><span>📰</span><p>Chưa có sự kiện nào. Hãy quay lại sau!</p></div>
      ) : (
        <div className="content-grid">
          {events.map(e => (
            <Link key={e.suKienId} to={`/su-kien/${e.suKienId}`} className="content-card-link">
              <article className="content-card">
                <div className="content-card-img-wrap">
                  <img src={e.anhDaiDienUrl || `https://picsum.photos/seed/event-${e.suKienId}/400/250`} alt={e.tieuDe} loading="lazy" />
                  {e.hienThiTrangChu && <span className="content-card-badge">Nổi bật</span>}
                </div>
                <div className="content-card-body">
                  <h3 className="content-card-title">{e.tieuDe}</h3>
                  {e.moTaNgan && <p className="content-card-desc">{e.moTaNgan}</p>}
                  <div className="content-card-meta">
                    {e.ngayBatDau && <span>📅 {new Date(e.ngayBatDau).toLocaleDateString("vi-VN")}</span>}
                    {e.ngayKetThuc && <span>→ {new Date(e.ngayKetThuc).toLocaleDateString("vi-VN")}</span>}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
