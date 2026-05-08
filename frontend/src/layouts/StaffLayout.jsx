import { Link, NavLink, Outlet } from "react-router-dom";

export default function StaffLayout({ user, onLogout }) {
  return (
    <div className="admin-dashboard staff-dashboard">
      <aside className="admin-sidebar staff-sidebar" aria-label="Menu nhân viên">
        <Link to="/nhan-vien" className="admin-sidebar-brand admin-sidebar-brand-link" title="Trang nhân viên">
          <span className="admin-sidebar-logo staff-sidebar-logo">NV</span>
          <div>
            <strong>NCC</strong>
            <small>Nhân viên</small>
          </div>
        </Link>

        <nav className="admin-sidebar-nav">
          <p className="admin-sidebar-label">Làm việc</p>
          <NavLink
            to="/nhan-vien"
            end
            className={({ isActive }) => `admin-sidebar-link${isActive ? " active" : ""}`}
          >
            Trang chủ NV
          </NavLink>
          <NavLink
            to="/nhan-vien/pos"
            className={({ isActive }) => `admin-sidebar-link${isActive ? " active" : ""}`}
          >
            Bán vé tại quầy (POS)
          </NavLink>
          <NavLink
            to="/nhan-vien/checkin"
            className={({ isActive }) => `admin-sidebar-link${isActive ? " active" : ""}`}
          >
            Check-in vé
          </NavLink>
          <NavLink
            to="/nhan-vien/don-hang"
            className={({ isActive }) => `admin-sidebar-link${isActive ? " active" : ""}`}
          >
            Tra cứu đơn hàng
          </NavLink>
          {user?.vaiTro?.includes("ADMIN") && (
            <Link className="admin-sidebar-link" to="/admin?tab=tong-quan">
              Quản trị
            </Link>
          )}
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/phim" className="admin-sidebar-back">
            ← Về website khách
          </Link>
        </div>
      </aside>

      <div className="admin-dashboard-main">
        <header className="admin-topbar">
          <div className="staff-topbar-title">
            <span className="staff-topbar-badge">Nhân viên</span>
            <span className="staff-topbar-welcome">Xin chào, {user?.hoTen ?? "bạn"}</span>
          </div>
          <div className="admin-topbar-actions">
            <Link to="/profile" className="staff-topbar-link">
              Tài khoản
            </Link>
            <button type="button" className="admin-btn-logout" onClick={onLogout}>
              Đăng xuất
            </button>
          </div>
        </header>

        <main className="admin-dashboard-body">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
