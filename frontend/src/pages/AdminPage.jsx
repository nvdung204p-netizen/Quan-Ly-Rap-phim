import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import AdminPhongChieu from "../components/admin/AdminPhongChieu";
import AdminGiaVe from "../components/admin/AdminGiaVe";
import AdminGiamGia from "../components/admin/AdminGiamGia";
import AdminNganHang from "../components/admin/AdminNganHang";
import AdminSuKien from "../components/admin/AdminSuKien";
import AdminHoTro from "../components/admin/AdminHoTro";
import AdminBaoCao from "../components/admin/AdminBaoCao";
function formatDateTime(value) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/** Giá trị cho input datetime-local theo giờ máy người dùng */
function toDatetimeLocalValue(v) {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function labelTrangThaiSuat(ma) {
  if (!ma) return "—";
  if (ma === "DANG_MO_BAN") return "Đang mở bán";
  if (ma === "DONG_BAN") return "Đóng bán";
  if (ma === "HUY") return "Huỷ";
  if (ma === "DA_KET_THUC") return "Đã kết thúc";
  return ma;
}

function isToday(isoOrDate) {
  if (!isoOrDate) return false;
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return false;
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth() === t.getMonth() &&
    d.getDate() === t.getDate()
  );
}

function toDateInputValue(v) {
  if (!v) return "";
  const s = String(v);
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

function formatNgayVN(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function labelTrangThai(ma) {
  if (ma === "SAP_CHIEU") return "Sắp chiếu";
  if (ma === "DANG_CHIEU") return "Đang chiếu";
  return ma || "—";
}

/** So với hôm nay (local): sau hôm nay → sắp chiếu; còn lại → đang chiếu. Chưa chọn ngày → SAP_CHIEU. */
function computeTrangThaiFromNgay(yyyyMmDd) {
  if (!yyyyMmDd || !String(yyyyMmDd).trim()) return "SAP_CHIEU";
  const [y, m, d] = String(yyyyMmDd)
    .split("-")
    .map((x) => parseInt(x, 10));
  if (!y || !m || !d) return "SAP_CHIEU";
  const release = new Date(y, m - 1, d);
  release.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return release > today ? "SAP_CHIEU" : "DANG_CHIEU";
}

const initialPhimForm = () => ({
  tenPhim: "",
  theLoai: "",
  daoDien: "",
  dienVien: "",
  thoiLuongPhut: "",
  gioiHanTuoi: "T16",
  ngonNgu: "Tiếng Việt",
  quocGia: "",
  moTa: "",
  ngayKhoiChieu: "",
  posterUrl: "",
  trailerUrl: "",
  trangThai: "SAP_CHIEU",
  trangThaiTuDong: true
});

const initialNvForm = () => ({
  hoTen: "",
  email: "",
  soDienThoai: "",
  matKhau: "",
  xacNhanMatKhau: ""
});

const initialQrForm = () => ({
  tenHienThi: "",
  urlAnhQr: "",
  huongDan: "",
  thuTu: 0,
  hoatDong: true
});

export default function AdminPage({ user }) {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") || "tong-quan";

  const [phim, setPhim] = useState([]);
  const [suats, setSuats] = useState([]);
  const [taiKhoanList, setTaiKhoanList] = useState([]);
  const [nv, setNv] = useState(initialNvForm);

  const [selectedPhimId, setSelectedPhimId] = useState(0);
  const [p, setP] = useState(initialPhimForm);
  const [s, setS] = useState({
    phimId: 0,
    phongChieuId: 1,
    thoiGianBatDau: "",
    thoiGianKetThuc: "",
    trangThai: "DANG_MO_BAN"
  });

  const [err, setErr] = useState("");
  const [success, setSuccess] = useState("");
  const [posterUploading, setPosterUploading] = useState(false);
  const [trailerUploading, setTrailerUploading] = useState(false);
  const [posterLocalUrl, setPosterLocalUrl] = useState(null);
  const [editingPhimId, setEditingPhimId] = useState(null);
  const [editingSuatId, setEditingSuatId] = useState(null);

  const [qrList, setQrList] = useState([]);
  const [qrForm, setQrForm] = useState(() => initialQrForm());
  const [editingQrId, setEditingQrId] = useState(null);
  const [qrUploading, setQrUploading] = useState(false);

  const loadQrThanhToan = useCallback(async () => {
    try {
      const list = await api.adminQrThanhToan();
      setQrList(Array.isArray(list) ? list : []);
    } catch {
      setQrList([]);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (posterLocalUrl) URL.revokeObjectURL(posterLocalUrl);
    };
  }, [posterLocalUrl]);

  async function loadPhim() {
    try {
      const list = await api.phim();
      setPhim(Array.isArray(list) ? list : []);
    } catch {
      setPhim([]);
    }
  }

  async function loadSuats() {
    try {
      const list = await api.suatChieu();
      setSuats(Array.isArray(list) ? list : []);
    } catch {
      setSuats([]);
    }
  }

  useEffect(() => {
    loadPhim();
    loadSuats();
  }, []);

  async function loadTaiKhoan() {
    try {
      const list = await api.adminDanhSachTaiKhoan();
      setTaiKhoanList(Array.isArray(list) ? list : []);
    } catch {
      setTaiKhoanList([]);
    }
  }

  useEffect(() => {
    if (tab !== "nguoi-dung") return;
    loadTaiKhoan();
  }, [tab]);

  useEffect(() => {
    if (tab !== "thanh-toan") return;
    loadQrThanhToan();
  }, [tab, loadQrThanhToan]);

  useEffect(() => {
    if (!p.trangThaiTuDong) return;
    const next = computeTrangThaiFromNgay(p.ngayKhoiChieu);
    setP((prev) => (prev.trangThai === next ? prev : { ...prev, trangThai: next }));
  }, [p.ngayKhoiChieu, p.trangThaiTuDong]);

  useEffect(() => {
    if (!phim.length) return;
    if (selectedPhimId) return;
    const firstId = phim[0].phimId;
    setSelectedPhimId(firstId);
    setS((prev) => ({ ...prev, phimId: prev.phimId || firstId }));
  }, [phim, selectedPhimId]);

  const suatsHomNay = useMemo(() => suats.filter((x) => isToday(x.thoiGianBatDau)).length, [suats]);

  const suatsForTable = useMemo(() => {
    const list = selectedPhimId
      ? suats.filter((x) => Number(x.phimId) === Number(selectedPhimId))
      : suats;

    return [...list].sort((a, b) => new Date(a.thoiGianBatDau) - new Date(b.thoiGianBatDau));
  }, [suats, selectedPhimId]);

  const posterTheoPhimId = useMemo(() => {
    const m = new Map();
    for (const x of phim) {
      if (x?.phimId != null) m.set(Number(x.phimId), (x.posterUrl && String(x.posterUrl).trim()) || "");
    }
    return m;
  }, [phim]);

  const posterPhimFormSuat = s.phimId ? posterTheoPhimId.get(Number(s.phimId)) || "" : "";

  async function handlePosterFile(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Vui lòng chọn file ảnh (jpg, png, webp...).");
      return;
    }
    setErr("");
    if (posterLocalUrl) {
      URL.revokeObjectURL(posterLocalUrl);
      setPosterLocalUrl(null);
    }
    const local = URL.createObjectURL(file);
    setPosterLocalUrl(local);
    setPosterUploading(true);
    try {
      const url = await api.uploadPoster(file);
      setP((prev) => ({ ...prev, posterUrl: url }));
      URL.revokeObjectURL(local);
      setPosterLocalUrl(null);
      setSuccess("Đã tải ảnh poster lên máy chủ.");
    } catch (e) {
      setErr(e.message);
      URL.revokeObjectURL(local);
      setPosterLocalUrl(null);
      setP((prev) => ({ ...prev, posterUrl: "" }));
    } finally {
      setPosterUploading(false);
    }
  }

  async function handleTrailerFile(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    const okType = file.type.startsWith("video/") || /\.(mp4|webm|mov|mkv)$/i.test(file.name);
    if (!okType) {
      setErr("Vui lòng chọn file video (mp4, webm, mov, mkv).");
      return;
    }
    setErr("");
    setTrailerUploading(true);
    try {
      const url = await api.uploadTrailer(file);
      setP((prev) => ({ ...prev, trailerUrl: url }));
      setSuccess("Đã tải trailer lên máy chủ.");
    } catch (e) {
      setErr(e.message);
      setP((prev) => ({ ...prev, trailerUrl: "" }));
    } finally {
      setTrailerUploading(false);
    }
  }

  function huySuaPhim() {
    if (posterLocalUrl) {
      URL.revokeObjectURL(posterLocalUrl);
      setPosterLocalUrl(null);
    }
    setEditingPhimId(null);
    setP(initialPhimForm());
    setErr("");
  }

  async function batDauSuaPhim(x) {
    setErr("");
    setSuccess("");
    if (posterLocalUrl) {
      URL.revokeObjectURL(posterLocalUrl);
      setPosterLocalUrl(null);
    }
    let trailerUrl = "";
    try {
      const trailers = await api.trailerPhim(x.phimId);
      if (Array.isArray(trailers) && trailers.length && trailers[0]?.trailerUrl) {
        trailerUrl = String(trailers[0].trailerUrl);
      }
    } catch {
      /* ignore */
    }
    setP({
      tenPhim: x.tenPhim || "",
      theLoai: x.theLoai || "",
      daoDien: x.daoDien || "",
      dienVien: x.dienVien || "",
      thoiLuongPhut: x.thoiLuongPhut != null && x.thoiLuongPhut !== "" ? String(x.thoiLuongPhut) : "",
      gioiHanTuoi: x.gioiHanTuoi || "T16",
      ngonNgu: x.ngonNgu || "Tiếng Việt",
      quocGia: x.quocGia || "",
      moTa: x.moTa || "",
      ngayKhoiChieu: toDateInputValue(x.ngayKhoiChieu),
      posterUrl: x.posterUrl || "",
      trailerUrl,
      trangThai: x.trangThai || "SAP_CHIEU",
      trangThaiTuDong: false
    });
    setEditingPhimId(x.phimId);
  }

  async function xoaPhimClick(x) {
    const ok = window.confirm(
      `Xóa phim "${x.tenPhim}"? Toàn bộ suất chiếu và vé liên quan sẽ bị xóa. Thao tác không hoàn tác.`
    );
    if (!ok) return;
    try {
      setErr("");
      setSuccess("");
      await api.xoaPhim(x.phimId);
      if (editingPhimId === x.phimId) huySuaPhim();
      if (Number(selectedPhimId) === Number(x.phimId)) setSelectedPhimId(0);
      setSuccess("Đã xóa phim.");
      await loadPhim();
      await loadSuats();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function luuPhim() {
    try {
      setErr("");
      setSuccess("");

      if (!p.tenPhim.trim()) {
        setErr("Vui lòng nhập tên phim.");
        return;
      }

      let thoiLuongPhut = null;
      if (p.thoiLuongPhut !== "" && p.thoiLuongPhut != null) {
        const n = Number(p.thoiLuongPhut);
        if (Number.isNaN(n) || n < 1) {
          setErr("Thời lượng (phút) phải là số dương.");
          return;
        }
        thoiLuongPhut = n;
      }

      const trangThaiGui = p.trangThaiTuDong ? computeTrangThaiFromNgay(p.ngayKhoiChieu) : p.trangThai;

      const payload = {
        tenPhim: p.tenPhim.trim(),
        theLoai: p.theLoai.trim() || null,
        daoDien: p.daoDien.trim() || null,
        dienVien: p.dienVien.trim() || null,
        thoiLuongPhut,
        gioiHanTuoi: p.gioiHanTuoi.trim() || null,
        ngayKhoiChieu: p.ngayKhoiChieu || null,
        ngonNgu: p.ngonNgu.trim() || null,
        quocGia: p.quocGia.trim() || null,
        moTa: p.moTa.trim() || null,
        posterUrl: p.posterUrl.trim() || null,
        trangThai: trangThaiGui
      };

      if (editingPhimId) {
        await api.capNhatPhim(editingPhimId, payload);
        setSuccess("Cập nhật phim thành công.");
        huySuaPhim();
        await loadPhim();
        return;
      }

      const created = await api.taoPhim(payload);

      const phimId = created?.phimId;
      if (phimId && p.trailerUrl.trim()) {
        try {
          await api.taoTrailerPhim(phimId, {
            tieuDe: "Trailer",
            trailerUrl: p.trailerUrl.trim(),
            thuTuHienThi: 1
          });
        } catch (te) {
          setErr(`Đã tạo phim nhưng thêm trailer thất bại: ${te.message}`);
          await loadPhim();
          return;
        }
      }

      setSuccess("Tạo phim thành công.");
      if (posterLocalUrl) {
        URL.revokeObjectURL(posterLocalUrl);
        setPosterLocalUrl(null);
      }
      setP(initialPhimForm());
      await loadPhim();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function taoTaiKhoanNhanVien() {
    try {
      setErr("");
      setSuccess("");
      if (!nv.hoTen.trim()) {
        setErr("Vui lòng nhập họ tên nhân viên.");
        return;
      }
      if (!nv.email.trim() && !nv.soDienThoai.trim()) {
        setErr("Vui lòng nhập ít nhất email hoặc số điện thoại.");
        return;
      }
      if (!nv.matKhau) {
        setErr("Vui lòng nhập mật khẩu ban đầu.");
        return;
      }
      if (nv.matKhau !== nv.xacNhanMatKhau) {
        setErr("Xác nhận mật khẩu không khớp.");
        return;
      }
      await api.adminTaoTaiKhoanNhanVien({
        hoTen: nv.hoTen.trim(),
        email: nv.email.trim(),
        soDienThoai: nv.soDienThoai.trim(),
        matKhau: nv.matKhau
      });
      setSuccess("Đã tạo tài khoản nhân viên (vai trò NHAN_VIEN).");
      setNv(initialNvForm());
      await loadTaiKhoan();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function doiTrangThaiTk(x, trangThai) {
    const verb = trangThai === "KHOA" ? "Khóa" : "Mở khóa";
    if (!window.confirm(`${verb} tài khoản "${x.hoTen}"?`)) return;
    try {
      setErr("");
      setSuccess("");
      await api.adminCapNhatTrangThaiTaiKhoan(x.taiKhoanId, { trangThai });
      setSuccess(trangThai === "KHOA" ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản.");
      await loadTaiKhoan();
    } catch (e) {
      setErr(e.message);
    }
  }

  function defaultSuatFormValues() {
    const pid = selectedPhimId || phim[0]?.phimId || 0;
    return {
      phimId: pid,
      phongChieuId: 1,
      thoiGianBatDau: "",
      thoiGianKetThuc: "",
      trangThai: "DANG_MO_BAN"
    };
  }

  function moThemSuatMoi() {
    setErr("");
    setSuccess("");
    setEditingSuatId(null);
    setS(defaultSuatFormValues());
    document.getElementById("admin-suat-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function batDauSuaSuat(x) {
    setErr("");
    setSuccess("");
    setEditingSuatId(x.suatChieuId);
    setS({
      phimId: Number(x.phimId),
      phongChieuId: Number(x.phongChieuId) || 1,
      thoiGianBatDau: toDatetimeLocalValue(x.thoiGianBatDau),
      thoiGianKetThuc: toDatetimeLocalValue(x.thoiGianKetThuc),
      trangThai: x.trangThai || "DANG_MO_BAN"
    });
    document.getElementById("admin-suat-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function huySuaSuat() {
    setEditingSuatId(null);
    setS(defaultSuatFormValues());
  }

  async function luuSuatChieu() {
    try {
      setErr("");
      setSuccess("");

      if (!s.phimId) { setErr("Vui lòng chọn phim."); return; }
      if (!s.phongChieuId) { setErr("Vui lòng chọn phòng chiếu."); return; }
      if (!s.thoiGianBatDau) { setErr("Vui lòng chọn thời gian bắt đầu."); return; }

      const selectedPhim = phim.find(p => Number(p.phimId) === Number(s.phimId));
      let thoiGianKetThuc = s.thoiGianKetThuc;
      // Tự tính giờ kết thúc nếu chưa có (thêm thời lượng + 15 phút dọn dẹp)
      if (!thoiGianKetThuc && selectedPhim?.thoiLuongPhut) {
        const batDau = new Date(s.thoiGianBatDau);
        const ketThuc = new Date(batDau.getTime() + (selectedPhim.thoiLuongPhut + 15) * 60000);
        const pad = n => String(n).padStart(2, "0");
        thoiGianKetThuc = `${ketThuc.getFullYear()}-${pad(ketThuc.getMonth()+1)}-${pad(ketThuc.getDate())}T${pad(ketThuc.getHours())}:${pad(ketThuc.getMinutes())}`;
      }

      const payload = {
        phimId: Number(s.phimId),
        phongChieuId: Number(s.phongChieuId),
        thoiGianBatDau: s.thoiGianBatDau,
        thoiGianKetThuc: thoiGianKetThuc || s.thoiGianBatDau,
        trangThai: s.trangThai
      };

      if (editingSuatId) {
        await api.capNhatSuatChieu(editingSuatId, payload);
        setSuccess("Đã cập nhật suất chiếu.");
        setEditingSuatId(null);
      } else {
        await api.taoSuatChieu(payload);
        setSuccess("Đã tạo suất chiếu.");
      }

      setS(defaultSuatFormValues());
      await loadSuats();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function xoaSuatHang(x) {
    const line = `${x.tenPhim || "Suất"} — ${formatDateTime(x.thoiGianBatDau)}`;
    if (!window.confirm(`Xóa suất chiếu?\n${line}\nThao tác không hoàn tác.`)) return;
    try {
      setErr("");
      setSuccess("");
      await api.xoaSuatChieu(x.suatChieuId);
      if (editingSuatId === x.suatChieuId) {
        setEditingSuatId(null);
        setS(defaultSuatFormValues());
      }
      setSuccess("Đã xóa suất chiếu.");
      await loadSuats();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function handleQrFile(ev) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setErr("Vui lòng chọn file ảnh (jpg, png, webp…).");
      return;
    }
    setErr("");
    setQrUploading(true);
    try {
      const url = await api.uploadQrThanhToan(file);
      setQrForm((f) => ({ ...f, urlAnhQr: url }));
      setSuccess("Đã tải ảnh QR lên máy chủ.");
    } catch (e) {
      setErr(e.message);
    } finally {
      setQrUploading(false);
    }
  }

  function huySuaQr() {
    setEditingQrId(null);
    setQrForm(initialQrForm());
  }

  function batDauSuaQr(x) {
    setEditingQrId(x.qrThanhToanId);
    setQrForm({
      tenHienThi: x.tenHienThi || "",
      urlAnhQr: x.urlAnhQr || "",
      huongDan: x.huongDan || "",
      thuTu: x.thuTu ?? 0,
      hoatDong: Boolean(x.hoatDong)
    });
  }

  async function luuQrThanhToan() {
    try {
      setErr("");
      setSuccess("");
      if (!qrForm.tenHienThi.trim()) {
        setErr("Vui lòng nhập tên hiển thị.");
        return;
      }
      if (!qrForm.urlAnhQr.trim()) {
        setErr("Vui lòng nhập URL ảnh QR hoặc upload file.");
        return;
      }
      const payload = {
        tenHienThi: qrForm.tenHienThi.trim(),
        urlAnhQr: qrForm.urlAnhQr.trim(),
        huongDan: qrForm.huongDan.trim(),
        thuTu: Number(qrForm.thuTu) || 0,
        hoatDong: qrForm.hoatDong
      };
      if (editingQrId) {
        await api.adminCapNhatQrThanhToan(editingQrId, payload);
        setSuccess("Đã cập nhật mã QR thanh toán.");
        setEditingQrId(null);
      } else {
        await api.adminTaoQrThanhToan(payload);
        setSuccess("Đã thêm mã QR thanh toán.");
      }
      setQrForm(initialQrForm());
      await loadQrThanhToan();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function xoaQrThanhToan(x) {
    if (!window.confirm(`Xóa cấu hình QR "${x.tenHienThi}"? Thao tác không hoàn tác.`)) return;
    try {
      setErr("");
      setSuccess("");
      await api.adminXoaQrThanhToan(x.qrThanhToanId);
      if (editingQrId === x.qrThanhToanId) huySuaQr();
      setSuccess("Đã xóa mã QR.");
      await loadQrThanhToan();
    } catch (e) {
      setErr(e.message);
    }
  }

  const titles = {
    "tong-quan": { h: "Tổng quan", sub: "Số liệu nhanh hệ thống rạp" },
    phim: { h: "Quản lý phim", sub: "Thêm phim và xem danh sách" },
    suat: { h: "Quản lý suất chiếu", sub: "Tạo lịch chiếu và theo dõi suất" },
    "phong-chieu": { h: "Quản lý phòng chiếu", sub: "Thêm phòng, sinh sơ đồ ghế" },
    "gia-ve": { h: "Quản lý giá vé", sub: "Cấu hình giá vé và hệ số loại ghế" },
    "giam-gia": { h: "Khuyến mãi & Thành viên", sub: "Quản lý mã giảm giá và hạng khách hàng" },
    "su-kien": { h: "Sự kiện & Tin tức", sub: "Thêm, xoá banner sự kiện trang chủ" },
    "nguoi-dung": { h: "Quản lý người dùng", sub: "Danh sách tài khoản và tạo nhân viên" },
    "thanh-toan": { h: "QR & thanh toán", sub: "Mã QR chuyển khoản / ví — hiển thị khi khách thanh toán online" },
    "ngan-hang": { h: "Tài khoản ngân hàng", sub: "Cấu hình ngân hàng nhận chuyển khoản của rạp" },
    "ho-tro": { h: "Hỗ trợ khách hàng", sub: "Kênh liên hệ đường dây nóng, fanpage" }
  };
  const head = titles[tab] || titles["tong-quan"];

  return (
    <div className="admin-page">
      <div className="admin-page-head">
        <div>
          <h1 className="admin-page-title">{head.h}</h1>
          <p className="admin-page-sub">{head.sub}</p>
        </div>
      </div>

      {err && <p className="admin-alert admin-alert-error">{err}</p>}
      {success && <p className="admin-alert admin-alert-success">{success}</p>}

      {tab === "tong-quan" && (
        <>
          <div className="admin-stat-grid">
            <article className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon--film">🎬</div>
              <div>
                <p className="admin-stat-label">Tổng phim</p>
                <p className="admin-stat-value">{phim.length}</p>
              </div>
            </article>
            <article className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon--ticket">🎫</div>
              <div>
                <p className="admin-stat-label">Tổng suất chiếu</p>
                <p className="admin-stat-value">{suats.length}</p>
              </div>
            </article>
            <article className="admin-stat-card">
              <div className="admin-stat-icon admin-stat-icon--today">📅</div>
              <div>
                <p className="admin-stat-label">Suất hôm nay</p>
                <p className="admin-stat-value">{suatsHomNay}</p>
              </div>
            </article>
          </div>

          <section className="admin-card">
            <h2 className="admin-card-title">Thao tác nhanh</h2>
            <p className="admin-card-hint">Dùng menu bên trái để thêm phim, xếp suất chiếu hoặc quản lý người dùng.</p>
          </section>
        </>
      )}

      {tab === "phim" && (
        <section className="admin-card">
          <h2 className="admin-card-title">{editingPhimId ? "Sửa phim" : "Tạo phim mới"}</h2>
          <p className="admin-card-hint admin-card-hint--tight">
            {editingPhimId
              ? "Đang chỉnh sửa phim đã chọn. Bấm Huỷ sửa để quay lại tạo mới."
              : (
                  <>
                    Trạng thái có thể <strong>tự chọn theo ngày khởi chiếu</strong> (bật ô bên dưới).
                  </>
                )}
          </p>

          <div className="admin-form-grid">
            <div className="admin-form-span-2">
              <label>Ảnh phim</label>
              <div className="admin-poster-file-row">
                <label className={`admin-file-btn ${posterUploading ? "is-disabled" : ""}`}>
                  <input type="file" accept="image/*" onChange={handlePosterFile} disabled={posterUploading} />
                  {posterUploading ? "…" : "Up file"}
                </label>
              </div>
              <input
                type="url"
                placeholder="URL poster (tuỳ chọn)"
                value={p.posterUrl}
                onChange={(e) => setP({ ...p, posterUrl: e.target.value })}
              />
              {(p.posterUrl.trim() || posterLocalUrl) && (
                <div className="admin-poster-preview">
                  <img
                    src={p.posterUrl.trim() || posterLocalUrl}
                    alt="Xem trước poster"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div className="admin-form-span-2">
              <label>Trailer</label>
              {editingPhimId != null && (
                <p className="admin-field-hint">Trailer chỉ gắn khi <strong>tạo phim mới</strong>; sửa phim không cập nhật trailer từ form này.</p>
              )}
              <div className="admin-poster-file-row">
                <label className={`admin-file-btn ${trailerUploading ? "is-disabled" : ""}`}>
                  <input
                    type="file"
                    accept="video/*,.mp4,.webm,.mov,.mkv"
                    onChange={handleTrailerFile}
                    disabled={trailerUploading}
                  />
                  {trailerUploading ? "…" : "Up file"}
                </label>
              </div>
              <input
                type="url"
                placeholder="URL trailer (YouTube / mp4 — tuỳ chọn)"
                value={p.trailerUrl}
                onChange={(e) => setP({ ...p, trailerUrl: e.target.value })}
              />
            </div>
            <div>
              <label>Tên phim</label>
              <input placeholder="Tên phim" value={p.tenPhim} onChange={(e) => setP({ ...p, tenPhim: e.target.value })} />
            </div>
            <div>
              <label>Thể loại</label>
              <input placeholder="Ví dụ: Tâm lý, tình cảm" value={p.theLoai} onChange={(e) => setP({ ...p, theLoai: e.target.value })} />
            </div>
            <div>
              <label>Đạo diễn</label>
              <input placeholder="Họ tên đạo diễn" value={p.daoDien} onChange={(e) => setP({ ...p, daoDien: e.target.value })} />
            </div>
            <div>
              <label>Diễn viên</label>
              <input placeholder="Cách nhau bởi dấu phẩy" value={p.dienVien} onChange={(e) => setP({ ...p, dienVien: e.target.value })} />
            </div>
            <div>
              <label>Thời lượng (phút)</label>
              <input
                type="number"
                min={1}
                placeholder="120"
                value={p.thoiLuongPhut}
                onChange={(e) => setP({ ...p, thoiLuongPhut: e.target.value })}
              />
            </div>
            <div>
              <label>Giới hạn tuổi</label>
              <select value={p.gioiHanTuoi} onChange={(e) => setP({ ...p, gioiHanTuoi: e.target.value })}>
                <option value="P">P — Mọi lứa tuổi</option>
                <option value="T13">T13</option>
                <option value="T16">T16</option>
                <option value="T18">T18</option>
                <option value="K">K — Hạn chế</option>
              </select>
            </div>
            <div>
              <label>Ngày khởi chiếu</label>
              <input
                type="date"
                value={p.ngayKhoiChieu}
                onChange={(e) => setP({ ...p, ngayKhoiChieu: e.target.value })}
              />
            </div>
            <div>
              <label>Ngôn ngữ</label>
              <input placeholder="Tiếng Việt, phụ đề Anh..." value={p.ngonNgu} onChange={(e) => setP({ ...p, ngonNgu: e.target.value })} />
            </div>
            <div>
              <label>Quốc gia</label>
              <input placeholder="Việt Nam, Mỹ, Nhật Bản..." value={p.quocGia} onChange={(e) => setP({ ...p, quocGia: e.target.value })} />
            </div>
            <div className="admin-form-span-2">
              <label>Mô tả / Nội dung phim</label>
              <textarea
                rows={4}
                placeholder="Nội dung tóm tắt của phim..."
                value={p.moTa}
                onChange={(e) => setP({ ...p, moTa: e.target.value })}
              />
            </div>
            <div className="admin-form-span-2 admin-form-status-row">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={p.trangThaiTuDong}
                  onChange={(e) => setP({ ...p, trangThaiTuDong: e.target.checked })}
                />
                Tự động trạng thái theo ngày khởi chiếu (sau hôm nay = sắp chiếu; đã đến hoặc qua = đang chiếu)
              </label>
              <div>
                <label>Trạng thái</label>
                <select
                  value={p.trangThai}
                  disabled={p.trangThaiTuDong}
                  onChange={(e) => setP({ ...p, trangThai: e.target.value })}
                >
                  <option value="SAP_CHIEU">Sắp chiếu (SAP_CHIEU)</option>
                  <option value="DANG_CHIEU">Đang chiếu (DANG_CHIEU)</option>
                </select>
                {p.trangThaiTuDong && (
                  <p className="admin-field-hint">Đang dùng: <strong>{p.trangThai}</strong> — đổi bằng cách tắt ô phía trên.</p>
                )}
              </div>
            </div>
            <div className="admin-form-actions admin-form-span-2">
              {editingPhimId != null && (
                <button type="button" className="admin-btn-ghost" onClick={huySuaPhim}>
                  Huỷ sửa
                </button>
              )}
              <button type="button" className="admin-btn-primary" onClick={luuPhim}>
                {editingPhimId != null ? "Cập nhật phim" : "Thêm phim"}
              </button>
            </div>
          </div>

          <div className="admin-divider" />
          <h2 className="admin-card-title">Danh sách phim</h2>
          <p className="admin-card-hint admin-card-hint--tight">Poster, thông tin chính và thao tác sửa / xóa.</p>
          <div className="admin-table-wrap admin-table-wrap--mt">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên phim</th>
                  <th>Thể loại</th>
                  <th>Đạo diễn</th>
                  <th>Phút</th>
                  <th>Tuổi</th>
                  <th>Khởi chiếu</th>
                  <th>Ngôn ngữ</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {phim.length ? (
                  phim.map((x) => (
                    <tr key={x.phimId}>
                      <td>
                        {x.posterUrl ? (
                          <img className="admin-movie-thumb" src={x.posterUrl} alt="" loading="lazy" />
                        ) : (
                          <div
                            className="admin-movie-thumb admin-movie-thumb--empty"
                            title="Chưa có poster"
                            aria-hidden
                          >
                            🎬
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{x.tenPhim}</strong>
                        {x.dienVien ? (
                          <div className="admin-cell-muted" title={x.dienVien}>
                            {String(x.dienVien).length > 80 ? `${String(x.dienVien).slice(0, 80)}…` : x.dienVien}
                          </div>
                        ) : null}
                      </td>
                      <td>{x.theLoai || "—"}</td>
                      <td>{x.daoDien || "—"}</td>
                      <td>{x.thoiLuongPhut != null ? x.thoiLuongPhut : "—"}</td>
                      <td>{x.gioiHanTuoi || "—"}</td>
                      <td>{formatNgayVN(x.ngayKhoiChieu)}</td>
                      <td>{x.ngonNgu || "—"}</td>
                      <td>
                        <span className="admin-badge">{labelTrangThai(x.trangThai)}</span>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button type="button" className="admin-btn-edit" onClick={() => batDauSuaPhim(x)}>
                            Sửa
                          </button>
                          <button type="button" className="admin-btn-danger" onClick={() => xoaPhimClick(x)}>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={10} className="admin-empty">
                      Chưa có phim nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "phong-chieu" && <AdminPhongChieu />}
      
      {tab === "gia-ve" && <AdminGiaVe />}
      
      {tab === "giam-gia" && <AdminGiamGia />}

      {tab === "su-kien" && <AdminSuKien />}

      {tab === "ngan-hang" && <AdminNganHang />}

      {tab === "ho-tro" && <AdminHoTro />}

      {tab === "bao-cao" && <AdminBaoCao />}

      {tab === "nguoi-dung" && (
        <section className="admin-card">
          <h2 className="admin-card-title">Tạo tài khoản nhân viên</h2>
          <p className="admin-card-hint admin-card-hint--tight">
            Tài khoản mới chỉ có vai trò <strong>NHAN_VIEN</strong> (đăng nhập khu vực nhân viên / check-in). Không tạo admin từ đây.
          </p>
          <div className="admin-form-grid">
            <div>
              <label>Họ và tên</label>
              <input
                placeholder="Họ tên nhân viên"
                value={nv.hoTen}
                onChange={(e) => setNv({ ...nv, hoTen: e.target.value })}
              />
            </div>
            <div>
              <label>Email</label>
              <input
                type="email"
                placeholder="email@rap.vn"
                value={nv.email}
                onChange={(e) => setNv({ ...nv, email: e.target.value })}
              />
            </div>
            <div>
              <label>Số điện thoại</label>
              <input
                placeholder="09xxxxxxxx"
                value={nv.soDienThoai}
                onChange={(e) => setNv({ ...nv, soDienThoai: e.target.value })}
              />
            </div>
            <div>
              <label>Mật khẩu ban đầu</label>
              <input
                type="password"
                placeholder="Mật khẩu"
                value={nv.matKhau}
                onChange={(e) => setNv({ ...nv, matKhau: e.target.value })}
              />
            </div>
            <div>
              <label>Xác nhận mật khẩu</label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={nv.xacNhanMatKhau}
                onChange={(e) => setNv({ ...nv, xacNhanMatKhau: e.target.value })}
              />
            </div>
            <div className="admin-form-actions">
              <button type="button" className="admin-btn-primary" onClick={taoTaiKhoanNhanVien}>
                Tạo tài khoản nhân viên
              </button>
            </div>
          </div>

          <div className="admin-divider" />
          <h2 className="admin-card-title">Danh sách người dùng</h2>
          <p className="admin-card-hint admin-card-hint--tight">Trạng thái <strong>Khóa</strong> ngăn đăng nhập. Không thể khóa chính bạn hoặc admin hoạt động cuối cùng.</p>
          <div className="admin-table-wrap admin-table-wrap--mt">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Họ tên</th>
                  <th>Email</th>
                  <th>SĐT</th>
                  <th>Vai trò</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {taiKhoanList.length ? (
                  taiKhoanList.map((x) => {
                    const laBanThan = user?.taiKhoanId != null && Number(user.taiKhoanId) === Number(x.taiKhoanId);
                    const roles = Array.isArray(x.vaiTro) ? x.vaiTro : [];
                    return (
                      <tr key={x.taiKhoanId}>
                        <td>{x.taiKhoanId}</td>
                        <td>
                          <strong>{x.hoTen}</strong>
                          {laBanThan ? <span className="admin-cell-muted"> (bạn)</span> : null}
                        </td>
                        <td>{x.email || "—"}</td>
                        <td>{x.soDienThoai || "—"}</td>
                        <td>
                          {roles.length ? (
                            <span className="admin-badge-row">
                              {roles.map((r) => (
                                <span key={r} className="admin-badge">
                                  {r}
                                </span>
                              ))}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td>
                          <span className="admin-badge">
                            {x.trangThai === "KHOA" ? "Khóa" : x.trangThai === "HOAT_DONG" ? "Hoạt động" : x.trangThai}
                          </span>
                        </td>
                        <td>
                          <div className="admin-table-actions">
                            {x.trangThai === "HOAT_DONG" ? (
                              <button
                                type="button"
                                className="admin-btn-danger"
                                disabled={laBanThan}
                                title={laBanThan ? "Không thể khóa chính mình" : undefined}
                                onClick={() => doiTrangThaiTk(x, "KHOA")}
                              >
                                Khóa
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="admin-btn-edit"
                                onClick={() => doiTrangThaiTk(x, "HOAT_DONG")}
                              >
                                Mở khóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="admin-empty">
                      Chưa có dữ liệu hoặc không tải được danh sách.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "suat" && (
        <section className="admin-card">
          <div id="admin-suat-form">
            <h2 className="admin-card-title">{editingSuatId ? "Sửa suất chiếu" : "Tạo suất chiếu"}</h2>
            {editingSuatId != null && (
              <p className="admin-card-hint admin-card-hint--tight">
                Đang chỉnh sửa suất đã chọn. Bấm Huỷ sửa để quay lại tạo mới.
              </p>
            )}
          </div>

          <div className="admin-form-grid">
            <div>
              <label>Phim</label>
              <select value={s.phimId} onChange={(e) => setS({ ...s, phimId: Number(e.target.value) })}>
                <option value={0}>Chọn phim</option>
                {phim.map((x) => (
                  <option key={x.phimId} value={x.phimId}>
                    {x.tenPhim}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>Phòng chiếu ID</label>
              <input
                placeholder="Ví dụ: 1"
                type="number"
                value={s.phongChieuId}
                onChange={(e) => setS({ ...s, phongChieuId: Number(e.target.value) })}
              />
            </div>
            <div className="admin-form-span-2 admin-suat-poster-preview-row">
              <span className="admin-suat-poster-label">Ảnh phim</span>
              {posterPhimFormSuat ? (
                <img className="admin-movie-thumb" src={posterPhimFormSuat} alt="" loading="lazy" />
              ) : (
                <div className="admin-movie-thumb admin-movie-thumb--empty" title={s.phimId ? "Chưa có poster" : "Chọn phim để xem ảnh"}>
                  🎬
                </div>
              )}
              <p className="admin-suat-poster-hint">
                Poster lấy từ danh sách phim. Đổi ảnh tại mục <strong>Quản lý phim</strong>.
              </p>
            </div>
            <div>
              <label>Thời gian bắt đầu (Ngày và Giờ)</label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="date" style={{ flex: 1 }} value={s.thoiGianBatDau ? s.thoiGianBatDau.split("T")[0] : ""} onChange={(e) => {
                  const d = e.target.value;
                  const t = (s.thoiGianBatDau && s.thoiGianBatDau.includes("T")) ? s.thoiGianBatDau.split("T")[1] : "00:00";
                  const batDau = d ? `${d}T${t}` : "";
                  setS(prev => {
                    const selectedPhimObj = phim.find(p => Number(p.phimId) === Number(prev.phimId));
                    if (batDau && selectedPhimObj?.thoiLuongPhut) {
                      const dt = new Date(batDau);
                      const k = new Date(dt.getTime() + (selectedPhimObj.thoiLuongPhut + 15) * 60000);
                      const pad = n => String(n).padStart(2, "0");
                      const ketThuc = `${k.getFullYear()}-${pad(k.getMonth()+1)}-${pad(k.getDate())}T${pad(k.getHours())}:${pad(k.getMinutes())}`;
                      return { ...prev, thoiGianBatDau: batDau, thoiGianKetThuc: ketThuc };
                    }
                    return { ...prev, thoiGianBatDau: batDau };
                  });
                }} />
                <input type="time" style={{ width: "120px" }} value={s.thoiGianBatDau ? s.thoiGianBatDau.split("T")[1] : ""} onChange={(e) => {
                  const d = (s.thoiGianBatDau && s.thoiGianBatDau.includes("T")) ? s.thoiGianBatDau.split("T")[0] : new Date().toISOString().split("T")[0];
                  const t = e.target.value || "00:00";
                  const batDau = `${d}T${t}`;
                  setS(prev => {
                    const selectedPhimObj = phim.find(p => Number(p.phimId) === Number(prev.phimId));
                    if (batDau && selectedPhimObj?.thoiLuongPhut) {
                      const dt = new Date(batDau);
                      const k = new Date(dt.getTime() + (selectedPhimObj.thoiLuongPhut + 15) * 60000);
                      const pad = n => String(n).padStart(2, "0");
                      const ketThuc = `${k.getFullYear()}-${pad(k.getMonth()+1)}-${pad(k.getDate())}T${pad(k.getHours())}:${pad(k.getMinutes())}`;
                      return { ...prev, thoiGianBatDau: batDau, thoiGianKetThuc: ketThuc };
                    }
                    return { ...prev, thoiGianBatDau: batDau };
                  });
                }} />
              </div>
            </div>
            <div>
              <label>Thời gian kết thúc <small style={{color:"#64748b"}}>(tự tính từ thời lượng phim + 15 phút dọn)</small></label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="date" style={{ flex: 1 }} value={s.thoiGianKetThuc ? s.thoiGianKetThuc.split("T")[0] : ""} onChange={(e) => {
                  const d = e.target.value;
                  const t = (s.thoiGianKetThuc && s.thoiGianKetThuc.includes("T")) ? s.thoiGianKetThuc.split("T")[1] : "00:00";
                  setS({ ...s, thoiGianKetThuc: d ? `${d}T${t}` : "" });
                }} />
                <input type="time" style={{ width: "120px" }} value={s.thoiGianKetThuc ? s.thoiGianKetThuc.split("T")[1] : ""} onChange={(e) => {
                  const d = (s.thoiGianKetThuc && s.thoiGianKetThuc.includes("T")) ? s.thoiGianKetThuc.split("T")[0] : new Date().toISOString().split("T")[0];
                  const t = e.target.value || "00:00";
                  setS({ ...s, thoiGianKetThuc: `${d}T${t}` });
                }} />
              </div>
            </div>
            <div>
              <label>Trạng thái</label>
              <select value={s.trangThai} onChange={(e) => setS({ ...s, trangThai: e.target.value })}>
                <option value="DANG_MO_BAN">Đang mở bán</option>
                <option value="DONG_BAN">Đóng bán</option>
                <option value="HUY">Huỷ</option>
                <option value="DA_KET_THUC">Đã kết thúc</option>
              </select>
            </div>
            <div className="admin-form-actions">
              {editingSuatId != null && (
                <button type="button" className="admin-btn-ghost" onClick={huySuaSuat}>
                  Huỷ sửa
                </button>
              )}
              <button type="button" className="admin-btn-primary" onClick={luuSuatChieu}>
                {editingSuatId != null ? "Cập nhật suất" : "Thêm suất chiếu"}
              </button>
            </div>
          </div>

          <div className="admin-divider" />

          <div className="admin-suat-list-head">
            <h2 className="admin-card-title">Danh sách suất chiếu</h2>
            <button type="button" className="admin-btn-primary" onClick={moThemSuatMoi}>
              Thêm mới
            </button>
          </div>
          <div className="admin-filter-row">
            <div>
              <label>Lọc theo phim</label>
              <select value={selectedPhimId} onChange={(e) => setSelectedPhimId(Number(e.target.value))}>
                <option value={0}>Tất cả phim</option>
                {phim.map((x) => (
                  <option key={x.phimId} value={x.phimId}>
                    {x.tenPhim}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Phim</th>
                  <th>Phòng</th>
                  <th>Bắt đầu</th>
                  <th>Kết thúc</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {suatsForTable.length ? (
                  suatsForTable.map((x) => {
                    const posterHang = posterTheoPhimId.get(Number(x.phimId));
                    return (
                    <tr key={x.suatChieuId}>
                      <td>
                        {posterHang ? (
                          <img className="admin-movie-thumb" src={posterHang} alt="" loading="lazy" />
                        ) : (
                          <div className="admin-movie-thumb admin-movie-thumb--empty" title="Chưa có poster">
                            🎬
                          </div>
                        )}
                      </td>
                      <td>{x.tenPhim || `Phim #${x.phimId}`}</td>
                      <td>{x.phongChieuId ?? "-"}</td>
                      <td>{formatDateTime(x.thoiGianBatDau)}</td>
                      <td>{formatDateTime(x.thoiGianKetThuc)}</td>
                      <td>
                        <span className="admin-badge">{labelTrangThaiSuat(x.trangThai)}</span>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button type="button" className="admin-btn-edit" onClick={() => batDauSuaSuat(x)}>
                            Sửa
                          </button>
                          <button type="button" className="admin-btn-danger" onClick={() => xoaSuatHang(x)}>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="admin-empty">
                      Chưa có suất chiếu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === "thanh-toan" && (
        <section className="admin-card">
          <h2 className="admin-card-title">{editingQrId ? "Sửa mã QR thanh toán" : "Thêm mã QR thanh toán"}</h2>
          <p className="admin-card-hint admin-card-hint--tight">
            Khách chọn chuyển khoản hoặc ví điện tử sẽ thấy các mã QR đang bật. Chạy script{" "}
            <code className="admin-code-inline">sql_qr_thanh_toan.sql</code> trên SQL Server nếu chưa có bảng.
          </p>

          <div className="admin-form-grid">
            <div>
              <label>Tên hiển thị</label>
              <input
                placeholder="Ví dụ: VietQR — MB Bank"
                value={qrForm.tenHienThi}
                onChange={(e) => setQrForm({ ...qrForm, tenHienThi: e.target.value })}
              />
            </div>
            <div>
              <label>Thứ tự hiển thị</label>
              <input
                type="number"
                min={0}
                value={qrForm.thuTu}
                onChange={(e) => setQrForm({ ...qrForm, thuTu: e.target.value })}
              />
            </div>
            <div className="admin-form-span-2">
              <label>URL ảnh QR</label>
              <div className="admin-poster-file-row">
                <label className={`admin-file-btn ${qrUploading ? "is-disabled" : ""}`}>
                  <input type="file" accept="image/*" onChange={handleQrFile} disabled={qrUploading} />
                  {qrUploading ? "…" : "Upload ảnh QR"}
                </label>
              </div>
              <input
                type="url"
                placeholder="Hoặc dán URL ảnh QR công khai"
                value={qrForm.urlAnhQr}
                onChange={(e) => setQrForm({ ...qrForm, urlAnhQr: e.target.value })}
              />
              {qrForm.urlAnhQr.trim() && (
                <div className="admin-poster-preview admin-qr-preview">
                  <img src={qrForm.urlAnhQr.trim()} alt="Xem trước QR" />
                </div>
              )}
            </div>
            <div className="admin-form-span-2">
              <label>Hướng dẫn (STK, nội dung CK…)</label>
              <textarea
                rows={3}
                placeholder="Ví dụ: STK 0123… — Nội dung: Mã đơn + họ tên"
                value={qrForm.huongDan}
                onChange={(e) => setQrForm({ ...qrForm, huongDan: e.target.value })}
              />
            </div>
            <div className="admin-form-span-2">
              <label className="admin-checkbox">
                <input
                  type="checkbox"
                  checked={qrForm.hoatDong}
                  onChange={(e) => setQrForm({ ...qrForm, hoatDong: e.target.checked })}
                />
                Hiển thị cho khách hàng
              </label>
            </div>
            <div className="admin-form-actions admin-form-span-2">
              {editingQrId != null && (
                <button type="button" className="admin-btn-ghost" onClick={huySuaQr}>
                  Huỷ sửa
                </button>
              )}
              <button type="button" className="admin-btn-primary" onClick={luuQrThanhToan}>
                {editingQrId != null ? "Cập nhật" : "Thêm mã QR"}
              </button>
            </div>
          </div>

          <div className="admin-divider" />

          <h2 className="admin-card-title">Danh sách mã QR</h2>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên</th>
                  <th>Thứ tự</th>
                  <th>Hiển thị</th>
                  <th>Hướng dẫn</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {qrList.length ? (
                  qrList.map((x) => (
                    <tr key={x.qrThanhToanId}>
                      <td>
                        {x.urlAnhQr ? (
                          <img className="admin-movie-thumb" src={x.urlAnhQr} alt="" loading="lazy" />
                        ) : (
                          <div className="admin-movie-thumb admin-movie-thumb--empty">📱</div>
                        )}
                      </td>
                      <td>{x.tenHienThi}</td>
                      <td>{x.thuTu}</td>
                      <td>
                        <span className="admin-badge">{x.hoatDong ? "Bật" : "Tắt"}</span>
                      </td>
                      <td className="admin-cell-muted-wrap">{x.huongDan || "—"}</td>
                      <td>
                        <div className="admin-table-actions">
                          <button type="button" className="admin-btn-edit" onClick={() => batDauSuaQr(x)}>
                            Sửa
                          </button>
                          <button type="button" className="admin-btn-danger" onClick={() => xoaQrThanhToan(x)}>
                            Xóa
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="admin-empty">
                      Chưa có mã QR. Thêm ở form trên hoặc kiểm tra đã tạo bảng cơ sở dữ liệu.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
