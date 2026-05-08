import { useEffect, useState } from "react";

const money = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(n) || 0);

export default function PricesPage() {
  const TYPES = [
    { key: "THUONG", label: "Thường", color: "#3b82f6", desc: "Ghế tiêu chuẩn, tầm nhìn tốt" },
    { key: "VIP", label: "VIP", color: "#f59e0b", desc: "Ghế rộng rãi, vị trí trung tâm" },
    { key: "DOI", label: "Đôi", color: "#ec4899", desc: "Ghế đôi, hàng cuối, thích hợp theo cặp" },
  ];

  const TICKET_TYPES = [
    { label: "Người lớn (Thường)", mult: 1 },
    { label: "Trẻ em (dưới 13 tuổi)", mult: 0.7 },
    { label: "Sinh viên (có thẻ)", mult: 0.8 },
  ];

  const BASE_PRICES = { THUONG: 75000, VIP: 110000, DOI: 160000 };
  const SESSIONS = [
    { label: "Suất sáng (trước 12:00)", mult: 0.8 },
    { label: "Suất chiều (12:00–17:00)", mult: 1.0 },
    { label: "Suất tối (17:00–22:00)", mult: 1.0 },
    { label: "Suất khuya (sau 22:00)", mult: 1.1 },
    { label: "Cuối tuần / Lễ", mult: 1.2 },
  ];

  return (
    <div className="content-page">
      <div className="content-page-header">
        <h1>💺 Bảng giá vé</h1>
        <p>Giá vé tham khảo — áp dụng từ 01/01/2026</p>
      </div>

      {/* Giá theo loại ghế */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 20, color: "#f8fafc" }}>Giá cơ bản theo loại ghế</h2>
        <div className="prices-cards">
          {TYPES.map(t => (
            <div key={t.key} className="prices-card" style={{ "--color": t.color }}>
              <div className="prices-card-tag" style={{ background: t.color + "22", color: t.color }}>{t.label}</div>
              <div className="prices-card-price">{money(BASE_PRICES[t.key])}</div>
              <div className="prices-card-desc">{t.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Bảng giá theo loại vé và suất */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 20, color: "#f8fafc" }}>Giá theo loại khán giả</h2>
        <div className="prices-table-wrap">
          <table className="prices-table">
            <thead>
              <tr>
                <th>Loại khán giả</th>
                {TYPES.map(t => <th key={t.key} style={{ color: t.color }}>{t.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {TICKET_TYPES.map(tt => (
                <tr key={tt.label}>
                  <td>{tt.label}</td>
                  {TYPES.map(t => (
                    <td key={t.key}>{money(Math.round(BASE_PRICES[t.key] * tt.mult / 1000) * 1000)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bảng giá theo suất */}
      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, marginBottom: 20, color: "#f8fafc" }}>Hệ số giá theo suất chiếu</h2>
        <div className="prices-table-wrap">
          <table className="prices-table">
            <thead>
              <tr>
                <th>Suất chiếu</th>
                <th>Hệ số</th>
                {TYPES.map(t => <th key={t.key} style={{ color: t.color }}>Ghế {t.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {SESSIONS.map(s => (
                <tr key={s.label}>
                  <td>{s.label}</td>
                  <td><span style={{ color: s.mult > 1 ? "#ef4444" : s.mult < 1 ? "#22c55e" : "#94a3b8", fontWeight: 700 }}>×{s.mult}</span></td>
                  {TYPES.map(t => (
                    <td key={t.key}>{money(Math.round(BASE_PRICES[t.key] * s.mult / 1000) * 1000)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Ghi chú */}
      <section className="prices-notes">
        <h3>📌 Lưu ý</h3>
        <ul>
          <li>Giá vé trên là <strong>tham khảo</strong>. Giá thực tế có thể thay đổi theo từng phim và khung giờ.</li>
          <li>Vé trẻ em áp dụng cho khán giả dưới 13 tuổi (cần xuất trình giấy tờ khi vào cửa).</li>
          <li>Vé sinh viên cần xuất trình thẻ sinh viên hợp lệ.</li>
          <li>Giá vé cuối tuần và ngày lễ có hệ số ×1.2 so với giá ngày thường.</li>
          <li>Phim 3D / IMAX có phụ thu thêm <strong>30,000đ – 60,000đ</strong> mỗi vé.</li>
          <li>Mã giảm giá và ưu đãi thành viên được áp dụng sau khi tính giá cơ bản.</li>
        </ul>
      </section>
    </div>
  );
}
