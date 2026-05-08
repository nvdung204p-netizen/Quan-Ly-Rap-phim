const { taoDon } = require('./src/controllers/datVeController');

const mockReq = {
  body: {
    suatChieuId: 1, // Assume some suat chieu id
    danhSachGheId: [1], // Assume some ghe id
    loaiVeId: 1,
    kenhDat: "QUAY"
  },
  user: {
    taiKhoanId: 1
  }
};

const mockRes = {
  status: (s) => ({
    json: (d) => { console.log("Status:", s, "JSON:", d); return d; }
  })
};

taoDon(mockReq, mockRes).catch(console.error);
