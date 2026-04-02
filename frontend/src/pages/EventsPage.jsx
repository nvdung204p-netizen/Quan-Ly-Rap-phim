import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function EventsPage() {
  const [data, setData] = useState([]);
  useEffect(() => {
    api.suKien().then(setData).catch(() => setData([]));
  }, []);

  return (
    <section>
      <h2>Sự kiện - Tin tức</h2>
      <ul>{data.map((x) => <li key={x.suKienId}><b>{x.tieuDe}</b> - {x.moTaNgan || "..."}</li>)}</ul>
    </section>
  );
}
