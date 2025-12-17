const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const ORDERS_FILE = path.join(__dirname, "orders.json");
if (!fs.existsSync(ORDERS_FILE)) fs.writeFileSync(ORDERS_FILE, "[]");

// SİPARİŞ OLUŞTUR → ÖDEME SAYFASI
app.post("/api/create-order", (req, res) => {
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
    orders.push({
        id: Date.now(),
        date: new Date(),
        customer: req.body.customer,
        cart: req.body.cart,
        total: req.body.total,
        status: "WAITING_PAYMENT"
    });
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
    res.json({ success:true, redirectUrl:"/payment.html" });
});

// ADMIN
app.get("/api/admin/orders", (req,res)=>{
    const orders = JSON.parse(fs.readFileSync(ORDERS_FILE));
    res.json(orders.reverse());
});

app.listen(PORT,()=>{
    console.log("Server çalışıyor → http://localhost:3000");
});
