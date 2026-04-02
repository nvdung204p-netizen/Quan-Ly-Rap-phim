import { API_BASE_URL } from "../config";

export function getToken() {
  return localStorage.getItem("accessToken") || "";
}

function apiErrorMessage(res, text, parsed, json) {
  const msg = parsed && json && typeof json.message === "string" ? json.message.trim() : "";
  if (msg) return msg;
  if (parsed && json && json.errors != null) {
    try {
      const s = JSON.stringify(json.errors);
      if (s && s !== "{}") return s.slice(0, 280);
    } catch {
      /* ignore */
    }
  }
  const raw = (text || "").trim();
  if (raw && !parsed) return raw.slice(0, 300);
  const http = `HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ""}`.trim();
  return http || "Không nhận được phản hồi hợp lệ từ API (kiểm tra backend đang chạy, proxy /api).";
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  const text = await res.text();
  let parsed = false;
  let json = null;
  if (text && text.trim()) {
    try {
      json = JSON.parse(text);
      parsed = true;
    } catch {
      parsed = false;
    }
  } else {
    json = {};
    parsed = true;
  }

  const envelopeOk = parsed && json && json.success === true;
  if (!res.ok || !envelopeOk) {
    throw new Error(apiErrorMessage(res, text, parsed, json));
  }
  return json.data !== undefined ? json.data : json;
}

/** Claim role chuan cua .NET JWT (ClaimTypes.Role) — FE can doc ca `role` ngan (neu co). */
const JWT_ROLE_CLAIM_URI =
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

function normalizeJwtRoles(json) {
  const raw = json.role ?? json[JWT_ROLE_CLAIM_URI];
  if (raw == null || raw === "") return [];
  return Array.isArray(raw) ? raw : [raw];
}

export const api = {
  getMeFromToken: () => {
    try {
      const payload = getToken().split(".")[1];
      if (!payload) return null;
      const json = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
      const roles = normalizeJwtRoles(json);
      const sub = json.taiKhoanId ?? json.sub;
      const taiKhoanId = sub != null ? Number(sub) : undefined;
      const hoTen = json.unique_name || json.name || "Nguoi dung";
      return { taiKhoanId, hoTen, vaiTro: roles };
    } catch {
      return null;
    }
  },
  dangNhap: (payload) =>
    request("/api/Auth/dang-nhap", { method: "POST", body: JSON.stringify(payload) }),
  dangKy: (payload) =>
    request("/api/Auth/dang-ky", { method: "POST", body: JSON.stringify(payload) }),
  guiOtpQuenMatKhau: (payload) =>
    request("/api/Auth/quen-mat-khau/gui-otp", { method: "POST", body: JSON.stringify(payload) }),
  datLaiMatKhau: (payload) =>
    request("/api/Auth/quen-mat-khau/dat-lai", { method: "POST", body: JSON.stringify(payload) }),
  phim: () => request("/api/Phim"),
  phimById: (id) => request(`/api/Phim/${id}`),
  gioiThieuPhim: (phimId) => request(`/api/Phim/${phimId}/gioi-thieu`),
  trailerPhim: (phimId) => request(`/api/Phim/${phimId}/trailer`),
  taoPhim: (payload) =>
    request("/api/Phim", { method: "POST", body: JSON.stringify(payload) }),
  taoTrailerPhim: (phimId, payload) =>
    request(`/api/Phim/${phimId}/trailer`, { method: "POST", body: JSON.stringify(payload) }),
  suatChieu: () => request("/api/SuatChieu"),
  taoSuatChieu: (payload) =>
    request("/api/SuatChieu", { method: "POST", body: JSON.stringify(payload) }),
  giaVePhim: () => request("/api/GiaVe/phim"),
  suKien: () => request("/api/SuKien"),
  soDoGhe: (suatChieuId) => request(`/api/DatVe/so-do-ghe/${suatChieuId}`),
  taoDon: (payload) =>
    request("/api/DatVe/tao-don", { method: "POST", body: JSON.stringify(payload) }),
  thanhToan: (payload) =>
    request("/api/DatVe/thanh-toan", { method: "POST", body: JSON.stringify(payload) }),
  checkinQr: (payload) =>
    request("/api/VanHanh/checkin-qr", { method: "POST", body: JSON.stringify(payload) }),
  /** Upload file ảnh poster → trả về URL công khai trên server */
  uploadPoster: async (file) => {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/api/Upload/poster`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || "Upload thất bại");
    }
    const inner = data?.data ?? data;
    const url = inner?.url ?? inner?.Url;
    if (!url) throw new Error("Máy chủ không trả URL ảnh");
    return url;
  },
  uploadTrailer: async (file) => {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/api/Upload/trailer`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
      throw new Error(data?.message || "Upload thất bại");
    }
    const inner = data?.data ?? data;
    const url = inner?.url ?? inner?.Url;
    if (!url) throw new Error("Máy chủ không trả URL video");
    return url;
  }
};
