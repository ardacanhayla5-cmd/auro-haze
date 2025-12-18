console.log("__dirname:", __dirname);

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

// ================== CONFIG ==================
const PORT = 3000;
const ADMIN_PASSWORD = "123";
const JWT_SECRET = "auro_haze_secret_2026";

// MongoDB URI
const MONGO_URI =
  "mongodb+srv://auroadmin:auro12345@cluster0.vgt7z8p.mongodb.net/aurohaze?appName=Cluster0";

// ================== FRONTEND PATH (KRİTİK) ==================
const FRONTEND_PATH = path.join(__dirname, "..", "frontend");

// Frontend statik dosyalar
app.use(express.static(FRONTEND_PATH));

// Root her zaman index.html dönsün
app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_PATH, "index.html"));
});

// ================== MONGODB ==================
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB bağlandı"))
  .catch((err) => console.log("MongoDB hata:", err.message));

// ================== MODELS ==================

// PRODUCT
const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  img: String,
});
const Product = mongoose.model("Product", ProductSchema);

// USER
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  passwordHash: String,
  favorites: [String],
});
const User = mongoose.model("User", UserSchema);

// ================== AUTH MIDDLEWARE ==================
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Token yok" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Token geçersiz" });
  }
}

// ================== API ==================

// PRODUCTS
app.get("/api/products", async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// ================== AUTH ==================

// REGISTER
app.post("/api/auth/register", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Eksik bilgi" });

  const exists = await User.findOne({ email });
  if (exists) return res.status(409).json({ error: "Email kayıtlı" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, passwordHash, favorites: [] });

  const token = jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, email: user.email });
});

// LOGIN
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(401).json({ error: "Hatalı giriş" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Hatalı giriş" });

  const token = jwt.sign(
    { id: user._id, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token, email: user.email });
});

// PROFILE
app.get("/api/user/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("email favorites");
  res.json(user);
});

// FAVORITES
app.post("/api/user/favorites", auth, async (req, res) => {
  const { productId } = req.body;
  await User.findByIdAndUpdate(req.user.id, {
    $addToSet: { favorites: productId },
  });
  res.json({ success: true });
});

// ================== ADMIN ==================

app.post("/api/admin/login", (req, res) => {
  if (req.body.password === ADMIN_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Şifre yanlış" });
  }
});

app.post("/api/admin/products", async (req, res) => {
  if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Yetkisiz" });
  }

  const { name, price, img } = req.body;
  const product = new Product({ name, price, img });
  await product.save();
  res.json(product);
});

app.delete("/api/admin/products/:id", async (req, res) => {
  if (req.headers["x-admin-password"] !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Yetkisiz" });
  }

  await Product.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// TEST
app.get("/test", (req, res) => {
  res.send("FRONTEND TEST OK");
});

// ================== START ==================
app.listen(PORT, () => {
  console.log(`Server çalışıyor → http://localhost:${PORT}`);
});
