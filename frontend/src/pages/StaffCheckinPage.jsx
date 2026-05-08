import { useState, useEffect } from "react";
import { api } from "../services/api";

export default function StaffCheckinPage() {
  const [maQrVe, setMaQrVe] = useState("");
  const [msg, setMsg] = useState("");
  const [ok, setOk] = useState(null);
  const [ticketDetails, setTicketDetails] = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    try {
      const data = await api.lichSuCheckin();
      setHistory(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function checkin() {
    setMsg("");
    setOk(null);
    setTicketDetails(null);
    if (!maQrVe.trim()) return;
    
    try {
      const r = await api.checkinQr({ maQrVe: maQrVe.trim() });
      setOk(true);
      setMsg(`${r.message ?? "Thành công"} — Vé #${r.veId ?? "?"}`);
      if (r.chiTiet) setTicketDetails(r.chiTiet);
      setMaQrVe(""); // reset input for next scan
      loadHistory();
    } catch (e) {
      setOk(false);
      setMsg(e.message);
    }
  }

  return (
    <div className="staff-checkin">
      <div className="staff-home-head">
        <h1 className="admin-page-title">Check-in vé</h1>
        <p className="admin-page-sub">Nhập mã QR in trên vé (hoặc mã vé) rồi xác nhận.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <section className="admin-card staff-checkin-card">
          <label className="staff-checkin-label">Mã QR / mã vé</label>
          <div className="staff-checkin-row">
            <input
              className="staff-checkin-input"
              placeholder="Dán hoặc gõ mã..."
              value={maQrVe}
              onChange={(e) => setMaQrVe(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && checkin()}
              autoFocus
            />
            <button type="button" className="admin-btn-primary staff-checkin-btn" onClick={checkin}>
              Check-in
            </button>
          </div>
          {msg && (
            <p className={ok ? "staff-checkin-msg staff-checkin-msg--ok" : "staff-checkin-msg staff-checkin-msg--err"}>
              {msg}
            </p>
          )}
        </section>

        {ticketDetails && ok && (
          <section className="admin-card">
            <h2 className="admin-card-title" style={{ color: "#4CAF50", marginBottom: 16 }}>Vé Hợp Lệ</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #333", paddingBottom: 8 }}>
                <span style={{ color: "#aaa" }}>Phim</span>
                <strong style={{ textAlign: "right" }}>{ticketDetails.tenPhim}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #333", paddingBottom: 8 }}>
                <span style={{ color: "#aaa" }}>Suất chiếu</span>
                <strong>{new Date(ticketDetails.thoiGianBatDau).toLocaleString("vi-VN")}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #333", paddingBottom: 8 }}>
                <span style={{ color: "#aaa" }}>Ghế</span>
                <strong style={{ fontSize: "1.2rem", color: "#FFD700" }}>{ticketDetails.maGhe}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#aaa" }}>Khách hàng</span>
                <strong>{ticketDetails.hoTenKhach}</strong>
              </div>
            </div>
          </section>
        )}
      </div>

      <section className="admin-card" style={{ marginTop: 24 }}>
        <h2 className="admin-card-title">Lịch sử Check-in gần đây</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Thời gian</th>
                <th>Phim</th>
                <th>Suất chiếu</th>
                <th>Ghế</th>
                <th>Nhân viên</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h, i) => (
                <tr key={i}>
                  <td style={{ fontSize: "0.9rem" }}>{new Date(h.checkinLuc).toLocaleString("vi-VN")}</td>
                  <td><strong>{h.tenPhim}</strong></td>
                  <td style={{ fontSize: "0.85rem" }}>{new Date(h.thoiGianBatDau).toLocaleString("vi-VN")}</td>
                  <td><span className="admin-badge admin-badge-warning">{h.maGhe}</span></td>
                  <td style={{ fontSize: "0.85rem", color: "#888" }}>{h.hoTenNhanVien || "—"}</td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center", padding: "20px", color: "#aaa" }}>Chưa có lịch sử check-in nào.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
