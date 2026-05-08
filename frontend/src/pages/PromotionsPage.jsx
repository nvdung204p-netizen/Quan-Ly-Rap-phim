import { useEffect, useState } from "react";
import { api } from "../services/api";

const money = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(n) || 0);

export default function PromotionsPage() {
  const [maList, setMaList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // API công khai lấy mã giảm giá hiệu lực
    fetch("/api/KinhDoanh/giam-gia").then(r => r.json())
      .then(d => setMaList(Array.isArray(d?.data) ? d.data : []))
      .catch(() => setMaList([]))
      .finally(() => setLoading(false));
  }, []);

  const promos = [
    { icon: "🎟", title: "Thứ Hai vui vẻ", desc: "Giảm 30% tất cả vé thường vào mỗi thứ Hai", tag: "Hàng tuần", color: "#ef4444" },
    { icon: "🍿", title: "Combo bắp nước", desc: "Combo 1 bắp lớn + 2 nước chỉ 75,000đ (tiết kiệm 40%)", tag: "Mỗi ngày", color: "#f97316" },
    { icon: "👑", title: "Thẻ VIP thành viên", desc: "Tích điểm mỗi lần đặt vé, đổi vé miễn phí & nhiều ưu đãi độc quyền", tag: "Thành viên", color: "#eab308" },
    { icon: "🎂", title: "Ưu đãi sinh nhật", desc: "Tặng 1 vé miễn phí vào tháng sinh nhật của bạn khi đăng ký thành viên", tag: "Thành viên", color: "#8b5cf6" },
    { icon: "👨‍👩‍👧‍👦", title: "Gói gia đình", desc: "Mua 4 vé giảm 20% tổng hoá đơn cho nhóm từ 4 người", tag: "Nhóm", color: "#06b6d4" },
    { icon: "🎓", title: "Ưu đãi sinh viên", desc: "Xuất trình thẻ sinh viên để mua vé loại Sinh viên với giá ưu đãi", tag: "Sinh viên", color: "#22c55e" },
  ];

  return (
    <div className="content-page">
      <div className="content-page-header">
        <h1>🎁 Khuyến mãi & Ưu đãi</h1>
        <p>Tiết kiệm tối đa với các chương trình ưu đãi hấp dẫn từ NCC</p>
      </div>

      {/* Ưu đãi cố định */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 20, color: "#f8fafc" }}>Chương trình ưu đãi thường xuyên</h2>
        <div className="promo2-grid">
          {promos.map((p, i) => (
            <div key={i} className="promo2-card" style={{ "--accent": p.color }}>
              <div className="promo2-icon">{p.icon}</div>
              <span className="promo2-tag" style={{ background: p.color + "22", color: p.color }}>{p.tag}</span>
              <h3 className="promo2-title">{p.title}</h3>
              <p className="promo2-desc">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mã giảm giá */}
      <section>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: 20, color: "#f8fafc" }}>Mã giảm giá đang áp dụng</h2>
        {loading ? (
          <div className="content-grid">{[...Array(3)].map((_, i) => <div key={i} className="content-skeleton" style={{ height: 100 }} />)}</div>
        ) : maList.length === 0 ? (
          <div className="content-empty" style={{ padding: 32 }}><span>🏷</span><p>Hiện chưa có mã giảm giá nào. Hãy theo dõi để không bỏ lỡ!</p></div>
        ) : (
          <div className="promo2-codes">
            {maList.map(m => {
              const isExpired = m.ngayKetThuc && new Date(m.ngayKetThuc) < new Date();
              return (
                <div key={m.maGiamGiaId} className={`promo2-code-card${isExpired ? " promo2-code-card--expired" : ""}`}>
                  <div className="promo2-code-left">
                    <div className="promo2-code-value">
                      {m.giaTriGiam}{m.loaiGiamGia === "PHAN_TRAM" ? "%" : "đ"}
                    </div>
                    <div className="promo2-code-label">Giảm {m.loaiGiamGia === "PHAN_TRAM" ? "phần trăm" : "tiền"}</div>
                  </div>
                  <div className="promo2-code-center">
                    <code className="promo2-code-text">{m.maCode}</code>
                    {m.giaTriDonToiThieu > 0 && <p className="promo2-code-min">Đơn tối thiểu: {money(m.giaTriDonToiThieu)}</p>}
                    {m.giamToiDa && <p className="promo2-code-min">Giảm tối đa: {money(m.giamToiDa)}</p>}
                  </div>
                  <div className="promo2-code-right">
                    <span className={`promo2-code-status${isExpired ? " promo2-code-status--expired" : ""}`}>
                      {isExpired ? "Hết hạn" : `Còn ${m.soLuongConLai} lượt`}
                    </span>
                    <span style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
                      HSD: {new Date(m.ngayKetThuc).toLocaleDateString("vi-VN")}
                    </span>
                    {!isExpired && (
                      <button 
                        onClick={() => {
                          localStorage.setItem("savedPromoCode", m.maCode);
                          alert(`Đã lưu mã ${m.maCode}. Mã sẽ tự động được điền khi bạn đặt vé!`);
                        }}
                        style={{ marginTop: 8, padding: "4px 12px", background: "#3b82f6", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                        Lưu mã
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
