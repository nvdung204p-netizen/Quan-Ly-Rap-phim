import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function MoviesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  useEffect(() => {
    api.phim().then(setData).catch(() => setData([]));
  }, []);

  const promos = [
    { id: 1, title: "Special Monday - ve 50k", image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=500&auto=format&fit=crop" },
    { id: 2, title: "Combo bap nuoc uu dai", image: "https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=500&auto=format&fit=crop" }
  ];

  const nowShowing = data.slice(0, 8);
  const comingSoon = data.slice(8, 16);

  return (
    <div className="home-page">
      <section className="hero">
        <img
          src="https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1600&auto=format&fit=crop"
          alt="Cinema hero"
        />
        <div className="hero-overlay">
          <h2>Đang chiếu tại rạp</h2>
          <p>Đặt vé nhanh - chọn ghế dễ dàng - thanh toán online</p>
        </div>
      </section>

      <section className="home-grid">
        <div>
          <div className="section-head">
            <h3>Phim đang chiếu</h3>
            <Link to="/lich-chieu">Xem tất cả</Link>
          </div>
          <div className="movie-grid">
            {nowShowing.map((x, idx) => (
              <article key={x.phimId} className="movie-card" onClick={() => navigate(`/phim/${x.phimId}`)}>
                <img src={`https://picsum.photos/seed/phim-${x.phimId || idx}/280/420`} alt={x.tenPhim} />
                <div className="movie-info">
                  <small>{x.theLoai || "Tam ly, tinh cam"}</small>
                  <h4>{x.tenPhim}</h4>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside>
          <div className="section-head">
            <h3>Khuyến mãi</h3>
            <Link to="/khuyen-mai">Xem tất cả</Link>
          </div>
          <div className="promo-list">
            {promos.map((p) => (
              <article key={p.id} className="promo-card">
                <img src={p.image} alt={p.title} />
                <p>{p.title}</p>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="section-block">
        <h3>Liên hoan phim, Tuần phim</h3>
        <div className="divider" />
      </section>

      <section className="section-block">
        <h3>Phim sắp chiếu</h3>
        <div className="movie-grid">
          {comingSoon.map((x, idx) => (
            <article key={x.phimId || idx} className="movie-card" onClick={() => navigate(`/phim/${x.phimId}`)}>
              <img src={`https://picsum.photos/seed/sapchieu-${x.phimId || idx}/280/420`} alt={x.tenPhim} />
              <div className="movie-info">
                <small>{x.theLoai || "Phim moi"}</small>
                <h4>{x.tenPhim}</h4>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
