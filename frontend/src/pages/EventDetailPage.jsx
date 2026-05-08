import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function EventDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    api.suKienById(id)
      .then(d => setEvent(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="content-page">
      <div className="content-skeleton" style={{ height: 400, borderRadius: 12 }} />
      <div className="content-skeleton" style={{ height: 200, marginTop: 20, borderRadius: 12 }} />
    </div>
  );

  if (error) return (
    <div className="content-page">
      <div className="content-empty">
        <p>⚠ {error}</p>
        <button className="btn-action btn-primary" onClick={() => navigate("/su-kien")}>Quay lại danh sách</button>
      </div>
    </div>
  );

  if (!event) return (
    <div className="content-page">
      <div className="content-empty">
        <p>Không tìm thấy sự kiện.</p>
        <button className="btn-action btn-primary" onClick={() => navigate("/su-kien")}>Quay lại danh sách</button>
      </div>
    </div>
  );

  return (
    <div className="content-page">
      <div className="event-detail">
        <div style={{ marginBottom: 20 }}>
           <button className="btn-action btn-ghost" onClick={() => navigate(-1)} style={{ padding: "8px 0", fontSize: "0.95rem" }}>
             ← Quay lại danh sách
           </button>
        </div>
        
        <div className="event-detail-card">
          <div className="event-detail-hero">
            <img 
              src={event.anhDaiDienUrl || `https://picsum.photos/seed/event-${event.suKienId}/1200/600`} 
              alt={event.tieuDe} 
              className="event-detail-banner" 
            />
            <div className="event-detail-overlay">
              <h1 className="event-detail-title">{event.tieuDe}</h1>
              <div className="event-detail-meta">
                {event.ngayBatDau && <span>📅 Từ: {new Date(event.ngayBatDau).toLocaleDateString("vi-VN")}</span>}
                {event.ngayKetThuc && <span> → Đến: {new Date(event.ngayKetThuc).toLocaleDateString("vi-VN")}</span>}
              </div>
            </div>
          </div>

          <div className="event-detail-body">
            {event.moTaNgan && (
              <div className="event-detail-summary">
                {event.moTaNgan}
              </div>
            )}
            
            <div className="event-detail-content" dangerouslySetInnerHTML={{ __html: event.noiDung }} />
          </div>
        </div>
      </div>
    </div>
  );
}
