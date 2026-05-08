import { Link } from "react-router-dom";

export default function StaffHomePage({ user }) {
  return (
    <div className="staff-home">
      <div className="staff-home-head">
        <h1 className="admin-page-title">Trang nhân viên</h1>
        <p className="admin-page-sub">
          Khu vực dành cho tài khoản nhân viên — check-in vé và các thao tác vận hành rạp.
        </p>
      </div>

      <div className="staff-home-grid">
        <Link to="/nhan-vien/checkin" className="staff-home-card staff-home-card--primary">
          <span className="staff-home-card-icon" aria-hidden>
            ✓
          </span>
          <div>
            <h2 className="staff-home-card-title">Check-in vé</h2>
            <p className="staff-home-card-desc">Quét hoặc nhập mã QR vé để xác nhận khách vào rạp.</p>
          </div>
        </Link>

        <Link to="/lich-chieu" className="staff-home-card">
          <span className="staff-home-card-icon" aria-hidden>
            📅
          </span>
          <div>
            <h2 className="staff-home-card-title">Lịch chiếu</h2>
            <p className="staff-home-card-desc">Xem suất chiếu trên website (hữu ích tại quầy).</p>
          </div>
        </Link>

        <Link to="/phim" className="staff-home-card">
          <span className="staff-home-card-icon" aria-hidden>
            🎬
          </span>
          <div>
            <h2 className="staff-home-card-title">Danh sách phim</h2>
            <p className="staff-home-card-desc">Tra cứu phim đang / sắp chiếu phục vụ tư vấn khách.</p>
          </div>
        </Link>
      </div>

      <section className="admin-card staff-home-hint">
        <h2 className="admin-card-title">Thông tin phiên</h2>
        <p className="admin-card-hint">
          Đăng nhập với vai trò: <strong>{user?.vaiTro?.join(", ") || "—"}</strong>
        </p>
      </section>
    </div>
  );
}
