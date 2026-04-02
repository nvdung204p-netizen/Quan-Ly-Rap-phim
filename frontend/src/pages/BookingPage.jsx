import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";

export default function BookingPage() {
  const [params] = useSearchParams();
  const suatChieuId = Number(params.get("suatChieuId"));
  const [ghe, setGhe] = useState([]);
  const [picked, setPicked] = useState([]);
  const [don, setDon] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!suatChieuId) return;
    api.soDoGhe(suatChieuId).then(setGhe).catch((e) => setError(e.message));
  }, [suatChieuId]);

  async function taoDon() {
    try {
      const d = await api.taoDon({ suatChieuId, danhSachGheId: picked, loaiVeId: 1, kenhDat: "ONLINE" });
      setDon(d);
    } catch (e) {
      setError(e.message);
    }
  }

  async function thanhToan() {
    if (!don) return;
    const d = await api.thanhToan({ donDatVeId: don.donDatVeId, phuongThucThanhToanId: 3 });
    setDon({ ...don, qr: d.danhSachQrVe, trangThai: d.trangThai });
  }

  return (
    <section>
      <h2>Đặt vé</h2>
      {error && <p className="error">{error}</p>}
      {!suatChieuId && <p>Hãy chọn suất chiếu ở trang Lịch chiếu.</p>}
      <div className="seat-grid">
        {ghe.map((x) => (
          <button
            key={x.gheId}
            className={`seat ${x.daDat ? "booked" : ""} ${picked.includes(x.gheId) ? "picked" : ""}`}
            onClick={() => !x.daDat && setPicked((p) => (p.includes(x.gheId) ? p.filter((i) => i !== x.gheId) : [...p, x.gheId]))}
          >
            {x.maGhe}
          </button>
        ))}
      </div>
      <button onClick={taoDon}>Tạo đơn</button>
      {don && (
        <div className="card">
          <p>Mã đơn: {don.maDon}</p>
          <p>Tổng tiền: {don.tongThanhToan}</p>
          <button onClick={thanhToan}>Thanh toán</button>
          {don.qr && <ul>{don.qr.map((x) => <li key={x}>{x}</li>)}</ul>}
        </div>
      )}
    </section>
  );
}
