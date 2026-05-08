import { useEffect, useState } from "react";
import { api } from "../../services/api";

export default function SupportWidget() {
  const [channels, setChannels] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Gọi API lấy các kênh hỗ trợ (public)
    // Giả sử có API endpoint chung cho hỗ trợ khách hàng
    api.adminKenhHoTro().then(data => {
      setChannels(Array.isArray(data) ? data.filter(x => x.trangThai !== 0) : []);
    }).catch(() => {});
  }, []);

  if (channels.length === 0) return null;

  return (
    <div className={`support-widget ${open ? "support-widget--open" : ""}`}>
      <div className="support-menu">
        <div className="support-header">
          <h4>Hỗ trợ trực tuyến</h4>
          <button className="support-close" onClick={() => setOpen(false)}>✕</button>
        </div>
        <div className="support-list">
          {channels.map(k => (
            <a key={k.phuongThucId} href={k.linkDich || "#"} target="_blank" rel="noreferrer" className="support-item">
              <div className="support-icon">
                {k.iconUrl ? <img src={k.iconUrl} alt={k.tenPhuongThuc} /> : <span>🎧</span>}
              </div>
              <div className="support-info">
                <div className="support-name">{k.tenPhuongThuc}</div>
                <div className="support-val">{k.giaTriHienThi}</div>
              </div>
            </a>
          ))}
        </div>
      </div>
      
      <button className="support-trigger" onClick={() => setOpen(!open)} title="Hỗ trợ khách hàng">
        <div className="support-trigger-icon">💬</div>
        <span className="support-trigger-text">Hỗ trợ</span>
      </button>
    </div>
  );
}
