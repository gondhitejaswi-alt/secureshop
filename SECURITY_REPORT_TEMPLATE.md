# COLLEGE RED TEAM / APPLICATION SECURITY ASSIGNMENT REPORT

**Project Name:** SecureShop Security Laboratory  
**Course Code:** CS405 / Application Security & Red Team Operations  
**Student Name:** [Your Name / Student ID]  
**Date of Submission:** [Current Date]  
**Target Environment:** Local Security Lab (`http://localhost:8080` & GitHub Pages)  

---

## 1. Executive Summary

During this assignment, an end-to-end Application Security assessment was performed against the **SecureShop** e-commerce web application. The primary objective was to demonstrate the full security lifecycle: **BUILD → EXPOSE → SCAN → INVESTIGATE → SAFELY VALIDATE → FIX → RETEST → REPORT**.

Testing encompassed both manual penetration testing techniques and automated vulnerability scanning using **OWASP ZAP**. Seven distinct vulnerabilities aligned with the **OWASP Top 10 (2021)** framework were identified, successfully exploited in Vulnerable Mode, and subsequently verified as remediated in Patched Mode.

---

## 2. Assessment Summary & Retest Matrix

| Vulnerability ID | Vulnerability Title | OWASP Category | Severity | Initial Status (Red Team) | Retest Status (Blue Team) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **VULN-01** | SQL Injection Authentication Bypass | A03:2021 – Injection | **CRITICAL (9.8)** | EXPLOITED 🔴 | PREVENTED 🟢 |
| **VULN-02** | Stored Cross-Site Scripting (XSS) | A03:2021 – Injection | **HIGH (8.2)** | EXPLOITED 🔴 | PREVENTED 🟢 |
| **VULN-03** | Reflected & DOM XSS | A03:2021 – Injection | **HIGH (7.5)** | EXPLOITED 🔴 | PREVENTED 🟢 |
| **VULN-04** | Insecure Direct Object Reference (IDOR) | A01:2021 – Access Control | **HIGH (7.5)** | EXPLOITED 🔴 | PREVENTED 🟢 |
| **VULN-05** | Weak JWT Signing Secret Key | A07:2021 – Auth Failure | **HIGH (7.1)** | EXPLOITED 🔴 | PREVENTED 🟢 |
| **VULN-06** | Business Logic Price Manipulation | A04:2021 – Insecure Design | **MEDIUM (6.5)** | EXPLOITED 🔴 | PREVENTED 🟢 |
| **VULN-07** | Sensitive Config & Data Exposure | A05:2021 – Misconfiguration | **HIGH (7.5)** | EXPLOITED 🔴 | PREVENTED 🟢 |

---

## 3. Detailed Vulnerability Findings & Proof of Concepts (PoC)

### VULN-01: SQL Injection (SQLi) in Login Authentication
- **Affected Endpoint:** `POST /api/login` & Login Modal
- **Risk Rating:** CRITICAL (CVSS v3.1: 9.8)
- **Vulnerability Description:** User inputs were directly concatenated into backend SQL queries without parameterization or escaping.
- **Proof of Concept Payload:**
  ```sql
  admin' OR '1'='1 --
  ```
- **Exploit Impact:** An unauthenticated user can bypass login authentication and gain full administrator privileges.
- **Remediation Code Diff:**
  ```javascript
  // VULNERABLE CODE:
  const query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  
  // PATCHED CODE:
  const query = "SELECT * FROM users WHERE username = ? AND password = ?";
  db.query(query, [username, password]);
  ```

---

### VULN-02: Stored Cross-Site Scripting (XSS) in Product Reviews
- **Affected Endpoint:** `POST /api/reviews` & Product Detail View
- **Risk Rating:** HIGH (CVSS v3.1: 8.2)
- **Vulnerability Description:** Product review submission fields stored raw HTML strings in the database, which were subsequently rendered into victim DOMs via `innerHTML`.
- **Proof of Concept Payload:**
  ```html
  <script>alert('STORED_XSS_SESSION_STOLEN')</script>
  ```
- **Exploit Impact:** Session token hijacking, keylogging, and website defacement.
- **Remediation Code Diff:**
  ```javascript
  // VULNERABLE CODE:
  reviewElement.innerHTML = review.text;
  
  // PATCHED CODE:
  reviewElement.textContent = review.text;
  ```

---

### VULN-03: Insecure Direct Object Reference (IDOR) on Order Receipts
- **Affected Endpoint:** `GET /api/order?id={orderId}`
- **Risk Rating:** HIGH (CVSS v3.1: 7.5)
- **Vulnerability Description:** Order lookup parameters were fetched directly from query parameters without verifying if the requesting user owned the target order.
- **Proof of Concept:**
  Changing `id=1001` (User A) to `id=1002` (User B) exposed User B's credit card digits and shipping address.
- **Remediation Code Diff:**
  ```javascript
  // PATCHED CODE:
  if (order.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Access Denied" });
  }
  ```

---

## 4. Automated Vulnerability Scanning (OWASP ZAP Results)

An automated active scan was executed using **OWASP ZAP 2.15.0** targeting `http://localhost:8080`. The tool confirmed:
1. SQL Injection vulnerability on login endpoints.
2. Cross-Site Scripting (XSS) reflections on search parameters.
3. Absence of Content Security Policy (CSP) and `X-Frame-Options` headers.

---

## 5. Conclusion & Verification

All 7 security flaws were successfully exploited in Red Team mode, demonstrated, and verified as remediated in Blue Team mode. The **SecureShop** project fulfills all requirements for the Red Team / Application Security assignment.
