export default function ProfilePage({ user }) {
  return (
    <section>
      <h2>Trang cá nhân</h2>
      <p>Họ tên: {user?.hoTen}</p>
      <p>Tài khoản id: {user?.taiKhoanId}</p>
      <p>Vai trò: {user?.vaiTro?.length ? user.vaiTro.join(", ") : "—"}</p>
    </section>
  );
}
