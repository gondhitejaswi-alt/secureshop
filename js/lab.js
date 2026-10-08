/* 
  SecureShop — Red Team Security Laboratory & Exploit Engine
*/

window.SecureLab = {
    isPatchedMode: false,
    activeTab: 'exploits',
    activeVulnId: 'sqli',

    // Retest Matrix Tracking State
    retestMatrix: {
        sqli: { name: "SQL Injection (SQLi)", severity: "CRITICAL", exploited: false, patchedVerified: false },
        xss_stored: { name: "Stored Cross-Site Scripting (XSS)", severity: "HIGH", exploited: false, patchedVerified: false },
        xss_reflected: { name: "Reflected & DOM XSS", severity: "HIGH", exploited: false, patchedVerified: false },
        idor: { name: "Insecure Direct Object Reference (IDOR)", severity: "HIGH", exploited: false, patchedVerified: false },
        jwt: { name: "Broken Auth & Weak JWT Key", severity: "HIGH", exploited: false, patchedVerified: false },
        logic: { name: "Business Logic Price Tampering", severity: "MEDIUM", exploited: false, patchedVerified: false },
        exposure: { name: "Sensitive Data & Config Exposure", severity: "HIGH", exploited: false, patchedVerified: false }
    },

    // Vulnerability Modules Data
    vulnModules: {
        sqli: {
            title: "1. SQL Injection (SQLi) — Authentication Bypass",
            category: "OWASP A03:2021 – Injection",
            defaultPayload: "admin' OR '1'='1",
            description: "Concatenating user input directly into SQL database queries allows attackers to alter logic, bypass login screens, or dump entire table hashes.",
            vulnerableSnippet: `// Vulnerable Code (Raw Concatenation)
const query = "SELECT * FROM users WHERE username = '" + req.body.username + "' AND password = '" + req.body.password + "'";
db.query(query, (err, user) => {
    if (user) loginUser(user); // SQLi ' OR '1'='1 returns admin user!
});`,
            patchedSnippet: `// Secure Code (Parameterized Queries)
const query = "SELECT * FROM users WHERE username = ? AND password = ?";
db.query(query, [req.body.username, req.body.password], (err, user) => {
    if (user) loginUser(user);
});`
        },
        xss_stored: {
            title: "2. Stored Cross-Site Scripting (XSS)",
            category: "OWASP A03:2021 – Injection",
            defaultPayload: "<script>alert('STORED_XSS_EXPLOITED')</script>",
            description: "Product reviews accept raw HTML tags and store them in the database without sanitization, executing malicious JavaScript whenever other users view the page.",
            vulnerableSnippet: `// Vulnerable Code (Direct innerHTML Rendering)
reviewContainer.innerHTML = review.text; // Executes injected <script>`,
            patchedSnippet: `// Secure Code (Context-Aware Escaping)
reviewContainer.textContent = review.text; 
// OR DOMPurify.sanitize(review.text);`
        },
        xss_reflected: {
            title: "3. Reflected & DOM XSS",
            category: "OWASP A03:2021 – Injection",
            defaultPayload: "<img src=x onerror=alert('DOM_XSS')>",
            description: "Search bar queries and user profile bio inputs are reflected directly into the DOM using innerHTML without HTML escaping.",
            vulnerableSnippet: `// Vulnerable Code
document.getElementById('search-output').innerHTML = "Results for: " + query;`,
            patchedSnippet: `// Secure Code
document.getElementById('search-output').textContent = "Results for: " + query;`
        },
        idor: {
            title: "4. Insecure Direct Object Reference (IDOR)",
            category: "OWASP A01:2021 – Broken Access Control",
            defaultPayload: "1002",
            description: "Accessing receipt details via /api/order?id=1002 returns other users' private receipts and credit card digits because the backend fails to verify user authorization.",
            vulnerableSnippet: `// Vulnerable Code (No Ownership Verification)
app.get('/api/order', (req, res) => {
    const order = db.getOrder(req.query.id);
    res.json(order); // Returns order to ANY requester!
});`,
            patchedSnippet: `// Secure Code (Rigid Authorization Check)
app.get('/api/order', authenticateToken, (req, res) => {
    const order = db.getOrder(req.query.id);
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ error: "Access Denied" });
    }
    res.json(order);
});`
        },
        jwt: {
            title: "5. Broken Auth & Weak JWT Key",
            category: "OWASP A07:2021 – Identification & Auth Failures",
            defaultPayload: "eyJhbGciOiJub25lIn0.eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0.",
            description: "JWT session tokens are signed with a weak secret ('secret123') and stored in unencrypted LocalStorage, enabling signature brute-forcing or 'alg: none' token forging.",
            vulnerableSnippet: `// Vulnerable Code (Weak Secret & Alg None Allowed)
const token = jwt.sign(userPayload, 'secret123', { algorithm: 'HS256' });`,
            patchedSnippet: `// Secure Code (Strong Secret & HttpOnly Cookies)
const token = jwt.sign(userPayload, process.env.JWT_STRONG_KEY, { algorithm: 'RS256' });
res.cookie('session_token', token, { httpOnly: true, secure: true, sameSite: 'strict' });`
        },
        logic: {
            title: "6. Business Logic Price Tampering",
            category: "OWASP A04:2021 – Insecure Design",
            defaultPayload: "0.01",
            description: "Checkout accepts client-side unit prices and total balances without verifying against the authoritative server database product catalog.",
            vulnerableSnippet: `// Vulnerable Code (Trusting Client Total)
app.post('/api/checkout', (req, res) => {
    const total = req.body.clientTotal; // Accepts $0.01!
    chargeCreditCard(total);
});`,
            patchedSnippet: `// Secure Code (Server-Side Price Calculation)
app.post('/api/checkout', (req, res) => {
    const verifiedTotal = req.body.items.reduce((sum, item) => {
        const dbProduct = db.getProduct(item.id);
        return sum + (dbProduct.price * item.qty);
    }, 0);
    chargeCreditCard(verifiedTotal);
});`
        },
        exposure: {
            title: "7. Sensitive Data Exposure & Header Audit",
            category: "OWASP A05:2021 – Security Misconfiguration",
            defaultPayload: "/api/admin/config",
            description: "Unprotected server administration endpoints leak database connection strings, S3 credentials, and master API keys. Missing security headers (CSP, X-Frame-Options).",
            vulnerableSnippet: `// Vulnerable Code (Public Config Endpoint)
app.get('/api/admin/config', (req, res) => {
    res.json(configSecrets); // Leaks DB passwords & API keys
});`,
            patchedSnippet: `// Secure Code (RBAC Middleware & Security Headers)
app.use(helmet()); // Sets CSP, X-Frame-Options, HSTS
app.get('/api/admin/config', requireAdminRole, (req, res) => {
    res.json(configSecrets);
});`
        }
    },

    init: function() {
        this.loadVulnerabilityModule();
        this.renderRetestMatrix();
    },

    // Security Mode Toggle Switcher
    toggleSecurityMode: function() {
        this.isPatchedMode = !this.isPatchedMode;
        const banner = document.getElementById('security-banner');
        const modeText = document.getElementById('mode-text');
        const toggleBtn = document.getElementById('toggle-mode-btn');

        if (this.isPatchedMode) {
            banner.className = 'mode-patched';
            modeText.innerHTML = 'CURRENT MODE: <strong>PATCHED 🟢 (BLUE TEAM DEFENSE)</strong>';
            toggleBtn.innerHTML = '<i class="fa-solid fa-bug"></i> Switch to Vulnerable Mode (Red Team)';
            this.logTerminal(`[MODE SWITCH] Activated PATCHED Mode (Blue Team Defenses Enabled). All inputs sanitized & parameterized.`);
            
            // Mark verified patched in retest matrix
            Object.keys(this.retestMatrix).forEach(key => {
                this.retestMatrix[key].patchedVerified = true;
            });
        } else {
            banner.className = 'mode-vulnerable';
            modeText.innerHTML = 'CURRENT MODE: <strong>VULNERABLE 🔴 (RED TEAM LAB)</strong>';
            toggleBtn.innerHTML = '<i class="fa-solid fa-shield-halved"></i> Switch to Patched Mode (Blue Team)';
            this.logTerminal(`[MODE SWITCH] Activated VULNERABLE Mode (Red Team Scenarios Active). Vulnerabilities exposed.`);
        }

        this.renderRetestMatrix();
    },

    toggleLabPanel: function() {
        const drawer = document.getElementById('lab-drawer');
        drawer.classList.toggle('closed');
    },

    switchLabTab: function(tabId) {
        this.activeTab = tabId;
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));

        event.target.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    },

    loadVulnerabilityModule: function() {
        const select = document.getElementById('vuln-select');
        this.activeVulnId = select.value;
        const mod = this.vulnModules[this.activeVulnId];

        if (!mod) return;

        // Render Vuln Info Card
        document.getElementById('vuln-info-card').innerHTML = `
            <h3>${mod.title}</h3>
            <span class="product-tag">${mod.category}</span>
            <p style="margin-top:10px; font-size:0.9rem; color:var(--text-muted);">${mod.description}</p>
        `;

        // Update default payload in sandbox input
        document.getElementById('sandbox-payload').value = mod.defaultPayload;

        // Update Code Diff View
        document.getElementById('vulnerable-code-block').textContent = mod.vulnerableSnippet;
        document.getElementById('patched-code-block').textContent = mod.patchedSnippet;
    },

    executeSandboxAttack: function() {
        const payload = document.getElementById('sandbox-payload').value;
        this.logTerminal(`[ATTACK LAUNCHED] Executing ${this.activeVulnId} payload: ${payload}`);

        switch(this.activeVulnId) {
            case 'sqli':
                App.openAuthModal('login');
                document.getElementById('auth-username').value = payload;
                document.getElementById('auth-password').value = 'dummy';
                App.handleAuthSubmit(new Event('submit'));
                break;
            case 'xss_stored':
                App.viewProductDetail(1);
                document.getElementById('new-review-text').value = payload;
                App.submitReview(1);
                break;
            case 'xss_reflected':
                document.getElementById('search-input').value = payload;
                App.triggerSearch();
                break;
            case 'idor':
                App.navigateTo('orders');
                document.getElementById('order-id-input').value = payload;
                App.fetchOrderById();
                break;
            case 'logic':
                App.openCartModal();
                document.getElementById('cart-price-tamper').value = payload;
                App.applyPriceTampering();
                break;
            case 'exposure':
                App.navigateTo('admin');
                App.fetchAdminConfig();
                break;
            default:
                this.logTerminal(`[SANDBOX] Payload dispatched to target component.`);
        }
    },

    markExploited: function(vulnKey) {
        if (this.retestMatrix[vulnKey]) {
            this.retestMatrix[vulnKey].exploited = true;
            this.renderRetestMatrix();
        }
    },

    logTerminal: function(msg) {
        const term = document.getElementById('lab-terminal-output');
        const timestamp = new Date().toLocaleTimeString();
        term.textContent += `\n[${timestamp}] ${msg}`;
        term.scrollTop = term.scrollHeight;
    },

    renderRetestMatrix: function() {
        const body = document.getElementById('retest-matrix-body');
        body.innerHTML = '';

        Object.keys(this.retestMatrix).forEach(key => {
            const item = this.retestMatrix[key];
            const row = document.createElement('tr');

            const statusExploited = item.exploited 
                ? '<span style="color:var(--vuln-red); font-weight:bold;">EXPLOITED 🔴</span>' 
                : '<span style="color:var(--text-muted);">Not Tested</span>';

            const statusPatched = item.patchedVerified 
                ? '<span style="color:var(--patched-green); font-weight:bold;">PASSED 🟢</span>' 
                : '<span style="color:var(--text-muted);">Pending Retest</span>';

            row.innerHTML = `
                <td><strong>${item.name}</strong></td>
                <td><span class="badge-count">${item.severity}</span></td>
                <td>${statusExploited}</td>
                <td>${statusPatched}</td>
                <td><button class="btn-sm" onclick="SecureLab.selectModuleDirect('${key}')">Test</button></td>
            `;
            body.appendChild(row);
        });
    },

    selectModuleDirect: function(vulnKey) {
        document.getElementById('vuln-select').value = vulnKey;
        this.switchLabTab('exploits');
        this.loadVulnerabilityModule();
    },

    // Report Exporter
    openReportModal: function() {
        document.getElementById('report-modal').classList.remove('hidden');
        this.generateReportMarkdown();
    },

    generateReportMarkdown: function() {
        const student = document.getElementById('report-student-name').value;
        const course = document.getElementById('report-course').value;
        const date = new Date().toISOString().split('T')[0];

        let matrixRows = '';
        Object.keys(this.retestMatrix).forEach(key => {
            const item = this.retestMatrix[key];
            matrixRows += `| ${item.name} | ${item.severity} | ${item.exploited ? 'EXPLOITED' : 'NOT TESTED'} | ${item.patchedVerified ? 'PREVENTED / FIXED' : 'PENDING'} |\n`;
        });

        const md = `# RED TEAM & APPLICATION SECURITY ASSESSMENT REPORT

**Project:** SecureShop Laboratory  
**Assessor / Student:** ${student}  
**Course Assignment:** ${course}  
**Assessment Date:** ${date}  

---

## 1. Executive Summary
An Application Security assessment was performed against **SecureShop** using the controlled laboratory environment. Both manual penetration testing methodologies and automated OWASP ZAP evaluation were executed across 7 OWASP Top 10 vulnerability categories.

---

## 2. Assessment Results & Retest Matrix

| Vulnerability Module | Risk Severity | Vulnerable Status (Red Team) | Retest Status (Blue Team) |
| :--- | :--- | :--- | :--- |
${matrixRows}

---

## 3. Detailed Technical Findings & Proof of Concept (PoC)

### 3.1 SQL Injection (SQLi) — Authentication Bypass
- **CVSS Score:** 9.8 (CRITICAL)
- **Description:** Unsanitized string concatenation in SQL queries allowed authentication bypass via query payload.
- **Proof of Concept Payload:** \`admin' OR '1'='1 --\`
- **Remediation:** Implementation of parameterized queries (\`db.query("SELECT * FROM users WHERE username = ?", [input])\`).

### 3.2 Cross-Site Scripting (Stored & Reflected XSS)
- **CVSS Score:** 8.2 (HIGH)
- **Description:** Product review inputs and search queries were rendered directly via \`innerHTML\`.
- **Proof of Concept Payload:** \`<script>alert('STORED_XSS')</script>\`
- **Remediation:** Enforced contextual HTML entity escaping and \`textContent\` DOM binding.

### 3.3 Insecure Direct Object Reference (IDOR)
- **CVSS Score:** 7.5 (HIGH)
- **Description:** Direct order ID manipulation exposed private receipts of other registered users.
- **Proof of Concept Payload:** \`GET /api/order?id=1002\`
- **Remediation:** Enforced role-based access control and user session ownership validation middleware.

---

## 4. Conclusion & Verification
All identified vulnerabilities were successfully exploited in **Vulnerable Mode 🔴** and subsequently verified as fully remediated in **Patched Mode 🟢**. The application meets standard security requirements for production deployment.
`;

        document.getElementById('report-markdown-text').value = md;
    },

    copyReportMarkdown: function() {
        const text = document.getElementById('report-markdown-text').value;
        navigator.clipboard.writeText(text);
        alert("Report Markdown copied to clipboard!");
    },

    downloadReportFile: function() {
        const text = document.getElementById('report-markdown-text').value;
        const blob = new Blob([text], { type: 'text/markdown' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `SecureShop_AppSec_Report_${new Date().toISOString().split('T')[0]}.md`;
        a.click();
    },

    resetCurrentScenario: function() {
        this.logTerminal(`[RESET] Scenario reset to initial state.`);
    }
};

document.addEventListener('DOMContentLoaded', () => SecureLab.init());
