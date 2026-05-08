import { useEffect, useState, useCallback } from "react";
import { api } from "../../services/api";

const money = (n) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(Number(n) || 0);
const fmt = (n) => new Intl.NumberFormat("vi-VN").format(Number(n) || 0);

function KPICard({ icon, label, value, sub, color }) {
  return (
    <div className="bao-cao-kpi" style={{ "--kpi-color": color || "#6366f1" }}>
      <div className="bao-cao-kpi-icon">{icon}</div>
      <div className="bao-cao-kpi-body">
        <div className="bao-cao-kpi-value">{value}</div>
        <div className="bao-cao-kpi-label">{label}</div>
        {sub && <div className="bao-cao-kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}

function BarChart({ data, maxVal, labelKey = "ngay", valueKey = "doanhThu" }) {
  if (!data?.length) return <div className="bao-cao-chart-empty">Chưa có dữ liệu</div>;
  const max = maxVal || Math.max(...data.map(d => Number(d[valueKey]) || 0), 1);
  return (
    <div className="bao-cao-chart">
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = Math.round((val / max) * 100);
        return (
          <div key={i} className="bao-cao-bar-wrap" title={`${d[labelKey]}: ${money(val)}`}>
            <div className="bao-cao-bar" style={{ height: `${Math.max(pct, 2)}%` }} />
            <div className="bao-cao-bar-label">{String(d[labelKey]).slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function AdminBaoCao() {
  const [kpi, setKpi] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topPhim, setTopPhim] = useState([]);
  const [donGanDay, setDonGanDay] = useState([]);
  const [phongData, setPhongData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const [k, chart, phim, don, phong] = await Promise.all([
        api.adminBaoCaoTongQuan(),
        api.adminBaoCaoDoanhThuNgay(),
        api.adminBaoCaoTopPhim(),
        api.adminBaoCaoDonGanDay(),
        api.adminBaoCaoPhongChieu(),
      ]);
      setKpi(k);
      setChartData(Array.isArray(chart) ? chart : []);
      setTopPhim(Array.isArray(phim) ? phim : []);
      setDonGanDay(Array.isArray(don) ? don : []);
      setPhongData(Array.isArray(phong) ? phong : []);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function exportCSV() {
    if (!donGanDay.length) return;
    const header = "Mã đơn,Khách hàng,Tổng tiền,Trạng thái,Kênh,Số vé,Thời gian\n";
    const rows = donGanDay.map(d =>
      `${d.maDon},${d.tenKhach || "Vãng lai"},${d.tongThanhToan},${d.trangThai},${d.kenhDat},${d.soVe},${new Date(d.taoLuc).toLocaleString("vi-VN")}`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `bao-cao-don-hang-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
  }

  const TRANG_THAI_LABEL = { DA_THANH_TOAN: "Đã TT", CHO_THANH_TOAN: "Chờ TT", HUY: "Đã hủy", HOAN_TIEN: "Hoàn tiền" };
  const TRANG_THAI_COLOR = { DA_THANH_TOAN: "#22c55e", CHO_THANH_TOAN: "#f59e0b", HUY: "#ef4444", HOAN_TIEN: "#6366f1" };

  if (loading) return <div className="bao-cao-loading"><div className="bao-cao-spinner" /><p>Đang tải dữ liệu báo cáo...</p></div>;

  return (
    <section className="admin-card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
        <h2 className="admin-card-title" style={{ margin: 0 }}>📊 Báo cáo & Thống kê</h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn-action btn-ghost" onClick={load}>🔄 Làm mới</button>
          <button className="btn-action btn-ghost" onClick={exportCSV}>⬇ Xuất CSV</button>
        </div>
      </div>

      {err && <p className="admin-alert admin-alert-error">{err}</p>}

      {/* KPI Cards */}
      <div className="bao-cao-kpi-grid">
        <KPICard icon="💰" label="Doanh thu tháng này" value={money(kpi?.doanhThuThang)} color="#22c55e" />
        <KPICard icon="📈" label="Doanh thu 30 ngày" value={money(kpi?.doanhThu30Ngay)} color="#6366f1" />
        <KPICard icon="🎟" label="Vé bán tháng này" value={fmt(kpi?.soVeThang)} sub={`Tổng: ${fmt(kpi?.tongVe)} vé`} color="#f59e0b" />
        <KPICard icon="📋" label="Đơn đã thanh toán" value={fmt(kpi?.tongDonThanhToan)} sub={`Chờ: ${fmt(kpi?.tongDonCho)}`} color="#3b82f6" />
        <KPICard icon="✅" label="Tỷ lệ check-in" value={`${kpi?.tyLeCheckin || 0}%`} sub={`${fmt(kpi?.soVeCheckin)}/${fmt(kpi?.tongVe)} vé`} color="#ec4899" />
      </div>

      {/* Biểu đồ doanh thu 30 ngày */}
      <div className="bao-cao-section">
        <h3 className="bao-cao-section-title">📅 Doanh thu 30 ngày gần nhất</h3>
        <BarChart data={chartData} labelKey="ngay" valueKey="doanhThu" />
      </div>

      {/* Top phim */}
      <div className="bao-cao-section">
        <h3 className="bao-cao-section-title">🏆 Top phim theo doanh thu</h3>
        {topPhim.length === 0 ? <p className="admin-field-hint">Chưa có dữ liệu</p> : (
          <div className="bao-cao-top-phim">
            {topPhim.map((p, i) => (
              <div key={p.phimId} className="bao-cao-phim-row">
                <div className="bao-cao-phim-rank" style={{ color: i < 3 ? ["#f59e0b","#9ca3af","#cd7f32"][i] : "#64748b" }}>
                  {i < 3 ? ["🥇","🥈","🥉"][i] : `#${i + 1}`}
                </div>
                <img src={p.posterUrl || `https://picsum.photos/seed/bc-${p.phimId}/40/60`} alt={p.tenPhim} className="bao-cao-phim-poster" />
                <div className="bao-cao-phim-info">
                  <strong>{p.tenPhim}</strong>
                  <small>{fmt(p.soVe)} vé · {fmt(p.soDon)} đơn</small>
                </div>
                <div className="bao-cao-phim-revenue">{money(p.doanhThu)}</div>
                <div className="bao-cao-phim-bar-bg">
                  <div className="bao-cao-phim-bar-fill" style={{ width: `${Math.round((p.doanhThu / (topPhim[0]?.doanhThu || 1)) * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Phòng chiếu */}
      {phongData.length > 0 && (
        <div className="bao-cao-section">
          <h3 className="bao-cao-section-title">🏟 Phòng chiếu</h3>
          <table className="admin-table">
            <thead><tr><th>Phòng</th><th>Loại</th><th>Sức chứa</th><th>Tổng suất</th><th>Suất hôm nay</th><th>DT tháng</th></tr></thead>
            <tbody>
              {phongData.map(p => (
                <tr key={p.phongChieuId}>
                  <td><strong>{p.tenPhong}</strong><br/><small>{p.maPhong}</small></td>
                  <td>{p.loaiPhong || "—"}</td>
                  <td>{p.sucChua}</td>
                  <td>{p.tongSuat}</td>
                  <td>{p.suatHomNay}</td>
                  <td style={{ color: "#22c55e", fontWeight: 600 }}>{money(p.doanhThuThang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Đơn hàng gần đây */}
      <div className="bao-cao-section">
        <h3 className="bao-cao-section-title">🕐 20 đơn hàng gần nhất</h3>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Mã đơn</th><th>Khách hàng</th><th>Số vé</th><th>Tổng tiền</th>
                <th>Trạng thái</th><th>Kênh</th><th>Thời gian</th>
              </tr>
            </thead>
            <tbody>
              {donGanDay.length === 0 ? (
                <tr><td colSpan={7} className="admin-empty">Chưa có đơn hàng.</td></tr>
              ) : donGanDay.map(d => (
                <tr key={d.donDatVeId}>
                  <td><code style={{ fontSize: 12 }}>{d.maDon}</code></td>
                  <td>{d.tenKhach || <em style={{ color: "#64748b" }}>Vãng lai</em>}</td>
                  <td>{d.soVe}</td>
                  <td style={{ fontWeight: 600 }}>{money(d.tongThanhToan)}</td>
                  <td>
                    <span style={{ background: (TRANG_THAI_COLOR[d.trangThai] || "#64748b") + "22", color: TRANG_THAI_COLOR[d.trangThai] || "#64748b", padding: "2px 10px", borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
                      {TRANG_THAI_LABEL[d.trangThai] || d.trangThai}
                    </span>
                  </td>
                  <td><span style={{ fontSize: 12 }}>{d.kenhDat === "QUAY" ? "🏢 Quầy" : "🌐 Online"}</span></td>
                  <td style={{ fontSize: 12, color: "#94a3b8" }}>{new Date(d.taoLuc).toLocaleString("vi-VN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
