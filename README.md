# SecureShop — Build → Attack → Identify → Fix → Retest 🛡️💻

[![GitHub Pages Deployment](https://img.shields.io/badge/GitHub%20Pages-Ready-brightgreen?logo=github)](https://pages.github.com/)
[![OWASP Top 10](https://img.shields.io/badge/OWASP-Top%2010%20Lab-blue?logo=owasp)](https://owasp.org/www-project-top-ten/)
[![Node.js Express Server](https://img.shields.io/badge/Node.js-v18%2B-green?logo=nodedotjs)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**SecureShop** is a modern, vibrant, fully functional fictional e-commerce web application and controlled Application Security / Red Team training laboratory built for college assignments, vulnerability scanning (OWASP ZAP), and interactive exploitation demonstrations.

---

## 🚀 Key Highlights & Dual Execution Modes

1. **GitHub Pages Ready (Instant Live Web App)**  
   Can be hosted directly on GitHub Pages without any backend server required! Features an interactive client-side security sandbox, Red Team exploit console, line-by-line code diff inspector, and dynamic **Vulnerable 🔴 vs Patched 🟢 Mode Toggle** for immediate retesting.

2. **Local Node.js Express Server (`http://localhost:8080`)**  
   Includes a built-in Node.js / Express backend suitable for local security testing with **OWASP ZAP**, **Burp Suite**, or `curl`.

3. **Complete Security Lifecycle**:  
   **BUILD → EXPOSE → SCAN → INVESTIGATE → SAFELY VALIDATE → FIX → RETEST → REPORT**

---

## 🧪 OWASP Vulnerability Modules Demonstrated

| # | Vulnerability Category | OWASP Top 10 | Target Feature | Proof of Concept Payload |
|---|---|---|---|---|
| **1** | **SQL Injection (SQLi)** | A03:2021 – Injection | Login Screen Bypass | `admin' OR '1'='1 --` |
| **2** | **Stored XSS** | A03:2021 – Injection | Product Reviews | `<script>alert('STORED_XSS')</script>` |
| **3** | **Reflected & DOM XSS** | A03:2021 – Injection | Search Bar & Profile Bio | `<img src=x onerror=alert('DOM_XSS')>` |
| **4** | **IDOR (Direct Reference)** | A01:2021 – Access Control | Receipt Lookup (`/api/order`) | Change Order ID `1001` → `1002` |
| **5** | **Broken Auth & JWT Flaws** | A07:2021 – Identification | Session Token Storage | Alg `none` / Weak Key `"secret123"` |
| **6** | **Business Logic Flaw** | A04:2021 – Insecure Design | Checkout Cart Price | Tamper unit price payload to `$0.01` |
| **7** | **Sensitive Config Exposure** | A05:2021 – Misconfiguration | `/api/admin/config` | Direct GET to inspect DB secrets |

---

## ⚡ Quick Start & Local Execution

### Option A: Local Node.js Server (Recommended for OWASP ZAP Scanning)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/secureshop.git
   cd secureshop
   ```

2. **Install dependencies & start server**:
   ```bash
   npm install
   npm start
   ```

3. **Access the application in your browser**:
   - `http://localhost:8080`
   - `http://127.0.0.1:8080`

---

## 🌐 Hosting on GitHub Pages

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of SecureShop AppSec Lab"
   git remote add origin https://github.com/<your-username>/secureshop.git
   git branch -M main
   git push -u origin main
   ```

2. Enable **GitHub Pages**:
   - Go to your repository on GitHub -> **Settings** -> **Pages**.
   - Under **Source**, select **GitHub Actions** (or `main` branch `/ (root)`).
   - Your live URL will be active at: `https://<your-username>.github.io/secureshop/`

---

## 🎯 OWASP ZAP Scanning Walkthrough (College Assignment Steps)

1. Open **OWASP ZAP** (Zed Attack Proxy).
2. Start the local server: `npm start` (running on `http://localhost:8080`).
3. In OWASP ZAP, choose **Automated Scan**.
4. Enter the URL: `http://localhost:8080` and click **Attack**.
5. Observe ZAP findings in the Alert tab:
   - **SQL Injection** on `/api/login`
   - **Cross-Site Scripting (Reflected)** on `/api/search?q=`
   - **Sensitive Information Disclosure** on `/api/admin/config`
   - **Missing Anti-clickjacking / Security Headers**
6. Generate ZAP HTML / PDF Executive Report to accompany your assignment.

---

## 🔄 Retesting & Verifying Fixes (Vulnerable 🔴 vs Patched 🟢 Mode)

1. In the top navigation bar, click the **Switch to Patched Mode (Blue Team)** button.
2. The indicator turns **GREEN 🟢**.
3. Execute the exact same attack payloads (SQLi bypass, XSS tags, IDOR lookup, Price tampering).
4. Observe how defenses (parameterized DB queries, context-aware HTML escaping, rigid authorization checks, server-side price validation) block the attacks.
5. Open the **Retest Matrix** tab in the Red Team Console to view test status and export your final report.

---

## 📄 College Assignment Submission Checklist

- [x] Functional E-Commerce Web Application built and running locally (`http://localhost:8080`).
- [x] OWASP Top 10 vulnerabilities exposed & documented with PoCs.
- [x] OWASP ZAP automated security scan completed.
- [x] Code line-by-line inspection performed.
- [x] Defenses applied and retested in Patched Mode.
- [x] Final Red Team Security Assessment Report generated (via built-in Report Exporter or `SECURITY_REPORT_TEMPLATE.md`).

---

## 📜 License & Usage Notice

This project is created strictly for **Educational, College Assignment, and Authorized Application Security Training** purposes. Do not use payloads or techniques on unauthorized systems.
