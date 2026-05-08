const path = require("path");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");

const { CORS_ORIGINS } = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");
const { apiFail } = require("./utils/apiResponse");

const openapiSpec = require("../openapi.json");

const authRoutes = require("./routes/auth.routes");
const taiKhoanRoutes = require("./routes/taiKhoan.routes");
const uploadRoutes = require("./routes/upload.routes");
const adminRoutes = require("./routes/admin.routes");
const phimRoutes = require("./routes/phim.routes");
const suatChieuRoutes = require("./routes/suatChieu.routes");
const giaVeRoutes = require("./routes/giaVe.routes");
const datVeRoutes = require("./routes/datVe.routes");
const suKienRoutes = require("./routes/suKien.routes");
const vanHanhRoutes = require("./routes/vanHanh.routes");
const vanHanhNangCaoRoutes = require("./routes/vanHanhNangCao.routes");
const healthRoutes = require("./routes/health.routes");
const phongChieuRoutes = require("./routes/phongChieu.routes");
const thanhVienRoutes = require("./routes/thanhVien.routes");

function createApp() {
  const app = express();
  app.set("trust proxy", true);

  app.use(
    cors({
      origin: CORS_ORIGINS.length === 1 ? CORS_ORIGINS[0] : CORS_ORIGINS,
      credentials: false,
      allowedHeaders: ["Authorization", "Content-Type"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    })
  );

  app.use(express.json({ limit: "50mb" }));

  const wwwrootUploadsRoot = path.join(process.cwd(), "wwwroot", "uploads");
  app.use("/uploads", express.static(wwwrootUploadsRoot));

  app.use("/api/Auth", authRoutes);
  app.use("/api/TaiKhoan", taiKhoanRoutes);
  app.use("/api/Upload", uploadRoutes);
  app.use("/api/Admin", adminRoutes);
  app.use("/api/Phim", phimRoutes);
  app.use("/api/SuatChieu", suatChieuRoutes);
  app.use("/api/GiaVe", giaVeRoutes);
  app.use("/api/DatVe", datVeRoutes);
  app.use("/api/SuKien", suKienRoutes);
  app.use("/api/VanHanh", vanHanhRoutes);
  app.use("/api/KinhDoanh", vanHanhNangCaoRoutes);
  app.use("/api/health", healthRoutes);
  app.use("/api/PhongChieu", phongChieuRoutes);
  app.use("/api/ThanhVien", thanhVienRoutes);

  app.get("/openapi.json", (_req, res) => res.json(openapiSpec));
  app.use(
    "/swagger",
    swaggerUi.serve,
    swaggerUi.setup(openapiSpec, {
      customSiteTitle: "QuanLyRapChieuPhim API",
      swaggerOptions: { persistAuthorization: true }
    })
  );

  app.use("/api", (req, res) => {
    apiFail(res, 501, "Chua chuyen xong endpoint trong Node.js: " + req.originalUrl);
  });

  app.get("/", (_req, res) => res.redirect(302, "/swagger/"));

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
