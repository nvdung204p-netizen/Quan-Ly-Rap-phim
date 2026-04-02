import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function PricesPage() {
  const [data, setData] = useState([]);
  useEffect(() => {
    api.giaVePhim().then(setData).catch(() => setData([]));
  }, []);

  return (
    <section>
      <h2>Giá vé</h2>
      <ul>
        {data.map((x) => (
          <li key={x.giaVePhimId}>
            Phim #{x.phimId} - {x.giaCoBan}
          </li>
        ))}
      </ul>
    </section>
  );
}
