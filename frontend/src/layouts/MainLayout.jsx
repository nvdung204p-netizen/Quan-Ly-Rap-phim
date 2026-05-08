import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import SupportWidget from "../components/common/SupportWidget";

export default function MainLayout({ token, onLogout, user }) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function navClass({ isActive }) {
    return isActive ? "is-active" : undefined;
  }

  return (
    <div className="app-shell">
      <header className={`topbar${scrolled ? " topbar--scrolled" : ""}`}>
        <Link to="/phim" className="brand brand-link" title="Về trang chủ">
          <div className="logo-box">NC</div>
          <div className="brand-text">
            <strong>National Cinema Center</strong>
          </div>
        </Link>

        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(o => !o)} aria-label="Menu">
          <span className={`hamburger${mobileMenuOpen ? " is-open" : ""}`} />
        </button>

        <nav className={`menu${mobileMenuOpen ? " menu--open" : ""}`}>
          <NavLink to="/phim" end className={navClass} onClick={() => setMobileMenuOpen(false)}>
            Trang chủ
          </NavLink>
          <NavLink to="/lich-chieu" className={navClass} onClick={() => setMobileMenuOpen(false)}>
            Lịch chiếu
          </NavLink>
          <NavLink to="/su-kien" className={navClass} onClick={() => setMobileMenuOpen(false)}>
            Sự kiện
          </NavLink>
          <NavLink to="/khuyen-mai" className={navClass} onClick={() => setMobileMenuOpen(false)}>
            Khuyến mãi
          </NavLink>
          <NavLink to="/gia-ve" className={navClass} onClick={() => setMobileMenuOpen(false)}>
            Giá vé
          </NavLink>
          <NavLink to="/gioi-thieu" className={navClass} onClick={() => setMobileMenuOpen(false)}>
            Giới thiệu
          </NavLink>
          {user?.vaiTro?.includes("ADMIN") && (
            <NavLink to="/admin" className={`${navClass({isActive: false})} menu-admin-link`} onClick={() => setMobileMenuOpen(false)}>
              ⚙ Admin
            </NavLink>
          )}
          {(user?.vaiTro?.includes("NHAN_VIEN") || user?.vaiTro?.includes("ADMIN")) && (
            <NavLink to="/nhan-vien" className={navClass} onClick={() => setMobileMenuOpen(false)}>
              👤 Nhân viên
            </NavLink>
          )}
        </nav>

        <div className="spacer" />

        {token ? (
          <div className="topbar-user" ref={userMenuRef}>
            <button
              type="button"
              className="topbar-user-trigger"
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
              onClick={() => setUserMenuOpen((o) => !o)}
            >
              <span className="topbar-user-avatar" aria-hidden>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </span>
              <span className="topbar-user-name">{user?.hoTen || "Khách"}</span>
              <span className={`topbar-user-chevron ${userMenuOpen ? "is-open" : ""}`} aria-hidden>
                ▾
              </span>
            </button>
            {userMenuOpen && (
              <div className="topbar-user-dropdown" role="menu">
                <div className="topbar-user-header">
                  <strong>{user?.hoTen}</strong>
                  <small>{user?.email || user?.soDienThoai}</small>
                </div>
                <Link to="/profile" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                  👤 Thông tin cá nhân
                </Link>
                <Link to="/profile?tab=the" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                  ⭐ Thẻ thành viên
                </Link>
                <Link to="/profile?tab=ve" role="menuitem" onClick={() => setUserMenuOpen(false)}>
                  🎟 Vé của tôi
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="topbar-user-logout"
                  onClick={() => {
                    setUserMenuOpen(false);
                    onLogout();
                  }}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-buttons">
            <Link to="/auth?mode=register" className="btn-register">
              Đăng ký
            </Link>
            <Link to="/auth" className="btn-login">
              Đăng nhập
            </Link>
          </div>
        )}
      </header>

      <main className="container">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="logo-box" style={{ width: 48, height: 48, fontSize: 18 }}>NC</div>
            <div>
              <strong style={{ fontSize: 16 }}>National Cinema Center</strong>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 13 }}>Trải nghiệm điện ảnh đỉnh cao</p>
            </div>
          </div>

          <div className="footer-nav-groups">
            <div className="footer-nav-group">
              <h4>Phim & Vé</h4>
              <Link to="/phim">Phim đang chiếu</Link>
              <Link to="/lich-chieu">Lịch chiếu</Link>
              <Link to="/gia-ve">Giá vé</Link>
            </div>
            <div className="footer-nav-group">
              <h4>Dịch vụ</h4>
              <Link to="/khuyen-mai">Khuyến mãi</Link>
              <Link to="/su-kien">Sự kiện</Link>
              <Link to="/profile?tab=the">Thẻ thành viên</Link>
            </div>
            <div className="footer-nav-group">
              <h4>Thông tin</h4>
              <Link to="/gioi-thieu">Giới thiệu</Link>
              <Link to="/su-kien">Tin tức</Link>
              <a href="#">Chính sách bảo mật</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 National Cinema Center · Cơ quan chủ quản: Bộ Văn hóa, Thể thao và Du lịch</p>
          <div className="footer-socials">
            <a href="#" aria-label="Facebook">📘</a>
            <a href="#" aria-label="Zalo">💬</a>
            <a href="#" aria-label="YouTube">▶️</a>
          </div>
        </div>
      </footer>
      <SupportWidget />
    </div>
  );
}
