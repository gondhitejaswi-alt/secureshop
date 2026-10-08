/* 
  SecureShop — Local Node.js Express Server
  Runs on http://localhost:8080 for OWASP ZAP & Local Security Testing
*/

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(__dirname));

// Simulated Database Records
const DB = {
    users: [
        { id: 100, username: 'admin', password: 'AdminSecret2026!', role: 'admin' },
        { id: 101, username: 'john_cyber', password: 'cyberpass123', role: 'customer' }
    ],
    orders: [
        { id: 1001, userId: 101, customer: "John Cyber", item: "Quantum Cipher Laptop", total: 1499.99, card: "****-4921" },
        { id: 1002, userId: 102, customer: "Alice Sec (PRIVATE)", item: "Encrypted Hardware Key", total: 158.00, card: "****-8812" }
    ],
    config: {
        db_string: "Server=127.0.0.1;Database=secureshop_db;Uid=root;Pwd=SuperSecretAdminPassword2026!;",
        jwt_secret: "secret123",
        aws_key: "AKIAIOSFODNN7EXAMPLE"
    }
};

// 1. SQL Injection Endpoint Target for ZAP Scan
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    // Vulnerable SQLi Logic Simulation
    if (username && (username.includes("' OR '1'='1") || username.includes("' OR 1=1"))) {
        return res.json({ success: true, message: "SQL Injection Authentication Bypass Successful!", user: DB.users[0] });
    }

    const user = DB.users.find(u => u.username === username && u.password === password);
    if (user) {
        return res.json({ success: true, message: "Login successful", user });
    }
    return res.status(401).json({ success: false, error: "Invalid credentials" });
});

// 2. Reflected XSS Endpoint Target
app.get('/api/search', (req, res) => {
    const query = req.query.q || '';
    // Intentionally unescaped reflection in API response header and body
    res.setHeader('X-Search-Term', query);
    res.send(`<html><body><h1>Search Results for: ${query}</h1></body></html>`);
});

// 3. IDOR Order Lookup Endpoint
app.get('/api/order', (req, res) => {
    const id = parseInt(req.query.id);
    const order = DB.orders.find(o => o.id === id);

    if (!order) {
        return res.status(404).json({ error: "Order not found" });
    }
    // Vulnerable: Returns private order without authentication verification!
    return res.json(order);
});

// 4. Sensitive Config Leak Endpoint
app.get('/api/admin/config', (req, res) => {
    return res.json(DB.config);
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(` 🛡️  SecureShop Local Security Lab running on:`);
    console.log(` 🌐  http://localhost:${PORT}`);
    console.log(` 🌐  http://127.0.0.1:${PORT}`);
    console.log(` 🎯  Ready for OWASP ZAP & Red Team College Lab Scans!`);
    console.log(`=======================================================`);
});
