# Frontend ReactJS

## Chay du an

```bash
cd frontend
npm install
npm run dev
```

Frontend chay mac dinh: `http://localhost:5173`  
Backend API: `http://localhost:5000`

## Chuc nang co san

- Router theo trang: Phim, Lich chieu, Dat ve, Su kien, Khuyen mai, Gia ve
- Dang ky / Dang nhap + luu JWT token
- Role guard cho trang Admin va Nhan vien checkin
- Dat ve online: chon ghe -> tao don -> thanh toan -> nhan QR
- Admin demo: tao phim, tao suat chieu
- Nhan vien demo: checkin ve bang ma QR

## Cau truc thu muc

- `public/`: file tinh (favicon, ...)
- `src/assets/styles`: CSS toan cuc
- `src/assets/images`: anh/icon du an
- `src/components/common`: component dung lai (vi du `Guards`)
- `src/components/Form`, `src/components/Table`: form/bang (moc rong)
- `src/layouts`: layout chung (`MainLayout` trang public) va `AdminLayout` (dashboard admin, khong dung header/footer rap)
- `src/pages`: tung man hinh
- `src/routes/AppRoutes.jsx`: dinh nghia route
- `src/services/api.js`: goi backend API
- `src/config.js`: cau hinh (URL API: `VITE_API_URL` hoac mac dinh `http://localhost:5000`)
- `src/hooks`, `src/utils`: hook / tien ich dung chung

Doi URL backend: tao `.env` voi `VITE_API_URL=http://...` hoac sua `src/config.js`.
