import { useSearchParams } from "react-router-dom";

const TABS = [
  { id: "gioi-thieu", label: "Giới thiệu" },
  { id: "dich-vu", label: "Dịch vụ" },
  { id: "phong-chieu", label: "Phòng chiếu - Nhà hát" }
];

export default function GioiThieuPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "gioi-thieu";
  const active = TABS.some((t) => t.id === tab) ? tab : "gioi-thieu";

  function setTab(id) {
    setSearchParams(id === "gioi-thieu" ? {} : { tab: id });
  }

  return (
    <section className="gioi-thieu-page">
      <h1 className="gioi-thieu-title">Giới thiệu</h1>
      <div className="gioi-thieu-pills" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            className={`gioi-thieu-pill ${active === t.id ? "is-active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {active === "gioi-thieu" && (
        <div className="gioi-thieu-panel" role="tabpanel">
          <p>
            National Cinema Center (NCC) là điểm đến cho những tác phẩm điện ảnh trong và ngoài nước, với hệ thống
            phòng chiếu hiện đại và trải nghiệm âm thanh hình ảnh chuẩn rạp.
          </p>
          <p>
            Chúng tôi cam kết mang đến không gian xem phim an toàn, thân thiện và dịch vụ đặt vé tiện lợi cho khán
            giả.
          </p>
        </div>
      )}

      {active === "dich-vu" && (
        <div className="gioi-thieu-panel" role="tabpanel">
          <p>Đặt vé trực tuyến, chọn ghế theo sơ đồ phòng, thanh toán linh hoạt.</p>
          <p>Hỗ trợ khuyến mãi, mã giảm giá và chương trình thành viên (đang mở rộng).</p>
        </div>
      )}

      {active === "phong-chieu" && (
        <div className="gioi-thieu-panel" role="tabpanel">
          <p>Phòng chiếu được thiết kế tối ưu góc nhìn và âm thanh; nhà hát đa năng phục vụ sự kiện và suất chiếu đặc biệt.</p>
          <p>Liên hệ hotline hoặc quầy vé để biết lịch trình và thuê phòng.</p>
        </div>
      )}
    </section>
  );
}
