// scripts.js - Minimal Update

// === KONSTANTA & UTILITY ===
const storageKey = 'tokoProducts';
const cartKey = 'tokoCart';
const adminKey = 'tokoAdminPass'; 

function getProducts() {
    const stored = localStorage.getItem(storageKey);
    // Produk Default dengan image yang lebih menarik untuk tema baru
    return stored ? JSON.parse(stored) : [
        { id: 1, name: "Paket Data 5GB Super Cepat", price: 55000, category: "Digital", image: "https://images.unsplash.com/photo-1547394765-185e1e68f349?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80", stock: 100 },
        { id: 2, name: "Voucher Game Elite Pass Rp 50k", price: 50000, category: "Digital", image: "https://images.unsplash.com/photo-1579758774786-04419f79f82d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80", stock: 50 },
        { id: 3, name: "Pulsa Elektrik 10k Instan", price: 10500, category: "Pulsa", image: "https://images.unsplash.com/photo-1558498422-7945d83637e6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=300&q=80", stock: 200 }
    ];
}

function saveProducts(products) {
    localStorage.setItem(storageKey, JSON.stringify(products));
}

function getCart() {
    const stored = localStorage.getItem(cartKey);
    return stored ? JSON.parse(stored) : [];
}

function saveCart(cart) {
    localStorage.setItem(cartKey, JSON.stringify(cart));
}

function initializeAdminPass() {
    if (!localStorage.getItem(adminKey)) {
        localStorage.setItem(adminKey, "dev123");
    }
}

function updateCartCount() {
    const cart = getCart();
    const countElement = document.getElementById('cart-count');
    if (countElement) {
        countElement.textContent = cart.reduce((total, item) => total + item.quantity, 0);
    }
}

// === LOGIKA BERANDA (index.html) ===

function addToCart(productId) {
    let cart = getCart();
    const products = getProducts();
    const product = products.find(p => p.id == productId);

    if (!product) return alert("Produk tidak ditemukan.");

    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        // Pastikan menyimpan image untuk ditampilkan di cart.html
        cart.push({ id: productId, name: product.name, price: product.price, quantity: 1, image: product.image });
    }

    saveCart(cart);
    updateCartCount();
    // Gunakan konfirmasi yang lebih halus
    const productName = product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name;
    const notification = document.getElementById('notification-area');
    if (notification) {
        notification.textContent = `"${productName}" ditambahkan!`;
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 2000);
    } else {
        alert(`"${product.name}" berhasil ditambahkan ke keranjang!`);
    }
}

function displayFeaturedProducts() {
    const container = document.getElementById('featured-products');
    if (!container) return;
    
    // Asumsikan kita hanya menampilkan 3 produk pertama sebagai unggulan
    const products = getProducts().slice(0, 3); 

    container.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image}" alt="${p.name}">
            <h4 style="margin: 0 0 5px 0;">${p.name}</h4>
            <p>Rp ${p.price.toLocaleString('id-ID')}</p>
            <button class="btn-primary" onclick="addToCart(${p.id})" style="width: 100%; margin-top: 10px;">+ Keranjang</button>
        </div>
    `).join('');
}


// === LOGIKA ADMIN (admin.html) ===

// Menggunakan fungsi yang sudah dimodifikasi untuk Admin (sudah termasuk logika hapus)
function deleteProduct(productId) {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini? Aksi ini tidak dapat dibatalkan.")) {
        return;
    }

    let products = getProducts();
    products = products.filter(p => p.id !== productId); 
    
    saveProducts(products); 
    
    alert("Produk berhasil dihapus!");
    renderAdminPageContent(); 
}

function renderProductListForAdmin() {
    const products = getProducts();
    
    if (products.length === 0) {
        return '<p style="color: var(--text-muted);">Belum ada produk untuk dikelola. Silakan tambahkan produk baru di atas.</p>';
    }

    const listHtml = products.map(p => `
        <div class="card" style="display: flex; justify-content: space-between; align-items: center; padding: 15px; margin-bottom: 10px; background-color: #1a1a1a;">
            <div style="display: flex; align-items: center;">
                <img src="${p.image}" alt="${p.name}" style="width: 40px; height: 40px; object-fit: cover; margin-right: 15px; border-radius: 4px; border: 1px solid var(--primary-color);">
                <div>
                    <strong style="color: var(--primary-color);">${p.name}</strong>
                    <small style="color: var(--text-muted); display: block;">ID: ${p.id} | Harga: Rp ${p.price.toLocaleString('id-ID')}</small>
                </div>
            </div>
            <button class="btn-primary" style="background-color: #dc3545; padding: 8px 15px;" onclick="deleteProduct(${p.id})">Hapus</button>
        </div>
    `).join('');

    return `
        <h2 style="color: var(--primary-color);">Daftar Produk Aktif (${products.length})</h2>
        ${listHtml}
    `;
}

function handleAddProduct(e) {
    e.preventDefault();
    let products = getProducts();
    const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;

    const productName = document.getElementById('product-name').value;
    const productImage = document.getElementById('product-image-url').value || "https://via.placeholder.com/100?text=NEW_PROD";
    
    const newProduct = {
        id: newId,
        name: productName,
        price: parseFloat(document.getElementById('product-price').value),
        category: document.getElementById('product-category').value,
        image: productImage, // Gunakan URL gambar dari input
        stock: 100
    };

    products.push(newProduct);
    saveProducts(products);
    alert(`Produk "${newProduct.name}" berhasil ditambahkan.`);
    document.getElementById('product-form').reset();
    renderAdminPageContent(); // Render ulang setelah menambah
}

function renderAdminPageContent() {
    const adminContent = document.getElementById('admin-content');
    
    const formHtml = `
        <h1 style="color: var(--primary-color); animation: neon-glow 1.5s infinite alternate;">Tambah Produk Baru</h1>
        <div class="card" style="max-width: 600px; margin: 30px auto;">
            <form id="product-form">
                <label style="display: block; margin-bottom: 5px;">Nama Produk:</label>
                <input type="text" id="product-name" class="form-control" required>

                <label style="display: block; margin-bottom: 5px;">URL Foto Produk:</label>
                <input type="text" id="product-image-url" class="form-control" placeholder="https://contoh.com/gambar.jpg" required>

                <label style="display: block; margin-bottom: 5px;">Harga (Rp):</label>
                <input type="number" id="product-price" class="form-control" step="1000" required>
                
                <label style="display: block; margin-bottom: 5px;">Kategori:</label>
                <select id="product-category" class="form-control" required>
                    <option value="Pulsa">Pulsa</option>
                    <option value="Digital">Digital</option>
                    <option value="Fisik">Fisik</option>
                </select>
                <small style="color: var(--text-muted);">*Stok default 100 untuk produk baru</small>
                <br>
                <button type="submit" class="btn-primary" style="margin-top: 15px;">Tambah Produk</button>
            </form>
        </div>
    `;

    const listHtml = renderProductListForAdmin();

    adminContent.innerHTML = formHtml + '<hr style="margin: 40px 0; border-color: #333;">' + listHtml;
    
    document.getElementById('product-form').addEventListener('submit', handleAddProduct);
}

function attemptLogin() {
    const inputPass = document.getElementById('admin-password').value;
    const correctPass = localStorage.getItem(adminKey);

    if (inputPass === correctPass) {
        renderAdminPageContent();
    } else {
        alert("Akses ditolak. Sandi salah.");
    }
}

// === LOGIKA KERANJANG (cart.html) ===

function updateQuantity(productId, change) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex > -1) {
        cart[itemIndex].quantity += change;
        
        if (cart[itemIndex].quantity <= 0) {
            cart.splice(itemIndex, 1);
        }
    }
    saveCart(cart);
    renderCart();
    updateCartCount();
}

function calculateTotal(cart) {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

function renderCart() {
    const cartList = document.getElementById('cart-list');
    const cartTotalDisplay = document.getElementById('cart-total');
    let cart = getCart();
    const checkoutButton = document.querySelector('.checkout-btn-area button');

    if (cart.length === 0) {
        cartList.innerHTML = '<p style="text-align: center; margin: 30px 0; color: var(--text-muted);">Keranjang Anda kosong. Ayo belanja!</p>';
        cartTotalDisplay.textContent = 'Rp 0';
        checkoutButton.disabled = true;
        return;
    }

    checkoutButton.disabled = false;
    
    cartList.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image || 'https://via.placeholder.com/50?text=P'}" alt="${item.name}">
            <div class="item-details">
                <p style="font-weight: bold; margin: 0; color: var(--text-light);">${item.name}</p>
                <p style="color: var(--text-muted); margin: 5px 0 0 0;">Rp ${(item.price * item.quantity).toLocaleString('id-ID')} @ Rp ${item.price.toLocaleString('id-ID')}</p>
            </div>
            <div class="item-controls">
                <button onclick="updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button onclick="updateQuantity(${item.id}, 1)">+</button>
            </div>
        </div>
    `).join('');

    const total = calculateTotal(cart);
    cartTotalDisplay.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}

// === LOGIKA CHECKOUT (checkout.html) ===

function handleCheckoutSubmission(e) {
    e.preventDefault();
    const total = calculateTotal(getCart());

    if (total === 0) {
        alert("Keranjang kosong. Tidak dapat melakukan pembayaran.");
        window.location.href = 'cart.html';
        return;
    }
    
    const selectedMethod = document.querySelector('input[name="payment"]:checked').value;

    // Simulasi Sukses Transaksi
    alert(`Pembayaran Rp ${total.toLocaleString('id-ID')} menggunakan ${selectedMethod} berhasil disimulasikan! Terima kasih.`);
    
    // Kosongkan keranjang setelah 'pembayaran'
    saveCart([]);
    updateCartCount();
    
    // Arahkan kembali ke beranda
    window.location.href = 'index.html';
}

function displayFinalTotal() {
    const finalTotalDisplay = document.getElementById('final-total');
    const total = calculateTotal(getCart());

    if (total === 0) {
        // Redirect jika keranjang kosong saat masuk checkout
        // window.location.href = 'cart.html'; 
        // return;
        // Biarkan di halaman checkout, tapi tampilkan total 0
    }

    finalTotalDisplay.textContent = `Rp ${total.toLocaleString('id-ID')}`;
}


// === LOGIKA KATALOG (products.html) ===
function displayAllProducts() {
    const container = document.getElementById('all-products');
    
    if (!container) return;
    
    container.innerHTML = '';
    const products = getProducts(); 

    if (products.length === 0) {
        container.innerHTML = '<p style="color: var(--text-muted);">Maaf, belum ada produk yang tersedia.</p>';
        return;
    }

    container.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.image}" alt="${p.name}">
            <h4 style="margin: 0 0 5px 0;">${p.name}</h4>
            <p>Rp ${p.price.toLocaleString('id-ID')}</p>
            <button class="btn-primary" onclick="addToCart(${p.id})" style="width: 100%; margin-top: 10px;">+ Keranjang</button>
        </div>
    `).join('');
}


// === DISPATCHER (Memastikan fungsi yang tepat dijalankan) ===

document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    initializeAdminPass();

    // Cek halaman dan panggil fungsi yang relevan
    const path = window.location.pathname;

    if (path.includes('index.html') || path === '/') {
        displayFeaturedProducts();
    } else if (path.includes('cart.html')) {
        renderCart();
    } else if (path.includes('checkout.html')) {
        displayFinalTotal();
        const paymentForm = document.getElementById('payment-form');
        if (paymentForm) {
            paymentForm.addEventListener('submit', handleCheckoutSubmission);
        }
    } else if (path.includes('products.html')) {
         displayAllProducts();
    }
    // Admin login dan form dijalankan secara terpisah melalui event listener di admin.html
});