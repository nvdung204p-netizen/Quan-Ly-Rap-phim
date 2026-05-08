import { useState, useEffect } from "react";
import { api } from "../services/api";
import PrintTicket from "../components/admin/PrintTicket";

export default function StaffOrdersPage() {
  const [keyword, setKeyword] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null); // { don, suat, gheList }

  useEffect(() => {
    // Tự động tải lịch sử nếu keyword trống
    if (!keyword) {
      setLoading(true);
      api.searchDonDatVe("").then(setOrders).finally(() => setLoading(false));
    }
  }, []);

  async function handleSearch(e) {
    e.preventDefault();
    if (!keyword.trim()) return;
    setLoading(true);
    setMsg("");
    try {
      const data = await api.searchDonDatVe(keyword);
      setOrders(data);
      if (data.length === 0) setMsg("Không tìm thấy đơn hàng nào.");
    } catch (err) {
      setMsg(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirmPayment(donId) {
    if (!window.confirm("Xác nhận khách đã trả tiền mặt?")) return;
    try {
      // Tìm ID phương thức TIỀN MẶT
      const pttts = await api.phuongThucThanhToan();
      const pttt = pttts.find(x => x.maPhuongThuc === "TIEN_MAT");
      if (!pttt) throw new Error("Không tìm thấy phương thức Tiền mặt.");

      await api.thanhToan({
        donDatVeId: donId,
        phuongThucThanhToanId: pttt.phuongThucThanhToanId
      });
      alert("Thanh toán thành công!");
      handleSearch({ preventDefault: () => {} }); // Reload
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  }

  async function handleCancelOrder(donId) {
    if (!window.confirm("Bạn có chắc muốn hủy đơn này?")) return;
    try {
      await api.huyDon(donId);
      alert("Đã hủy đơn.");
      handleSearch({ preventDefault: () => {} }); // Reload
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  }

  async function handlePreparePrint(donId) {
    try {
      const detail = await api.chiTietVeDayDu(donId);
      // Backend chiTietVeDayDu trả về object chứa { ...donInfo, danhSachVe }
      setSelectedOrder({ don: detail, suat: null, gheList: detail.danhSachVe });
      setTimeout(() => window.print(), 300);
    } catch (err) {
      alert("Lỗi tải chi tiết vé: " + err.message);
    }
  }

  return (
    <div className="staff-orders">
      <div className="staff-home-head">
        <h1 className="admin-page-title">Tra cứu đơn hàng</h1>
        <p className="admin-page-sub">Tìm kiếm đơn đặt vé bằng Số điện thoại hoặc Mã đơn.</p>
      </div>

      <section className="admin-card">
        <form className="staff-checkin-row" onSubmit={handleSearch}>
          <input
            className="staff-checkin-input"
            placeholder="Nhập SĐT hoặc Mã đơn..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit" className="admin-btn-primary staff-checkin-btn" disabled={loading}>
            {loading ? "Đang tìm..." : "Tra cứu"}
          </button>
        </form>
        {msg && <p className="admin-error" style={{ marginTop: 10 }}>{msg}</p>}

        {orders.length > 0 && (
          <div className="admin-table-wrap" style={{ marginTop: 24 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Kênh đặt</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Ngày tạo</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.donDatVeId}>
                    <td><strong>{o.maDon}</strong></td>
                    <td>
                      <div>{o.hoTen || "Khách vãng lai"}</div>
                      {o.soDienThoai && <small style={{ color: "#888" }}>{o.soDienThoai}</small>}
                    </td>
                    <td>
                      <span className={`admin-badge ${o.kenhDat === "QUAY" ? "admin-badge-warning" : "admin-badge-success"}`}>
                        {o.kenhDat}
                      </span>
                    </td>
                    <td>{o.tongThanhToan?.toLocaleString("vi-VN")} đ</td>
                    <td>
                      <span className={`admin-badge ${o.trangThai === 'DA_THANH_TOAN' ? 'admin-badge-success' : o.trangThai === 'HUY' ? 'admin-badge-danger' : 'admin-badge-warning'}`}>
                        {o.trangThai}
                      </span>
                    </td>
                    <td>{new Date(o.taoLuc).toLocaleString("vi-VN")}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {o.trangThai === 'CHO_THANH_TOAN' && (
                          <>
                            <button className="admin-btn" onClick={() => handleConfirmPayment(o.donDatVeId)} style={{ background: '#22c55e', color: '#fff', fontSize: 12, padding: '4px 8px' }}>Xác nhận tiền mặt</button>
                            <button className="admin-btn" onClick={() => handleCancelOrder(o.donDatVeId)} style={{ background: '#ef4444', color: '#fff', fontSize: 12, padding: '4px 8px' }}>Hủy</button>
                          </>
                        )}
                        {o.trangThai === 'DA_THANH_TOAN' && (
                          <button className="admin-btn" onClick={() => handlePreparePrint(o.donDatVeId)} style={{ background: '#3b82f6', color: '#fff', fontSize: 12, padding: '4px 8px' }}>🖨️ In vé</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="print-only">
        <PrintTicket {...selectedOrder} />
      </div>
    </div>
  );
}
