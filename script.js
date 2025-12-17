// 1. ÜRÜN VERİLERİ
const products = [
    { id: 1, name: "Haze Black Oversize", price: 850, img: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?q=80&w=800" },
    { id: 2, name: "Auro Denim Ceket", price: 2100, img: "https://images.unsplash.com/photo-1576871337622-98d48d1cf531?q=80&w=800" },
    { id: 3, name: "Ivory Minimalist Hoodie", price: 1400, img: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800" },
    { id: 4, name: "Desert Sand Pantolon", price: 1250, img: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?q=80&w=800" },
    { id: 5, name: "Zen Cotton Gömlek", price: 950, img: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?q=80&w=800" },
    { id: 6, name: "Auro Essential Cap", price: 450, img: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800" }
];

let cart = [];
let currentProduct = null;
let currentSize = null;

// 2. ANA SAYFA ÜRÜN GRID
function renderGrid() {
    const grid = document.getElementById("product-grid");
    grid.innerHTML = products.map(p => `
        <div class="product-card" onclick="openProductDetail(${p.id})">
            <img src="${p.img}" class="product-image">
            <div class="product-info">
                <h3>${p.name}</h3>
                <p>${p.price} TL</p>
            </div>
        </div>
    `).join("");
}

// 3. ÜRÜN DETAY
function openProductDetail(id) {
    currentProduct = products.find(p => p.id === id);
    currentSize = null;

    document.getElementById("detail-img").src = currentProduct.img;
    document.getElementById("detail-title").innerText = currentProduct.name;
    document.getElementById("detail-price").innerText = currentProduct.price + " TL";

    document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("selected"));

    document.getElementById("home-view").style.display = "none";
    document.getElementById("product-detail-view").style.display = "block";
    window.scrollTo(0, 0);
}

function goHome() {
    document.getElementById("home-view").style.display = "block";
    document.getElementById("product-detail-view").style.display = "none";
    window.scrollTo(0, 0);
}

// 4. BEDEN
function selectSize(size, el) {
    currentSize = size;
    document.querySelectorAll(".size-btn").forEach(b => b.classList.remove("selected"));
    el.classList.add("selected");
}

// 5. SEPETE EKLE
function addToCartFromDetail() {
    if (!currentSize) {
        alert("Lütfen beden seçiniz");
        return;
    }

    cart.push({
        ...currentProduct,
        selectedSize: currentSize,
        cartId: Date.now()
    });

    updateCartUI();
    toggleCart();
}

// 6. SEPET
function toggleCart() {
    document.getElementById("cart-sidebar").classList.toggle("active");
    showCartStep();
}

function updateCartUI() {
    const list = document.getElementById("cart-items-list");
    const count = document.getElementById("cart-count");
    const totalEl = document.getElementById("cart-total");

    count.innerText = cart.length;

    if (cart.length === 0) {
        list.innerHTML = `<p style="text-align:center;color:#999;margin-top:50px;">Sepetiniz boş.</p>`;
        totalEl.innerText = "0 TL";
        return;
    }

    let total = 0;
    list.innerHTML = cart.map(i => {
        total += i.price;
        return `
            <div class="cart-item">
                <img src="${i.img}" style="width:60px;height:80px;object-fit:cover;border-radius:5px;">
                <div style="flex:1;">
                    <b>${i.name}</b>
                    <div style="font-size:0.8rem;color:#666;">Beden: ${i.selectedSize}</div>
                    <div>${i.price} TL</div>
                </div>
                <div onclick="removeFromCart(${i.cartId})" style="color:red;cursor:pointer;">×</div>
            </div>
        `;
    }).join("");

    totalEl.innerText = total + " TL";
}

function removeFromCart(id) {
    cart = cart.filter(i => i.cartId !== id);
    updateCartUI();
}

// 7. CHECKOUT ADIMI
function showCheckout() {
    if (cart.length === 0) {
        alert("Sepet boş");
        return;
    }
    document.getElementById("cart-step-1").style.display = "none";
    document.getElementById("cart-step-2").style.display = "block";
}

function showCartStep() {
    document.getElementById("cart-step-1").style.display = "block";
    document.getElementById("cart-step-2").style.display = "none";
}

// 8. SİPARİŞ – BACKEND TEST ÖDEME
function processOrder(e) {
    e.preventDefault();

    const customer = {
        name: document.getElementById("cust-name").value,
        phone: document.getElementById("cust-phone").value,
        address: document.getElementById("cust-address").value
    };

    const total = cart.reduce((s, i) => s + i.price, 0);

    fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer, cart, total })
    })
    .then(r => r.json())
    .then(d => {
        if (d.success) {
            cart = [];
            updateCartUI();
            window.location.href = d.redirectUrl;
        } else {
            alert("Sipariş alınamadı");
        }
    })
    .catch(() => alert("Server bağlantı hatası"));
}

// BAŞLAT
window.onload = renderGrid;
