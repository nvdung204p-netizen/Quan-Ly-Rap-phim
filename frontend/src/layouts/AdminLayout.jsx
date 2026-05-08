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
          <Link className={`admin-sidebar-link ${tab === "phong-chieu" ? "active" : ""}`} to="/admin?tab=phong-chieu">
            Phòng chiếu
          </Link>
          <Link className={`admin-sidebar-link ${tab === "gia-ve" ? "active" : ""}`} to="/admin?tab=gia-ve">
            Giá vé
          </Link>
          <Link className={`admin-sidebar-link ${tab === "giam-gia" ? "active" : ""}`} to="/admin?tab=giam-gia">
            Khuyến mãi & TV
          </Link>
          <Link className={`admin-sidebar-link ${tab === "su-kien" ? "active" : ""}`} to="/admin?tab=su-kien">
            Sự kiện & Tin tức
          </Link>
          <Link className={`admin-sidebar-link ${tab === "nguoi-dung" ? "active" : ""}`} to="/admin?tab=nguoi-dung">
            Người dùng
          </Link>
          <Link className={`admin-sidebar-link ${tab === "thanh-toan" ? "active" : ""}`} to="/admin?tab=thanh-toan">
            QR thanh toán
          </Link>
          <Link className={`admin-sidebar-link ${tab === "ngan-hang" ? "active" : ""}`} to="/admin?tab=ngan-hang">
            Ngân hàng
          </Link>
          <Link className={`admin-sidebar-link ${tab === "ho-tro" ? "active" : ""}`} to="/admin?tab=ho-tro">
            Hỗ trợ khách hàng
          </Link>

          <p className="admin-sidebar-label" style={{ marginTop: 16 }}>Phân tích</p>
          <Link className={`admin-sidebar-link ${tab === "bao-cao" ? "active" : ""}`} to="/admin?tab=bao-cao">
            📊 Báo cáo & Thống kê
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
          <div className="admin-topbar-search-slot" role="search">
            <label className="admin-topbar-search" htmlFor="admin-dashboard-search">
              <span className="admin-topbar-search-icon-wrap" aria-hidden="true">
                <svg className="admin-topbar-search-svg" viewBox="0 0 24 24" width="20" height="20" fill="none">
                  <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="2" />
                  <path d="M16 16l5.5 5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </span>
              <input
                id="admin-dashboard-search"
                type="search"
                className="admin-topbar-search-field"
                placeholder="Tìm phim, suất, người dùng…"
                autoComplete="off"
                enterKeyHint="search"
                aria-label="Tìm kiếm trong quản trị"
              />
            </label>
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
