import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1800&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1800&auto=format&fit=crop&q=85",
  "https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?w=1800&auto=format&fit=crop&q=85",
];

function HeroSlider({ movies }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  const start = () => {
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setCurrent(c => (c + 1) % HERO_IMAGES.length), 5000);
  };

  useEffect(() => { start(); return () => clearInterval(timerRef.current); }, []);

  const go = (i) => { setCurrent(i); start(); };

  return (
    <div className="hp-hero" role="banner">
      {HERO_IMAGES.map((src, i) => (
        <div key={i} className={`hp-hero-slide${i === current ? " hp-hero-slide--active" : ""}`}
          style={{ backgroundImage: `url(${src})` }} />
      ))}
      <div className="hp-hero-overlay" />
      <div className="hp-hero-content">
        <div className="hp-hero-badge">🎬 Chiếu phim chất lượng cao</div>
        <h1 className="hp-hero-title">Trải nghiệm điện ảnh<br /><span className="hp-hero-title-accent">đỉnh cao</span></h1>
        <p className="hp-hero-sub">Đặt vé nhanh — Chọn ghế dễ dàng — Thanh toán tiện lợi</p>
        <div className="hp-hero-actions">
          <Link to="/lich-chieu" className="hp-btn hp-btn-primary">
            <span>🎟</span> Xem lịch chiếu
          </Link>
          <Link to="/khuyen-mai" className="hp-btn hp-btn-ghost">
            <span>🎁</span> Ưu đãi hôm nay
          </Link>
        </div>
      </div>
      <div className="hp-hero-dots">
        {HERO_IMAGES.map((_, i) => (
          <button key={i} className={`hp-hero-dot${i === current ? " hp-hero-dot--active" : ""}`}
            onClick={() => go(i)} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>
    </div>
  );
}

function MovieCard({ movie, idx }) {
  const navigate = useNavigate();
  const posterUrl = movie.posterUrl ||
    `https://picsum.photos/seed/movie-${movie.phimId || idx}/280/420`;

  return (
    <article className="hp-movie-card" onClick={() => navigate(`/phim/${movie.phimId}`)}>
      <div className="hp-movie-card-poster">
        <img src={posterUrl} alt={movie.tenPhim} loading="lazy" />
        <div className="hp-movie-card-overlay">
          <button className="hp-movie-card-play">▶ Xem chi tiết</button>
        </div>
        {movie.trangThai === "DANG_CHIEU" && (
          <span className="hp-movie-badge hp-movie-badge--showing">Đang chiếu</span>
        )}
        {movie.trangThai === "SAP_CHIEU" && (
          <span className="hp-movie-badge hp-movie-badge--coming">Sắp chiếu</span>
        )}
      </div>
      <div className="hp-movie-card-info">
        {movie.theLoai && <span className="hp-movie-genre">{movie.theLoai.split(",")[0].trim()}</span>}
        <h3 className="hp-movie-title">{movie.tenPhim}</h3>
        {movie.thoi_luong_phut && (
          <span className="hp-movie-duration">⏱ {movie.thoi_luong_phut} phút</span>
        )}
      </div>
    </article>
  );
}

function SectionTitle({ label, title, linkTo, linkText }) {
  return (
    <div className="hp-section-head">
      <div>
        <span className="hp-section-label">{label}</span>
        <h2 className="hp-section-title">{title}</h2>
      </div>
      {linkTo && (
        <Link to={linkTo} className="hp-section-link">
          {linkText || "Xem tất cả"} →
        </Link>
      )}
    </div>
  );
}

function StatsBar() {
  const stats = [
    { icon: "🎭", value: "50+", label: "Phim mỗi tháng" },
    { icon: "🏟", value: "10+", label: "Phòng chiếu" },
    { icon: "💺", value: "2000+", label: "Ghế ngồi" },
    { icon: "👥", value: "50K+", label: "Khán giả/tháng" },
  ];
  return (
    <div className="hp-stats">
      {stats.map((s, i) => (
        <div key={i} className="hp-stat-item">
          <span className="hp-stat-icon">{s.icon}</span>
          <strong className="hp-stat-value">{s.value}</strong>
          <span className="hp-stat-label">{s.label}</span>
        </div>
      ))}
    </div>
  );
}

function PromoCard({ title, desc, color, icon, linkTo }) {
  return (
    <Link to={linkTo || "/khuyen-mai"} className="hp-promo-card" style={{ "--promo-accent": color }}>
      <div className="hp-promo-icon">{icon}</div>
      <div>
        <h3 className="hp-promo-title">{title}</h3>
        <p className="hp-promo-desc">{desc}</p>
      </div>
      <span className="hp-promo-arrow">→</span>
    </Link>
  );
}

export default function MoviesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 150);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    api.phim()
      .then(d => setData(d))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const q = searchQuery.toLowerCase().trim();
    return data.filter(m => 
      m.tenPhim.toLowerCase().includes(q) || 
      (m.theLoai && m.theLoai.toLowerCase().includes(q))
    );
  }, [data, searchQuery]);

  const nowShowing = filteredData.filter(m => m.trangThai === "DANG_CHIEU").slice(0, 8);
  const comingSoon = filteredData.filter(m => m.trangThai === "SAP_CHIEU").slice(0, 4);
  const all = data.length > 0 ? data : [];
  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="hp-page">
      {/* Sticky Search Bar */}
      <section className={`hp-top-search${scrolled ? " hp-top-search--sticky" : ""}`}>
        <div className="hp-search-container">
          <div className="hp-search-box hp-search-box--top">
            <span className="hp-search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Bạn muốn xem phim gì hôm nay? Tìm kiếm phim, thể loại..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="hp-search-input"
            />
            {searchQuery && (
              <button className="hp-search-clear" onClick={() => setSearchQuery("")}>✕</button>
            )}
          </div>
        </div>
      </section>

      {/* Hero Slider */}
      <HeroSlider movies={all} />

      {/* Phim đang chiếu */}
      <section className="hp-section">
        <SectionTitle 
          label={isSearching ? "🔍 KẾT QUẢ" : "🎬 CẬP NHẬT"} 
          title={isSearching ? `Tìm thấy ${filteredData.length} phim` : "Phim đang chiếu"} 
          linkTo={isSearching ? null : "/lich-chieu"} 
          linkText={isSearching ? null : "Xem lịch chiếu"} 
        />
        {loading ? (
          <div className="hp-loading">
            {[...Array(4)].map((_, i) => <div key={i} className="hp-skeleton" />)}
          </div>
        ) : filteredData.length > 0 ? (
          <div className="hp-movies-grid">
            {isSearching 
              ? filteredData.map((m, i) => <MovieCard key={m.phimId} movie={m} idx={i} />)
              : nowShowing.map((m, i) => <MovieCard key={m.phimId} movie={m} idx={i} />)
            }
          </div>
        ) : (
          <div className="hp-empty">
            <span>🎭</span>
            <p>{isSearching ? "Không tìm thấy phim phù hợp với yêu cầu của bạn." : "Chưa có phim nào đang chiếu. Vui lòng quay lại sau."}</p>
            {isSearching && (
              <button className="hp-btn hp-btn-ghost" onClick={() => setSearchQuery("")} style={{ marginTop: 12 }}>
                Xem tất cả phim
              </button>
            )}
          </div>
        )}
      </section>

      {/* Promotions */}
      <section className="hp-section hp-section--promo">
        <SectionTitle label="🎁 ƯU ĐÃI" title="Khuyến mãi nổi bật" linkTo="/khuyen-mai" />
        <div className="hp-promos-grid">
          <PromoCard icon="🎟" title="Thứ Hai vui vẻ" desc="Giảm 30% mọi vé vào thứ Hai hàng tuần" color="#f43f5e" linkTo="/khuyen-mai" />
          <PromoCard icon="🍿" title="Combo bắp nước" desc="Combo bắp + nước chỉ 75K, tiết kiệm 40%" color="#f97316" linkTo="/khuyen-mai" />
          <PromoCard icon="👑" title="Thẻ VIP" desc="Đăng ký VIP — Giảm 20% mọi vé, combo miễn phí" color="#eab308" linkTo="/khuyen-mai" />
          <PromoCard icon="🎂" title="Sinh nhật rạp" desc="Sinh nhật đặc biệt với vé miễn phí cho khách sinh nhật" color="#8b5cf6" linkTo="/khuyen-mai" />
        </div>
      </section>

      {/* Phim sắp chiếu */}
      {comingSoon.length > 0 && (
        <section className="hp-section">
          <SectionTitle label="📅 SẮP RA MẮT" title="Phim sắp chiếu" linkTo="/phim" linkText="Tất cả phim" />
          <div className="hp-movies-grid hp-movies-grid--4">
            {comingSoon.map((m, i) => <MovieCard key={m.phimId} movie={m} idx={i + 100} />)}
          </div>
        </section>
      )}

      {/* Cinematic Experience */}
      <section className="hp-section hp-experience">
        <div className="hp-experience-content">
          <span className="hp-section-label">✨ TRẢI NGHIỆM</span>
          <h2 className="hp-section-title">Tại sao chọn NCC?</h2>
          <p className="hp-experience-desc">Hệ thống rạp chiếu phim hiện đại với công nghệ âm thanh vòm Dolby Atmos, màn hình 4K cùng ghế ngồi cao cấp đem lại trải nghiệm điện ảnh hoàn hảo nhất.</p>
          <Link to="/gioi-thieu" className="hp-btn hp-btn-ghost" style={{ width: "fit-content" }}>
            Tìm hiểu thêm →
          </Link>
        </div>
        <div className="hp-experience-features">
          {[
            { icon: "🔊", title: "Dolby Atmos", desc: "Âm thanh vòm sống động 360°" },
            { icon: "📺", title: "4K Crystal", desc: "Hình ảnh sắc nét chuẩn điện ảnh" },
            { icon: "🛋", title: "Ghế VIP Recliner", desc: "Thoải mái như ở nhà" },
            { icon: "❄️", title: "Điều hòa thông minh", desc: "Nhiệt độ luôn hoàn hảo" },
          ].map((f, i) => (
            <div key={i} className="hp-feature-item">
              <span className="hp-feature-icon">{f.icon}</span>
              <div>
                <strong className="hp-feature-title">{f.title}</strong>
                <p className="hp-feature-desc">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="hp-cta">
        <div className="hp-cta-content">
          <h2 className="hp-cta-title">Đặt vé ngay hôm nay!</h2>
          <p className="hp-cta-sub">Lịch chiếu cập nhật liên tục, không bỏ lỡ bộ phim yêu thích của bạn</p>
          <div className="hp-hero-actions">
            <Link to="/lich-chieu" className="hp-btn hp-btn-primary">🎬 Xem lịch chiếu</Link>
            <Link to="/auth" className="hp-btn hp-btn-ghost">Đăng ký tài khoản</Link>
          </div>
        </div>
      </section>

      {/* Floating Stats Bar at bottom */}
      <div className="hp-floating-stats">
        <StatsBar />
      </div>
    </div>
  );
}
