import { useEffect, useState } from "react";

export default function PromotionsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    // Chua co endpoint public rieng cho khuyen mai, dung du lieu placeholder de hien thi FE.
    setItems([
      { id: 1, title: "Thành viên thường giảm 10%" },
      { id: 2, title: "Thành viên VIP giảm 20%" },
      { id: 3, title: "VIP tặng combo 1 bỏng + 1 nước mỗi tuần" }
    ]);
  }, []);

  return (
    <section>
      <h2>Khuyến mãi</h2>
      <ul>{items.map((x) => <li key={x.id}>{x.title}</li>)}</ul>
    </section>
  );
}
