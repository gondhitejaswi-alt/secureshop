/* 
  SecureShop — Core Application Logic & State Management
*/

window.App = {
    currentUser: null,
    cart: [],
    priceTamperOverride: null,

    init: function() {
        console.log("Initializing SecureShop E-Commerce Engine...");
        this.renderProducts(MockDB.products);
        this.checkInitialSession();
    },

    // Navigation Switcher
    navigateTo: function(viewId) {
        document.querySelectorAll('.page-view').forEach(el => el.classList.add('hidden'));
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

        const targetView = document.getElementById(`view-${viewId}`);
        const targetNav = document.getElementById(`nav-${viewId}`);

        if (targetView) targetView.classList.remove('hidden');
        if (targetNav) targetNav.classList.add('active');

        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // Render Product Catalog Cards
    renderProducts: function(productsList) {
        const grid = document.getElementById('product-grid');
        grid.innerHTML = '';

        productsList.forEach(prod => {
            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                <span class="product-tag">${prod.category.toUpperCase()}</span>
                <div class="product-image-box">
                    <i class="fa-solid ${prod.icon}"></i>
                </div>
                <div class="product-title">${prod.title}</div>
                <div class="product-desc">${prod.description}</div>
                <div class="product-footer">
                    <span class="product-price">$${prod.price.toFixed(2)}</span>
                    <div>
                        <button class="btn-secondary" onclick="App.viewProductDetail(${prod.id})"><i class="fa-solid fa-eye"></i> Detail</button>
                        <button class="btn-primary" onclick="App.addToCart(${prod.id})"><i class="fa-solid fa-cart-plus"></i> Add</button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    filterProducts: function(category) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        if (category === 'all') {
            this.renderProducts(MockDB.products);
        } else {
            const filtered = MockDB.products.filter(p => p.category === category);
            this.renderProducts(filtered);
        }
    },

    // Search Handler (Reflected XSS Target)
    handleSearch: function(event) {
        if (event.key === 'Enter') {
            this.triggerSearch();
        }
    },

    triggerSearch: function() {
        const query = document.getElementById('search-input').value;
        const reflectionBox = document.getElementById('search-reflection-box');

        if (!query) {
            reflectionBox.classList.add('hidden');
            this.renderProducts(MockDB.products);
            return;
        }

        reflectionBox.classList.remove('hidden');

        // REFLECTED XSS CHECK BASED ON SECURITY MODE
        if (window.SecureLab && !window.SecureLab.isPatchedMode) {
            // VULNERABLE: Direct innerHTML reflection without escaping
            reflectionBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <strong>Search Results for:</strong> ${query} (Vulnerable innerHTML reflection)`;
            
            // Log to lab terminal
            if (query.includes('<script>') || query.includes('onerror') || query.includes('javascript:')) {
                SecureLab.logTerminal(`[XSS DETECTED] Reflected XSS Payload rendered: ${query}`);
                SecureLab.markExploited('xss_reflected');
            }
        } else {
            // PATCHED: Escape HTML characters using textContent
            reflectionBox.textContent = `Search Results for: "${query}"`;
        }

        // Filter products
        const matching = MockDB.products.filter(p => 
            p.title.toLowerCase().includes(query.toLowerCase()) || 
            p.description.toLowerCase().includes(query.toLowerCase())
        );
        this.renderProducts(matching);
    },

    // Product Details & Stored XSS Review Handler
    viewProductDetail: function(productId) {
        const prod = MockDB.products.find(p => p.id === productId);
        if (!prod) return;

        this.navigateTo('product-detail');
        const container = document.getElementById('product-detail-container');

        let reviewsHtml = '';
        prod.reviews.forEach(r => {
            // STORED XSS HANDLING BASED ON SECURITY MODE
            let reviewText = r.text;
            if (window.SecureLab && window.SecureLab.isPatchedMode) {
                // Escape HTML for security
                reviewText = this.escapeHTML(r.text);
            }

            reviewsHtml += `
                <div class="review-card">
                    <div class="review-header">
                        <strong><i class="fa-solid fa-user"></i> ${r.user}</strong>
                        <span>Rating: ${'★'.repeat(r.rating)} (${r.date})</span>
                    </div>
                    <div class="review-content">${reviewText}</div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="detail-grid">
                <div class="product-image-box">
                    <i class="fa-solid ${prod.icon}"></i>
                </div>
                <div>
                    <h2>${prod.title}</h2>
                    <p class="product-desc" style="font-size:1.1rem; margin:15px 0;">${prod.description}</p>
                    <h3 class="product-price" style="font-size:1.8rem;">$${prod.price.toFixed(2)}</h3>
                    <div style="margin-top:20px;">
                        <button class="btn-primary-glow" onclick="App.addToCart(${prod.id})"><i class="fa-solid fa-cart-shopping"></i> Add to Cart</button>
                    </div>
                </div>
            </div>

            <div class="reviews-section">
                <h3>Customer Reviews & Security Lab Target</h3>
                <p><small>In Vulnerable Mode, reviews accept unescaped HTML tags (Stored XSS Target).</small></p>

                <div class="form-group" style="margin-top:20px;">
                    <label>Add Your Product Review:</label>
                    <textarea id="new-review-text" rows="3" placeholder="Enter review (e.g. Great product! <script>alert('Stored_XSS')</script>)..."></textarea>
                    <button class="btn-action" style="margin-top:10px;" onclick="App.submitReview(${prod.id})">Post Review</button>
                </div>

                <div id="reviews-list" style="margin-top:25px;">
                    ${reviewsHtml || '<em>No reviews posted yet. Be the first!</em>'}
                </div>
            </div>
        `;
    },

    submitReview: function(productId) {
        const textInput = document.getElementById('new-review-text').value;
        if (!textInput) return;

        const prod = MockDB.products.find(p => p.id === productId);
        if (!prod) return;

        const newReview = {
            id: Date.now(),
            user: this.currentUser ? this.currentUser.username : "GuestUser",
            text: textInput,
            rating: 5,
            date: new Date().toISOString().split('T')[0]
        };

        prod.reviews.unshift(newReview);

        if (!window.SecureLab.isPatchedMode && (textInput.includes('<script>') || textInput.includes('onerror='))) {
            SecureLab.logTerminal(`[XSS EXPLOIT] Stored XSS review payload saved to Database: ${textInput}`);
            SecureLab.markExploited('xss_stored');
        }

        this.viewProductDetail(productId);
    },

    // Cart Management
    addToCart: function(productId) {
        const prod = MockDB.products.find(p => p.id === productId);
        if (!prod) return;

        const existing = this.cart.find(c => c.product.id === productId);
        if (existing) {
            existing.qty += 1;
        } else {
            this.cart.push({ product: prod, qty: 1, customUnitPrice: prod.price });
        }

        this.updateCartBadge();
        this.showToast(`Added ${prod.title} to cart!`);
    },

    updateCartBadge: function() {
        const count = this.cart.reduce((sum, item) => sum + item.qty, 0);
        document.getElementById('cart-count').textContent = count;
    },

    openCartModal: function() {
        document.getElementById('cart-modal').classList.remove('hidden');
        this.renderCartModal();
    },

    closeCartModal: function() {
        document.getElementById('cart-modal').classList.add('hidden');
    },

    renderCartModal: function() {
        const list = document.getElementById('cart-items-list');
        list.innerHTML = '';

        if (this.cart.length === 0) {
            list.innerHTML = '<p style="text-align:center; padding:20px; color:var(--text-muted);">Your shopping cart is empty.</p>';
            document.getElementById('cart-subtotal').textContent = '$0.00';
            document.getElementById('cart-final-total').textContent = '$0.00';
            return;
        }

        let calculatedSubtotal = 0;
        this.cart.forEach((item, idx) => {
            const itemTotal = item.customUnitPrice * item.qty;
            calculatedSubtotal += itemTotal;

            const row = document.createElement('div');
            row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid var(--border-color);';
            row.innerHTML = `
                <div>
                    <strong>${item.product.title}</strong><br>
                    <small>Qty: ${item.qty} x $${item.customUnitPrice.toFixed(2)}</small>
                </div>
                <strong>$${itemTotal.toFixed(2)}</strong>
            `;
            list.appendChild(row);
        });

        const finalPrice = this.priceTamperOverride !== null ? this.priceTamperOverride : calculatedSubtotal;
        document.getElementById('cart-subtotal').textContent = `$${calculatedSubtotal.toFixed(2)}`;
        document.getElementById('cart-final-total').textContent = `$${finalPrice.toFixed(2)}`;
    },

    applyPriceTampering: function() {
        const val = parseFloat(document.getElementById('cart-price-tamper').value);
        if (isNaN(val)) return;

        this.priceTamperOverride = val;
        this.renderCartModal();

        if (SecureLab) {
            SecureLab.logTerminal(`[BUSINESS LOGIC] Price Tampering Payload applied: Total set to $${val.toFixed(2)}`);
        }
    },

    checkoutCart: function() {
        if (this.cart.length === 0) return;

        // CHECKOUT BUSINESS LOGIC SECURITY TEST
        if (!window.SecureLab.isPatchedMode) {
            // VULNERABLE MODE: Accept client tampered price directly!
            const paidPrice = this.priceTamperOverride !== null ? this.priceTamperOverride : this.cart.reduce((s, i) => s + (i.customUnitPrice * i.qty), 0);
            
            if (this.priceTamperOverride !== null && this.priceTamperOverride < 10) {
                SecureLab.logTerminal(`[BUSINESS LOGIC VULNERABILITY EXPLOITED] Checkout accepted tampered price of $${paidPrice.toFixed(2)}!`);
                SecureLab.markExploited('logic');
            }

            alert(`Order Placed Successfully! Total Billed: $${paidPrice.toFixed(2)}`);
        } else {
            // PATCHED MODE: Recalculate rigid price server-side from catalog
            const realTotal = this.cart.reduce((sum, item) => {
                const catalogProd = MockDB.products.find(p => p.id === item.product.id);
                return sum + (catalogProd.price * item.qty);
            }, 0);

            if (this.priceTamperOverride !== null && this.priceTamperOverride !== realTotal) {
                SecureLab.logTerminal(`[PATCHED PREVENTED] Server rejected price tampering payload! Actual total enforced: $${realTotal.toFixed(2)}`);
            }

            alert(`Order Placed Successfully! Verified Server Price Billed: $${realTotal.toFixed(2)}`);
        }

        this.cart = [];
        this.priceTamperOverride = null;
        this.updateCartBadge();
        this.closeCartModal();
    },

    // IDOR Direct Object Reference Order Fetcher
    fetchOrderById: function() {
        const orderId = parseInt(document.getElementById('order-id-input').value);
        const container = document.getElementById('order-details-container');

        const foundOrder = MockDB.orders.find(o => o.id === orderId);

        if (!foundOrder) {
            container.innerHTML = `<div style="color:var(--vuln-red); text-align:center; padding:20px;">Order #${orderId} not found in database.</div>`;
            return;
        }

        // IDOR AUTHORIZATION CHECK BASED ON SECURITY MODE
        if (!window.SecureLab.isPatchedMode) {
            // VULNERABLE: Direct access without verifying order owner!
            if (this.currentUser && foundOrder.userId !== this.currentUser.id) {
                SecureLab.logTerminal(`[IDOR EXPLOITED] Unauthorized user ${this.currentUser.username} accessed Order #${foundOrder.id} belonging to User ID ${foundOrder.userId}!`);
                SecureLab.markExploited('idor');
            }

            container.innerHTML = `
                <div class="order-card">
                    <h3 style="color:var(--accent-cyan);">Receipt for Order #${foundOrder.id} <span style="font-size:0.8rem; background:var(--vuln-red-bg); color:var(--vuln-red); padding:3px 8px; border-radius:4px;">UNAUTHORIZED ACCESS DEMO</span></h3>
                    <div class="order-meta-grid">
                        <div><strong>Customer Name:</strong> ${foundOrder.customerName}</div>
                        <div><strong>User Account ID:</strong> ${foundOrder.userId}</div>
                        <div><strong>Order Date:</strong> ${foundOrder.date}</div>
                        <div><strong>Status:</strong> ${foundOrder.status}</div>
                        <div><strong>Shipping Address:</strong> ${foundOrder.shippingAddress}</div>
                        <div><strong>Payment Card:</strong> ${foundOrder.creditCard}</div>
                    </div>
                    <h4>Ordered Items:</h4>
                    <ul>
                        ${foundOrder.items.map(i => `<li>${i.title} (Qty: ${i.qty}) — $${i.price.toFixed(2)}</li>`).join('')}
                    </ul>
                </div>
            `;
        } else {
            // PATCHED: Enforce rigid ownership check
            if (!this.currentUser || (foundOrder.userId !== this.currentUser.id && this.currentUser.role !== 'admin')) {
                SecureLab.logTerminal(`[IDOR PREVENTED] Access Denied to Order #${foundOrder.id}. User not authorized.`);
                container.innerHTML = `
                    <div style="background:var(--vuln-red-bg); color:var(--vuln-red); padding:20px; border-radius:8px; text-align:center;">
                        <i class="fa-solid fa-lock" style="font-size:2rem; margin-bottom:10px;"></i><br>
                        <strong>403 Access Denied:</strong> You are not authorized to view Order #${foundOrder.id}.
                    </div>
                `;
                return;
            }

            container.innerHTML = `
                <div class="order-card">
                    <h3>Receipt for Order #${foundOrder.id}</h3>
                    <div class="order-meta-grid">
                        <div><strong>Customer Name:</strong> ${foundOrder.customerName}</div>
                        <div><strong>Status:</strong> ${foundOrder.status}</div>
                        <div><strong>Date:</strong> ${foundOrder.date}</div>
                    </div>
                </div>
            `;
        }
    },

    // Profile DOM XSS Handler
    updateProfileBio: function() {
        const bioInput = document.getElementById('profile-bio-input').value;
        const renderArea = document.getElementById('profile-bio-render');

        if (!bioInput) return;

        if (!window.SecureLab.isPatchedMode) {
            // VULNERABLE: Direct DOM innerHTML assignment
            renderArea.innerHTML = bioInput;

            if (bioInput.includes('<img') || bioInput.includes('onerror=') || bioInput.includes('<script>')) {
                SecureLab.logTerminal(`[DOM XSS EXPLOITED] Rendered raw innerHTML payload in bio area: ${bioInput}`);
                SecureLab.markExploited('xss_reflected');
            }
        } else {
            // PATCHED: Use textContent / safe text node
            renderArea.textContent = bioInput;
            SecureLab.logTerminal(`[DOM XSS PREVENTED] Sanitized bio payload rendered safely as plain text.`);
        }
    },

    // Admin Sensitive Data Exposure Handler
    fetchAdminConfig: function() {
        const jsonCode = document.getElementById('admin-config-json');

        if (!window.SecureLab.isPatchedMode) {
            // VULNERABLE: Public endpoint exposure
            jsonCode.textContent = JSON.stringify(MockDB.adminConfig, null, 2);
            SecureLab.logTerminal(`[SENSITIVE DATA EXPOSURE] Unprotected /api/admin/config leaked JWT keys & AWS secrets!`);
            SecureLab.markExploited('exposure');
        } else {
            // PATCHED: Enforce admin authorization
            if (!this.currentUser || this.currentUser.role !== 'admin') {
                jsonCode.textContent = JSON.stringify({ error: "401 Unauthorized - Admin JWT Token Required" }, null, 2);
                SecureLab.logTerminal(`[EXPOSURE PREVENTED] /api/admin/config blocked non-admin user request.`);
            } else {
                jsonCode.textContent = JSON.stringify({ message: "Authorized Admin Access Granted" }, null, 2);
            }
        }
    },

    // Auth & JWT Handling
    openAuthModal: function(mode) {
        document.getElementById('auth-modal').classList.remove('hidden');
    },

    closeAuthModal: function() {
        document.getElementById('auth-modal').classList.add('hidden');
    },

    handleAuthSubmit: function(event) {
        event.preventDefault();
        const u = document.getElementById('auth-username').value;
        const p = document.getElementById('auth-password').value;

        const authResult = MockDB.authenticateUser(u, p, window.SecureLab.isPatchedMode);

        if (authResult.success) {
            this.currentUser = authResult.user;
            
            if (authResult.sqliTriggered) {
                SecureLab.logTerminal(`[SQL INJECTION EXPLOITED] Login authentication bypassed via query payload: ${u}`);
                SecureLab.markExploited('sqli');
            }

            this.updateUserSessionUI();
            this.closeAuthModal();
            this.showToast(`Logged in successfully as ${this.currentUser.username}`);
        } else {
            alert(`Login Failed: ${authResult.error}`);
        }
    },

    updateUserSessionUI: function() {
        if (!this.currentUser) return;

        document.getElementById('auth-buttons').classList.add('hidden');
        document.getElementById('user-profile-menu').classList.remove('hidden');
        document.getElementById('dropdown-username').textContent = this.currentUser.username;
        document.getElementById('dropdown-role').textContent = this.currentUser.role.toUpperCase();
        document.getElementById('user-avatar-initial').textContent = this.currentUser.username.charAt(0).toUpperCase();

        if (this.currentUser.role === 'admin') {
            document.getElementById('nav-admin').classList.remove('hidden');
        }

        // Generate Mock JWT (Weak key scenario)
        const mockJWT = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(JSON.stringify(this.currentUser))}.weak_signature_hash`;
        localStorage.setItem('secureshop_jwt', mockJWT);
        document.getElementById('profile-jwt-display').textContent = mockJWT;
        document.getElementById('profile-name').textContent = this.currentUser.username;
        document.getElementById('profile-email').value = this.currentUser.email;
        document.getElementById('profile-role').textContent = this.currentUser.role;
    },

    logout: function() {
        this.currentUser = null;
        localStorage.removeItem('secureshop_jwt');
        document.getElementById('auth-buttons').classList.remove('hidden');
        document.getElementById('user-profile-menu').classList.add('hidden');
        document.getElementById('nav-admin').classList.add('hidden');
        this.navigateTo('shop');
        this.showToast("Logged out successfully.");
    },

    checkInitialSession: function() {
        // Default guest user or restored session
        this.currentUser = MockDB.users[1]; // John Cyber
        this.updateUserSessionUI();
    },

    escapeHTML: function(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    showToast: function(msg) {
        console.log(`[Toast Notification]: ${msg}`);
    },

    closeModal: function(modalId) {
        document.getElementById(modalId).classList.add('hidden');
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());
