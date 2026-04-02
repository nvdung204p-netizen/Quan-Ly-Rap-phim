import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";

export default function AuthPage({ setToken }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultMode = searchParams.get("mode") === "register" ? "register" : "login";
  const [mode, setMode] = useState(defaultMode);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dn, setDn] = useState({ emailOrSoDienThoai: "", matKhau: "" });
  const [dk, setDk] = useState({
    email: "",
    soDienThoai: "",
    ho: "",
    ten: "",
    matKhau: "",
    xacNhanMatKhau: ""
  });
  const [forgot, setForgot] = useState({
    email: "",
    soDienThoai: "",
    otp: "",
    matKhauMoi: "",
    xacNhanMatKhauMoi: ""
  });

  async function onDangNhap() {
    try {
      setError("");
      setSuccess("");
      const data = await api.dangNhap(dn);
      localStorage.setItem("accessToken", data.accessToken);
      setToken(data.accessToken);
      navigate("/phim");
    } catch (e) {
      setError(e.message);
    }
  }

  async function onDangKy() {
    try {
      setError("");
      setSuccess("");
      if (dk.matKhau !== dk.xacNhanMatKhau) {
        setError("Xac nhan mat khau khong khop.");
        return;
      }

      const data = await api.dangKy({
        email: dk.email,
        soDienThoai: dk.soDienThoai,
        hoTen: `${dk.ho} ${dk.ten}`.trim(),
        matKhau: dk.matKhau
      });
      localStorage.setItem("accessToken", data.accessToken);
      setToken(data.accessToken);
      navigate("/phim");
    } catch (e) {
      setError(e.message);
    }
  }

  async function onGuiOtp() {
    try {
      setError("");
      setSuccess("");
      const data = await api.guiOtpQuenMatKhau({
        email: forgot.email || null,
        soDienThoai: forgot.soDienThoai || null
      });
      setSuccess(`Da gui OTP. OTP test: ${data.otp}`);
    } catch (e) {
      setError(e.message);
    }
  }

  async function onDatLaiMatKhau() {
    try {
      setError("");
      setSuccess("");
      if (forgot.matKhauMoi !== forgot.xacNhanMatKhauMoi) {
        setError("Xac nhan mat khau moi khong khop.");
        return;
      }
      await api.datLaiMatKhau({
        email: forgot.email || null,
        soDienThoai: forgot.soDienThoai || null,
        otp: forgot.otp,
        matKhauMoi: forgot.matKhauMoi
      });
      setSuccess("Dat lai mat khau thanh cong. Moi ban dang nhap lai.");
      setMode("login");
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-overlay" />
      <div className="auth-modal">
        <button className="auth-close" onClick={() => navigate("/phim")}>x</button>
        <h2>{mode === "login" ? "Đăng nhập" : mode === "register" ? "Đăng ký" : "Quên mật khẩu"}</h2>
        {error && <p className="error">{error}</p>}
        {success && <p className="success">{success}</p>}

        {mode === "login" ? (
          <>
            <label>Email hoặc số điện thoại</label>
            <input placeholder="Email" onChange={(e) => setDn({ ...dn, emailOrSoDienThoai: e.target.value })} />
            <label>Mật khẩu</label>
            <input type="password" placeholder="Mật khẩu" onChange={(e) => setDn({ ...dn, matKhau: e.target.value })} />
            <p className="auth-link-right">
              <button className="text-button" onClick={() => { setError(""); setSuccess(""); setMode("forgot"); }}>
                Quên mật khẩu?
              </button>
            </p>
            <button className="auth-submit" onClick={onDangNhap}>Đăng nhập</button>
            <p className="auth-switch">
              Bạn chưa có tài khoản?{" "}
              <button className="text-button" onClick={() => { setError(""); setMode("register"); }}>
                Đăng ký
              </button>
            </p>
          </>
        ) : mode === "register" ? (
          <>
            <div className="auth-row">
              <div>
                <label>Họ</label>
                <input placeholder="Họ" onChange={(e) => setDk({ ...dk, ho: e.target.value })} />
              </div>
              <div>
                <label>Tên</label>
                <input placeholder="Tên" onChange={(e) => setDk({ ...dk, ten: e.target.value })} />
              </div>
            </div>
            <label>Email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="vidu@email.com"
              onChange={(e) => setDk({ ...dk, email: e.target.value })}
            />
            <label>Số điện thoại</label>
            <input placeholder="Số điện thoại" onChange={(e) => setDk({ ...dk, soDienThoai: e.target.value })} />
            <div className="auth-row">
              <div>
                <label>Mật khẩu</label>
                <input type="password" placeholder="Mật khẩu" onChange={(e) => setDk({ ...dk, matKhau: e.target.value })} />
              </div>
              <div>
                <label>Xác nhận mật khẩu</label>
                <input type="password" placeholder="Xác nhận mật khẩu" onChange={(e) => setDk({ ...dk, xacNhanMatKhau: e.target.value })} />
              </div>
            </div>
            <button className="auth-submit" onClick={onDangKy}>
              Đăng ký
            </button>
            <p className="auth-switch">
              Bạn đã có tài khoản?{" "}
              <button className="text-button" onClick={() => { setError(""); setMode("login"); }}>
                Đăng nhập
              </button>
            </p>
          </>
        ) : (
          <>
            <label>Email</label>
            <input placeholder="Email" onChange={(e) => setForgot({ ...forgot, email: e.target.value })} />
            <label>Số điện thoại</label>
            <input placeholder="Số điện thoại" onChange={(e) => setForgot({ ...forgot, soDienThoai: e.target.value })} />
            <button className="auth-submit" onClick={onGuiOtp}>Gửi OTP</button>

            <label>OTP</label>
            <input placeholder="Nhập OTP" onChange={(e) => setForgot({ ...forgot, otp: e.target.value })} />
            <label>Mật khẩu mới</label>
            <input type="password" placeholder="Mật khẩu mới" onChange={(e) => setForgot({ ...forgot, matKhauMoi: e.target.value })} />
            <label>Xác nhận mật khẩu mới</label>
            <input type="password" placeholder="Xác nhận mật khẩu mới" onChange={(e) => setForgot({ ...forgot, xacNhanMatKhauMoi: e.target.value })} />
            <button className="auth-submit" onClick={onDatLaiMatKhau}>Đặt lại mật khẩu</button>

            <p className="auth-switch">
              Quay lại{" "}
              <button className="text-button" onClick={() => { setError(""); setSuccess(""); setMode("login"); }}>
                Đăng nhập
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
