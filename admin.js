// ================== STATE ==================
let ADMIN_PASS = "";
let EDIT_ID = null;

// ================== HELPERS ==================
const $ = (id) => document.getElementById(id);

// ================== UI ==================
function showLogin() {
  $("loginBox").classList.remove("hidden");
  $("panelBox").classList.add("hidden");
}

function showPanel() {
  $("loginBox").classList.add("hidden");
  $("panelBox").classList.remove("hidden");
}

// ================== LOGIN ==================
async function login() {
  const pass = $("password").value.trim();
  if (!pass) {
    alert("Şifre boş");
    return;
  }

  const res = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: pass })
  });

  if (!res.ok) {
    alert("Şifre yanlış");
    return;
  }

  ADMIN_PASS = pass;
  showPanel();
  loadProducts();
}

// ================== LOAD PRODUCTS ==================
async function loadProducts() {
  const list = $("productList");
  list.innerHTML = "";

  try {
    const res = await fetch("/api/products");
    const products = await res.json();

    if (!products.length) {
      list.innerHTML = "<p>Henüz ürün yok.</p>";
      return;
    }

    products.forEach(p => {
      const div = document.createElement("div");
      div.className = "product";

      div.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px">
          <img src="${p.img}">
          <div>
            <b>${p.name}</b><br>
            ${p.price} TL
          </div>
        </div>
        <div>
          <button onclick="editProduct('${p._id}', '${p.name}', ${p.price})">Düzenle</button>
          <button onclick="deleteProduct('${p._id}')">Sil</button>
        </div>
      `;

      list.appendChild(div);
    });
  } catch {
    list.innerHTML = "<p>Ürünler alınamadı.</p>";
  }
}

// ================== ADD / SAVE ==================
async function addProduct() {
  if (EDIT_ID) return saveEdit();

  const name = $("name").value.trim();
  const price = $("price").value;
  const image = $("image").files[0];

  if (!name || !price || !image) {
    alert("Tüm alanlar zorunlu");
    return;
  }

  const fd = new FormData();
  fd.append("name", name);
  fd.append("price", price);
  fd.append("image", image);

  const res = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "x-admin-password": ADMIN_PASS },
    body: fd
  });

  if (!res.ok) {
    alert("Ürün eklenemedi");
    return;
  }

  resetForm();
  loadProducts();
}

// ================== EDIT ==================
function editProduct(id, name, price) {
  EDIT_ID = id;
  $("name").value = name;
  $("price").value = price;

  $("addBtn").innerText = "Kaydet";
}

async function saveEdit() {
  const name = $("name").value.trim();
  const price = $("price").value;

  const res = await fetch("/api/admin/products/" + EDIT_ID, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-admin-password": ADMIN_PASS
    },
    body: JSON.stringify({ name, price })
  });

  if (!res.ok) {
    alert("Güncellenemedi");
    return;
  }

  EDIT_ID = null;
  resetForm();
  loadProducts();
}

// ================== DELETE ==================
async function deleteProduct(id) {
  if (!confirm("Silmek istiyor musun?")) return;

  await fetch("/api/admin/products/" + id, {
    method: "DELETE",
    headers: { "x-admin-password": ADMIN_PASS }
  });

  loadProducts();
}

// ================== RESET ==================
function resetForm() {
  $("name").value = "";
  $("price").value = "";
  $("image").value = "";
  $("addBtn").innerText = "Ürün Ekle";
}

// ================== INIT ==================
showLogin();
