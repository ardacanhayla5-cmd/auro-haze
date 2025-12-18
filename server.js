const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ==========================
// ADMIN ŞİFRE (şimdilik sabit)
// ==========================
const ADMIN_PASSWORD = "3186arda";

// ==========================
// DOSYALAR
// ==========================
const ORDERS_FILE = path.join(__dirname, "orders.json");
const PRODUCTS_FILE = path.join(__dirname, "products.json");

if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]", "utf-8");
if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, "[]", "utf-8");

// ==========================
// ADMIN AUTH
// ==========================
function adminAuth(req, res, next) {
  const pass = req.headers["x-admin-password"];
  if (pass !== ADMIN_PASSWORD) return res.status(401).json({ error: "Yetkisiz" });
  next();
}

// ==========================
// PUBLIC - ÜRÜNLER
// ==========================
app.get("/api/products", (req, res) => {
  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
  res.json(products);
});

// ==========================
// ADMIN LOGIN (basit kontrol)
// ==========================
app.post("/api/admin/login", (req, res) => {
  const { password } = req.body || {};
  if (password === ADMIN_PASSWORD) return res.json({ success: true });
  return res.status(401).json({ success: false });
});

// ==========================
// ADMIN - ÜRÜN EKLE
// ==========================
app.post("/api/admin/products", adminAuth, (req, res) => {
  const { name, price, img } = req.body || {};
  if (!name || !price || !img) return res.status(400).json({ error: "Eksik alan" });

  const products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
  products.push({
    id: Date.now(),
    name: String(name),
    price: Number(price),
    img: String(img),
  });

  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
  res.json({ success: true });
});

// ==========================
// ADMIN - ÜRÜN SİL
// ==========================
app.delete("/api/admin/products/:id", adminAuth, (req, res) => {
  const id = Number(req.params.id);
  let products = JSON.parse(fs.readFileSync(PRODUCTS_FILE, "utf-8"));
  products = products.filter((p) => p.id !== id);

  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), "utf-8");
  res.json({ success: true });
});

// ==========================
// SİPARİŞ OLUŞTUR
// ==========================
app.post("/api/create-order", (req, res) => {
  const { customer, cart, total } = req.body || {};
  if (!customer || !cart || typeof total !== "number") {
    return res.status(400).json({ success: false, error: "Geçersiz sipariş" });
  }

  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
  orders.push({
    id: Date.now(),
    date: new Date(),
    customer,
    cart,
    total,
    status: "WAITING_PAYMENT",
  });

  fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
  res.json({ success: true, redirectUrl: "/payment.html" });
});

// ==========================
// ADMIN - SİPARİŞLER (korumalı)
// ==========================
app.get("/api/admin/orders", adminAuth, (req, res) => {
  const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, "utf-8"));
  res.json(orders.reverse());
});

app.listen(PORT, () => {
  console.log(`Server çalışıyor → http://localhost:${PORT}`);
});
