import { Link, Outlet } from "react-router-dom";

export default function MainLayout({ token, onLogout, user }) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/phim" className="brand brand-link" title="Về trang chủ">
          <div className="logo-box">NC</div>
          <div className="brand-text">
            <strong>National Cinema Center</strong>
          </div>
        </Link>

        <nav className="menu">
          <Link to="/phim">Trang chủ</Link>
          <Link to="/lich-chieu">Lịch chiếu</Link>
          <Link to="/su-kien">Tin tức</Link>
          <Link to="/khuyen-mai">Khuyến mãi</Link>
          <Link to="/gia-ve">Giá vé</Link>
          <Link to="/profile">Tài khoản</Link>
          {user?.vaiTro?.includes("ADMIN") && <Link to="/admin?tab=tong-quan">Admin</Link>}
          {user?.vaiTro?.includes("NHAN_VIEN") && <Link to="/nhan-vien/checkin">Checkin</Link>}
        </nav>

        <div className="spacer" />
        {token ? (
          <button onClick={onLogout} className="btn-login">Đăng xuất</button>
        ) : (
          <div className="auth-buttons">
            <Link to="/auth?mode=register" className="btn-register">Đăng ký</Link>
            <Link to="/auth" className="btn-login">Đăng nhập</Link>
          </div>
        )}
      </header>

      <main className="container">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-links">
          <a href="#">Chính sách</a>
          <a href="#">Lịch chiếu</a>
          <a href="#">Tin tức</a>
          <a href="#">Giá vé</a>
          <a href="#">Hỏi đáp</a>
          <a href="#">Đặt vé nhóm</a>
          <a href="#">Liên hệ</a>
        </div>
        <p>Cơ quan chủ quản: Bộ Văn hóa, Thể thao và Du lịch</p>
        <p>Copyright 2026. NCC All Rights Reserved.</p>
      </footer>
    </div>
  );
}
