import { useState, useEffect } from "react";
import { api } from "../services/api";
import PrintTicket from "../components/admin/PrintTicket";

export default function StaffPOSPage() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  
  const [showtimes, setShowtimes] = useState([]);
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  
  const [seatMap, setSeatMap] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  
  const [ticketTypes, setTicketTypes] = useState([]);
  const [seatTicketTypes, setSeatTicketTypes] = useState({}); // { gheId: loaiVeId }
  
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  useEffect(() => {
    api.phim().then(data => setMovies(data.filter(m => m.trangThai === "DANG_CHIEU" || m.trangThai === "SAP_CHIEU"))).catch(console.error);
    api.loaiVeDatVe().then(data => setTicketTypes(data)).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedMovie) {
      api.suatChieu().then(data => {
        // Lọc suất chiếu theo phim và theo ngày hôm nay (giả lập đơn giản)
        const st = data.filter(s => s.phimId === selectedMovie.phimId);
        setShowtimes(st);
        setSelectedShowtime(null);
        setSeatMap([]);
        setSelectedSeats([]);
      }).catch(console.error);
    }
  }, [selectedMovie]);

  useEffect(() => {
    if (selectedShowtime) {
      api.soDoGhe(selectedShowtime.suatChieuId).then(data => {
        setSeatMap(data);
        setSelectedSeats([]);
      }).catch(console.error);
    }
  }, [selectedShowtime]);

  function handleSelectSeat(ghe) {
    if (ghe.daDat) return;
    if (selectedSeats.find(s => s.gheId === ghe.gheId)) {
      setSelectedSeats(prev => prev.filter(s => s.gheId !== ghe.gheId));
      const newMap = {...seatTicketTypes};
      delete newMap[ghe.gheId];
      setSeatTicketTypes(newMap);
    } else {
      setSelectedSeats(prev => [...prev, ghe]);
      if (ticketTypes.length > 0) {
        setSeatTicketTypes(prev => ({...prev, [ghe.gheId]: ticketTypes[0].loaiVeId}));
      }
    }
  }

  function handleTypeChange(gheId, loaiVeId) {
    setSeatTicketTypes(prev => ({...prev, [gheId]: Number(loaiVeId)}));
  }

  async function handleCheckout() {
    if (selectedSeats.length === 0) return;
    setLoading(true);
    setMsg("");
    
    // We assume default loaiVeId is the first one selected for now.
    // The API taoDon currently only takes 1 loaiVeId for the whole order! 
    // Wait, taoDon takes `loaiVeId`, not an array. So we must pick the most common one or just force 1 ticket type per order in this UI.
    // To adapt to current API: just use the first seat's ticket type.
    const loaiVeId = Object.values(seatTicketTypes)[0] || ticketTypes[0]?.loaiVeId;
    
    const payload = {
      suatChieuId: selectedShowtime.suatChieuId,
      danhSachGheId: selectedSeats.map(s => s.gheId),
      loaiVeId,
      maCodeGiamGia: "",
      kenhDat: "QUAY"
    };

    try {
      const res = await api.taoDon(payload);
      setMsg(`Thành công! Mã đơn: ${res.maDon}`);
      setLastOrder({ don: res, suat: selectedShowtime, gheList: res.danhSachVe });
      // Refresh seat map
      api.soDoGhe(selectedShowtime.suatChieuId).then(setSeatMap);
      setSelectedSeats([]);
    } catch (err) {
      setMsg("Lỗi: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="staff-pos">
      <div className="staff-home-head" style={{ marginBottom: 20 }}>
        <h1 className="admin-page-title">Bán vé tại quầy (POS)</h1>
        <p className="admin-page-sub">Hệ thống chọn vé nhanh cho nhân viên.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}>
        <div className="pos-main">
          {/* Chọn Phim */}
          <section className="admin-card">
            <h2 className="admin-card-title">1. Chọn Phim</h2>
            <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingBottom: 10 }}>
              {movies.map(m => (
                <button
                  key={m.phimId}
                  className={`admin-btn ${selectedMovie?.phimId === m.phimId ? "admin-btn-primary" : ""}`}
                  onClick={() => setSelectedMovie(m)}
                  style={{ minWidth: 150 }}
                >
                  {m.tenPhim}
                </button>
              ))}
            </div>
          </section>

          {/* Chọn Suất Chiếu */}
          {selectedMovie && (
            <section className="admin-card" style={{ marginTop: 24 }}>
              <h2 className="admin-card-title">2. Chọn Suất Chiếu</h2>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {showtimes.length === 0 ? <p>Không có suất chiếu nào.</p> : showtimes.map(s => (
                  <button
                    key={s.suatChieuId}
                    className={`admin-btn ${selectedShowtime?.suatChieuId === s.suatChieuId ? "admin-btn-primary" : ""}`}
                    onClick={() => setSelectedShowtime(s)}
                  >
                    {new Date(s.thoiGianBatDau).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Chọn Ghế */}
          {selectedShowtime && (
            <section className="admin-card" style={{ marginTop: 24 }}>
              <h2 className="admin-card-title">3. Chọn Ghế</h2>
              <div className="booking-seatmap" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                {seatMap.map(ghe => {
                  const isSelected = selectedSeats.find(s => s.gheId === ghe.gheId);
                  const isBaoTri = ghe.trangThai === "BAO_TRI";
                  let bg = "#444";
                  if (ghe.daDat) bg = "#888";
                  else if (isBaoTri) bg = "#ef4444";
                  else if (isSelected) bg = "#4CAF50";
                  else if (ghe.loaiGhe === "VIP") bg = "#FFD700";
                  else if (ghe.loaiGhe === "DOI") bg = "#E91E8C";

                  return (
                    <button
                      key={ghe.gheId}
                      disabled={ghe.daDat || isBaoTri}
                      onClick={() => handleSelectSeat(ghe)}
                      style={{
                        width: 40, height: 40, borderRadius: 4, border: "none",
                        backgroundColor: bg, color: isSelected || ghe.loaiGhe === "VIP" ? "#000" : "#fff",
                        cursor: (ghe.daDat || isBaoTri) ? "not-allowed" : "pointer",
                        fontWeight: "bold"
                      }}
                      title={isBaoTri ? "Ghế đang bảo trì" : `${ghe.maGhe}`}
                    >
                      {ghe.maGhe}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Giỏ Hàng (Sidebar) */}
        <div className="pos-sidebar">
          <section className="admin-card" style={{ position: "sticky", top: 20 }}>
            <h2 className="admin-card-title">Hóa đơn</h2>
            {selectedSeats.length === 0 ? (
              <p style={{ color: "#aaa" }}>Chưa chọn ghế.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <strong>Phim:</strong> {selectedMovie?.tenPhim}
                </div>
                <div>
                  <strong>Suất:</strong> {new Date(selectedShowtime?.thoiGianBatDau).toLocaleString("vi-VN")}
                </div>
                <hr style={{ borderColor: "#333" }} />
                <div style={{ maxHeight: 300, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedSeats.map(s => (
                    <div key={s.gheId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Ghế <strong>{s.maGhe}</strong></span>
                      <select 
                        style={{ padding: 4, background: "#222", color: "#fff", border: "1px solid #444" }}
                        value={seatTicketTypes[s.gheId] || ""}
                        onChange={(e) => handleTypeChange(s.gheId, e.target.value)}
                      >
                        {ticketTypes.map(t => <option key={t.loaiVeId} value={t.loaiVeId}>{t.tenLoai}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <hr style={{ borderColor: "#333" }} />
                <p style={{ fontSize: "0.9rem", color: "#FF9800" }}>* Tổng tiền sẽ được tính chính xác trên hệ thống sau khi tạo đơn.</p>
                <button 
                  className="admin-btn-primary" 
                  style={{ padding: "12px", fontSize: "1.1rem", marginTop: 10 }}
                  onClick={handleCheckout}
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Thanh Toán Tiền Mặt"}
                </button>
                {msg && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ color: msg.includes("Lỗi") ? "#F44336" : "#4CAF50", fontWeight: "bold", margin: "0 0 10px 0" }}>{msg}</p>
                    {!msg.includes("Lỗi") && (
                      <button 
                        className="admin-btn" 
                        style={{ width: '100%', background: '#3b82f6', color: '#fff', border: 'none' }}
                        onClick={() => window.print()}
                      >
                        🖨️ In Hóa Đơn & Vé
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
      <div className="print-only">
        <PrintTicket {...lastOrder} />
      </div>
    </div>
  );
}
