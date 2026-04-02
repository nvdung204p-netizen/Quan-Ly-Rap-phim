import { useState } from "react";
import { api } from "../services/api";

export default function StaffCheckinPage() {
  const [maQrVe, setMaQrVe] = useState("");
  const [msg, setMsg] = useState("");

  async function checkin() {
    try {
      const r = await api.checkinQr({ maQrVe });
      setMsg(`${r.message} - Ve ${r.veId}`);
    } catch (e) {
      setMsg(e.message);
    }
  }

  return (
    <section>
      <h2>Nhân viên - Checkin vé</h2>
      <input placeholder="Nhập mã QR vé" value={maQrVe} onChange={(e) => setMaQrVe(e.target.value)} />
      <button onClick={checkin}>Checkin</button>
      {msg && <p>{msg}</p>}
    </section>
  );
}
