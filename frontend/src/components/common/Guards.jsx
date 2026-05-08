import { Navigate, useLocation } from "react-router-dom";

export function RequireAuth({ user, children }) {
  const location = useLocation();
  if (!user) {
    const returnUrl = encodeURIComponent(`${location.pathname}${location.search || ""}`);
    return <Navigate to={`/auth?returnUrl=${returnUrl}`} replace />;
  }
  return children;
}

export function RequireRoles({ user, roles, children }) {
  if (!user) return <Navigate to="/auth" replace />;
  const ok = user.vaiTro?.some((x) => roles.includes(x));
  if (!ok) return <p className="error">Ban khong co quyen truy cap.</p>;
  return children;
}
