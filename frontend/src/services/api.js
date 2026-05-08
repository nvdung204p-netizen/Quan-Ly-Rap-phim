import { API_BASE_URL } from "../config";

export function getToken() {
  return localStorage.getItem("accessToken") || "";
}

function apiErrorMessage(res, text, parsed, json) {
  if (res.status === 401) return "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
  if (res.status === 403) return "Tài khoản không có quyền thực hiện thao tác này.";

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
      // atob() giải mã ra binary string (Latin-1), cần chuyển sang UTF-8 để hiển thị đúng tiếng Việt
      const binaryPayload = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
      const bytes = Uint8Array.from(binaryPayload, (c) => c.charCodeAt(0));
      const json = JSON.parse(new TextDecoder().decode(bytes));

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
  hoSoCaNhan: () => request("/api/TaiKhoan/ho-so"),
  capNhatHoSo: (payload) =>
    request("/api/TaiKhoan/ho-so", { method: "PUT", body: JSON.stringify(payload) }),
  adminDanhSachTaiKhoan: () => request("/api/Admin/tai-khoan"),
  adminTaoTaiKhoanNhanVien: (payload) =>
    request("/api/Admin/tai-khoan/nhan-vien", { method: "POST", body: JSON.stringify(payload) }),
  adminCapNhatTrangThaiTaiKhoan: (taiKhoanId, payload) =>
    request(`/api/Admin/tai-khoan/${taiKhoanId}/trang-thai`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  adminQrThanhToan: () => request("/api/Admin/qr-thanh-toan"),
  adminTaoQrThanhToan: (payload) =>
    request("/api/Admin/qr-thanh-toan", { method: "POST", body: JSON.stringify(payload) }),
  adminCapNhatQrThanhToan: (qrThanhToanId, payload) =>
    request(`/api/Admin/qr-thanh-toan/${qrThanhToanId}`, { method: "PUT", body: JSON.stringify(payload) }),
  adminXoaQrThanhToan: (qrThanhToanId) =>
    request(`/api/Admin/qr-thanh-toan/${qrThanhToanId}`, { method: "DELETE" }),
  phim: () => request("/api/Phim"),
  phimById: (id) => request(`/api/Phim/${id}`),
  gioiThieuPhim: (phimId) => request(`/api/Phim/${phimId}/gioi-thieu`),
  trailerPhim: (phimId) => request(`/api/Phim/${phimId}/trailer`),
  taoPhim: (payload) =>
    request("/api/Phim", { method: "POST", body: JSON.stringify(payload) }),
  capNhatPhim: (phimId, payload) =>
    request(`/api/Phim/${phimId}`, { method: "PUT", body: JSON.stringify(payload) }),
  xoaPhim: (phimId) => request(`/api/Phim/${phimId}`, { method: "DELETE" }),
  taoTrailerPhim: (phimId, payload) =>
    request(`/api/Phim/${phimId}/trailer`, { method: "POST", body: JSON.stringify(payload) }),
  suatChieu: () => request("/api/SuatChieu"),
  taoSuatChieu: (payload) =>
    request("/api/SuatChieu", { method: "POST", body: JSON.stringify(payload) }),
  capNhatSuatChieu: (suatChieuId, payload) =>
    request(`/api/SuatChieu/${suatChieuId}`, { method: "PUT", body: JSON.stringify(payload) }),
  xoaSuatChieu: (suatChieuId) => request(`/api/SuatChieu/${suatChieuId}`, { method: "DELETE" }),
  giaVePhim: () => request("/api/GiaVe/phim"),
  suKien: () => request("/api/SuKien"),
  suKienById: (id) => request(`/api/SuKien/${id}`),
  soDoGhe: (suatChieuId) => request(`/api/DatVe/so-do-ghe/${suatChieuId}`),
  loaiVeDatVe: () => request("/api/DatVe/loai-ve"),
  phuongThucThanhToan: () => request("/api/DatVe/phuong-thuc-thanh-toan"),
  qrThanhToanPublic: () => request("/api/DatVe/qr-thanh-toan"),
  chiTietDon: (donDatVeId) => request(`/api/DatVe/don/${donDatVeId}`),
  lichSuDatVe: () => request("/api/DatVe/lich-su"),
  chiTietVeDayDu: (donDatVeId) => request(`/api/DatVe/don/${donDatVeId}/chi-tiet-ve`),
  taoDon: (payload) =>
    request("/api/DatVe/tao-don", { method: "POST", body: JSON.stringify(payload) }),
  thanhToan: (payload) =>
    request("/api/DatVe/thanh-toan", { method: "POST", body: JSON.stringify(payload) }),
  huyDon: (donDatVeId) =>
    request(`/api/DatVe/don/${donDatVeId}/huy`, { method: "POST" }),
  checkinQr: (payload) =>
    request("/api/VanHanh/checkin-qr", { method: "POST", body: JSON.stringify(payload) }),
  searchDonDatVe: (q) => request(`/api/VanHanh/don-dat-ve?q=${encodeURIComponent(q)}`),
  lichSuCheckin: () => request("/api/VanHanh/lich-su-checkin"),
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
  },
  uploadQrThanhToan: async (file) => {
    const token = getToken();
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API_BASE_URL}/api/Upload/qr-thanh-toan`, {
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

  // Phòng chiếu
  adminPhongChieu: () => request("/api/PhongChieu"),
  adminGetPhongChieu: (id) => request(`/api/PhongChieu/${id}`),
  adminTaoPhongChieu: (payload) => request("/api/PhongChieu", { method: "POST", body: JSON.stringify(payload) }),
  adminCapNhatPhongChieu: (id, payload) => request(`/api/PhongChieu/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  adminGheTheoPhong: (id) => request(`/api/PhongChieu/${id}/ghe`),
  adminCapNhatLoaiGheDon: (phongId, gheId, maLoai) => request(`/api/PhongChieu/${phongId}/ghe/${gheId}`, { method: "PATCH", body: JSON.stringify({ maLoai }) }),
  adminBulkCapNhatLoaiGhe: (phongId, items) => request(`/api/PhongChieu/${phongId}/ghe/bulk-update`, { method: "POST", body: JSON.stringify(items) }),

  // Thẻ thành viên
  hangThanhVien: () => request("/api/ThanhVien/hang"),
  theCuaToi: () => request("/api/ThanhVien/the-cua-toi"),
  dangKyTheThanhVien: () => request("/api/ThanhVien/dang-ky", { method: "POST" }),
  adminDanhSachThe: () => request("/api/ThanhVien/admin/danh-sach"),

  // Giá vé
  adminGiaVePhim: () => request("/api/GiaVe/phim"),
  adminTaoGiaVePhim: (payload) => request("/api/GiaVe/phim", { method: "POST", body: JSON.stringify(payload) }),
  adminCapNhatGiaVePhim: (id, payload) => request(`/api/GiaVe/phim/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  adminXoaGiaVePhim: (id) => request(`/api/GiaVe/phim/${id}`, { method: "DELETE" }),
  
  // Loại ghế
  adminLoaiGhe: () => request("/api/GiaVe/loai-ghe"),
  adminCapNhatLoaiGhe: (id, payload) => request(`/api/GiaVe/loai-ghe/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  // Giảm giá
  adminGiamGia: () => request("/api/KinhDoanh/giam-gia"),
  adminTaoGiamGia: (payload) => request("/api/KinhDoanh/giam-gia", { method: "POST", body: JSON.stringify(payload) }),
  adminCapNhatGiamGia: (id, payload) => request(`/api/KinhDoanh/giam-gia/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  adminXoaGiamGia: (id) => request(`/api/KinhDoanh/giam-gia/${id}`, { method: "DELETE" }),

  // Hạng & thẻ thành viên
  adminHangThanhVien: () => request("/api/KinhDoanh/hang-thanh-vien"),
  adminTaoHangThanhVien: (payload) => request("/api/KinhDoanh/hang-thanh-vien", { method: "POST", body: JSON.stringify(payload) }),
  adminCapNhatHangThanhVien: (id, payload) => request(`/api/KinhDoanh/hang-thanh-vien/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  adminTheThanhVien: () => request("/api/KinhDoanh/the-thanh-vien"),

  // Ngân hàng
  adminNganHang: () => request("/api/KinhDoanh/ngan-hang"),
  adminTaoNganHang: (payload) => request("/api/KinhDoanh/ngan-hang", { method: "POST", body: JSON.stringify(payload) }),
  adminCapNhatNganHang: (id, payload) => request(`/api/KinhDoanh/ngan-hang/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  adminXoaNganHang: (id) => request(`/api/KinhDoanh/ngan-hang/${id}`, { method: "DELETE" }),

  // Sự kiện
  adminSuKien: () => request("/api/SuKien"),
  adminTaoSuKien: (payload) => request("/api/SuKien", { method: "POST", body: JSON.stringify(payload) }),
  adminCapNhatSuKien: (id, payload) => request(`/api/SuKien/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  adminXoaSuKien: (id) => request(`/api/SuKien/${id}`, { method: "DELETE" }),

  // Hỗ trợ khách hàng
  adminKenhHoTro: () => request("/api/KinhDoanh/ho-tro"),
  adminTaoKenhHoTro: (payload) => request("/api/KinhDoanh/ho-tro", { method: "POST", body: JSON.stringify(payload) }),
  adminCapNhatKenhHoTro: (id, payload) => request(`/api/KinhDoanh/ho-tro/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  adminXoaKenhHoTro: (id) => request(`/api/KinhDoanh/ho-tro/${id}`, { method: "DELETE" }),

  // Báo cáo thống kê
  adminBaoCaoTongQuan: () => request("/api/Admin/bao-cao/tong-quan"),
  adminBaoCaoDoanhThuNgay: (tuNgay, denNgay) => {
    let q = "/api/Admin/bao-cao/doanh-thu-theo-ngay";
    const params = [];
    if (tuNgay) params.push(`tuNgay=${tuNgay}`);
    if (denNgay) params.push(`denNgay=${denNgay}`);
    if (params.length) q += "?" + params.join("&");
    return request(q);
  },
  adminBaoCaoTopPhim: (limit = 10) => request(`/api/Admin/bao-cao/doanh-thu-theo-phim?limit=${limit}`),
  adminBaoCaoDonGanDay: (limit = 20) => request(`/api/Admin/bao-cao/don-hang-gan-day?limit=${limit}`),
  adminBaoCaoPhongChieu: () => request("/api/Admin/bao-cao/phong-chieu"),
};

