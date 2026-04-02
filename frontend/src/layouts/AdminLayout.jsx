import { Link, Outlet, useSearchParams } from "react-router-dom";

export default function AdminLayout({ user, onLogout }) {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "tong-quan";

  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar" aria-label="Menu quản trị">
        <Link to="/phim" className="admin-sidebar-brand admin-sidebar-brand-link" title="Về trang chủ">
          <span className="admin-sidebar-logo">NCC</span>
          <div>
            <strong>National Cinema</strong>
            <small>Quản trị</small>
          </div>
        </Link>

        <nav className="admin-sidebar-nav">
          <p className="admin-sidebar-label">Điều hướng</p>
          <Link className={`admin-sidebar-link ${tab === "tong-quan" ? "active" : ""}`} to="/admin?tab=tong-quan">
            Tổng quan
          </Link>
          <Link className={`admin-sidebar-link ${tab === "phim" ? "active" : ""}`} to="/admin?tab=phim">
            Phim
          </Link>
          <Link className={`admin-sidebar-link ${tab === "suat" ? "active" : ""}`} to="/admin?tab=suat">
            Suất chiếu
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/phim" className="admin-sidebar-back">
            ← Về trang chủ rạp
          </Link>
        </div>
      </aside>

      <div className="admin-dashboard-main">
        <header className="admin-topbar">
          <div className="admin-topbar-search">
            <span className="admin-topbar-search-icon" aria-hidden="true">
              ⌕
            </span>
            <input type="search" placeholder="Tìm nhanh..." readOnly aria-label="Tìm kiếm (sắp có)" />
          </div>
          <div className="admin-topbar-actions">
            <span className="admin-topbar-user" title="Tài khoản">
              {user?.hoTen ?? "Quản trị viên"}
            </span>
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
