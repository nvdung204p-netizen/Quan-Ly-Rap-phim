import React from "react";

export default function PrintTicket({ don, suat, gheList }) {
  if (!don) return null;

  return (
    <div className="print-ticket-container">
      {/* Hóa đơn tổng */}
      <div className="print-invoice">
        <h2>RẠP CHIẾU PHIM NCC</h2>
        <p>123 Đường Điện Ảnh, Quận 1, TP.HCM</p>
        <hr />
        <h3>HÓA ĐƠN THANH TOÁN</h3>
        <p>Mã đơn: <strong>{don.maDon || don.donDatVeId}</strong></p>
        <p>Thu ngân: {don.hoTenThuNgan || "Nhân viên tại quầy"}</p>
        <p>Thời gian: {new Date().toLocaleString("vi-VN")}</p>
        <hr />
        <p>Phim: <strong>{suat?.tenPhim || don.tenPhim || "N/A"}</strong></p>
        <p>Phòng: {suat?.tenPhong || don.tenPhong || "N/A"}</p>
        <p>Suất chiếu: {suat?.thoiGianBatDau ? new Date(suat.thoiGianBatDau).toLocaleString("vi-VN") : "N/A"}</p>
        <table style={{ width: "100%", marginTop: 10, marginBottom: 10 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left" }}>Ghế</th>
              <th style={{ textAlign: "right" }}>Giá</th>
            </tr>
          </thead>
          <tbody>
            {(gheList || []).map(g => (
              <tr key={g.maGhe || g.gheId}>
                <td>{g.maGhe}</td>
                <td style={{ textAlign: "right" }}>{Number(g.giaVe || 0).toLocaleString("vi-VN")}đ</td>
              </tr>
            ))}
          </tbody>
        </table>
        <hr />
        <p style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Tổng tiền:</span>
          <strong>{Number(don.tongThanhToan || 0).toLocaleString("vi-VN")}đ</strong>
        </p>
        <p style={{ textAlign: "center", marginTop: 20 }}>Xin cảm ơn quý khách!</p>
      </div>

      <div className="page-break" />

      {/* Từng vé (để xé đưa khách) */}
      {(gheList || []).map((g, i) => (
        <div key={i} className="print-single-ticket">
          <h2>VÉ XEM PHIM - NCC</h2>
          <hr />
          <p>Phim: <strong>{suat?.tenPhim || don.tenPhim || "N/A"}</strong></p>
          <p>Phòng: {suat?.tenPhong || don.tenPhong || "N/A"}</p>
          <p>Suất: {suat?.thoiGianBatDau ? new Date(suat.thoiGianBatDau).toLocaleString("vi-VN") : "N/A"}</p>
          <p>Ghế: <strong style={{ fontSize: "1.2rem" }}>{g.maGhe}</strong></p>
          <p>Giá vé: {Number(g.giaVe || 0).toLocaleString("vi-VN")}đ</p>
          <div style={{ textAlign: "center", margin: "10px 0" }}>
            {g.maQrVe && (
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(g.maQrVe)}&bgcolor=ffffff&color=000000`} 
                alt="QR Vé" 
                style={{ width: 100, height: 100 }}
              />
            )}
          </div>
          <p style={{ fontSize: "0.8rem", textAlign: "center" }}>Vui lòng xuất trình mã QR này để vào rạp.</p>
          <div className="page-break" />
        </div>
      ))}
    </div>
  );
}
