/* 
  SecureShop — Mock Database & Vulnerable/Patched Query Simulator Engine
*/

window.MockDB = {
    // Initial Database Products
    products: [
        {
            id: 1,
            title: "Quantum Cipher Laptop Pro",
            category: "hardware",
            price: 1499.99,
            rating: 4.9,
            icon: "fa-laptop-code",
            description: "Military-grade encrypted workstation powered by 16-Core Quantum processor and isolated memory enclaves.",
            reviews: [
                { id: 101, user: "AliceSec", text: "Incredible hardware security, super fast build quality!", rating: 5, date: "2026-09-12" },
                { id: 102, user: "RedHacker", text: "Great performance for local penetration testing labs.", rating: 5, date: "2026-09-20" }
            ]
        },
        {
            id: 2,
            title: "Stealth Router AX9000",
            category: "network",
            price: 299.50,
            rating: 4.7,
            icon: "fa-wifi",
            description: "Enterprise VPN router with automatic DNS leak prevention and built-in packet inspection firewalls.",
            reviews: [
                { id: 103, user: "NetAdmin", text: "Easy setup, solid signal range across the campus.", rating: 4, date: "2026-09-15" }
            ]
        },
        {
            id: 3,
            title: "YubiVault Cyber Hardware Key",
            category: "keys",
            price: 79.00,
            rating: 5.0,
            icon: "fa-key",
            description: "FIDO2 & U2F Hardware authentication key for zero-trust passwordless authentication.",
            reviews: [
                { id: 104, user: "SecOps", text: "Must-have security hardware for multi-factor authentication.", rating: 5, date: "2026-09-18" }
            ]
        },
        {
            id: 4,
            title: "Neural Packet Sniffer USB",
            category: "hardware",
            price: 125.00,
            rating: 4.6,
            icon: "fa-usb",
            description: "SDR & Wireless packet capture key supporting 802.11ax traffic analysis.",
            reviews: []
        },
        {
            id: 5,
            title: "Encrypted Hardware Vault SSD (2TB)",
            category: "hardware",
            price: 249.99,
            rating: 4.8,
            icon: "fa-hard-drive",
            description: "Self-encrypting AES-256 NVMe drive with PIN keypad access and self-destruct trigger.",
            reviews: []
        },
        {
            id: 6,
            title: "Cipher Core Defense Gateway",
            category: "network",
            price: 899.00,
            rating: 4.9,
            icon: "fa-shield-halved",
            description: "High-speed hardware firewall appliance for small lab setups and homelabs.",
            reviews: []
        }
    ],

    // User Accounts
    users: [
        { id: 100, username: "admin", email: "admin@secureshop.local", passwordHash: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8", role: "admin", bio: "System Administrator & Security Lead." },
        { id: 101, username: "john_cyber", email: "john@cybersec.local", passwordHash: "04f8996da763b7a969b1028ee3007569eaf3a635486ddab211d512c85b9df8fb", role: "customer", bio: "Cybersecurity Student & Red Team Enthusiast." },
        { id: 102, username: "alice_sec", email: "alice@security.org", passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", role: "customer", bio: "AppSec Researcher & Bug Hunter." }
    ],

    // Orders Database (IDOR Target)
    orders: [
        {
            id: 1001,
            userId: 101,
            customerName: "John Cyber",
            shippingAddress: "42 Cyber Lane, Tech City, USA",
            items: [{ title: "Quantum Cipher Laptop Pro", qty: 1, price: 1499.99 }],
            total: 1499.99,
            creditCard: "****-****-****-4921",
            status: "Shipped",
            date: "2026-10-01"
        },
        {
            id: 1002,
            userId: 102,
            customerName: "Alice Sec",
            shippingAddress: "99 Secret Research Way, Area 51, NV",
            items: [{ title: "YubiVault Cyber Hardware Key", qty: 2, price: 79.00 }],
            total: 158.00,
            creditCard: "****-****-****-8812",
            status: "Delivered (PRIVATE CONFIDENTIAL)",
            date: "2026-10-04"
        },
        {
            id: 1003,
            userId: 100,
            customerName: "Admin User",
            shippingAddress: "Server Room B1, HQ Operations",
            items: [{ title: "Cipher Core Defense Gateway", qty: 1, price: 899.00 }],
            total: 899.00,
            creditCard: "****-****-****-0001",
            status: "Processing (CLASSIFIED ORDER)",
            date: "2026-10-07"
        }
    ],

    // Sensitive Admin Configuration (Sensitive Data Exposure)
    adminConfig: {
        environment: "development_lab",
        db_type: "sqlite3_local",
        db_connection_string: "Server=127.0.0.1;Database=secureshop_db;Uid=root;Pwd=SuperSecretAdminPassword2026!;",
        jwt_secret_key: "secret123",
        jwt_algorithm: "HS256",
        aws_s3_bucket: "secureshop-backup-vault-unrestricted",
        aws_access_key_id: "AKIAIOSFODNN7EXAMPLE",
        aws_secret_access_key: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
    },

    // Simulated SQL Query Authentication Logic
    authenticateUser: function(usernameInput, passwordInput, isPatchedMode) {
        if (!isPatchedMode) {
            // VULNERABLE SQL INJECTION SIMULATOR
            // Simulates raw concatenated query: "SELECT * FROM users WHERE username = '" + usernameInput + "' AND password = '" + passwordInput + "'"
            const rawQuery = `SELECT * FROM users WHERE username = '${usernameInput}' AND password = '${passwordInput}'`;
            
            // Check for SQLi bypass patterns
            const sqliPattern = /'| OR | OR '1'='1| OR 1=1|--|#/i;
            if (sqliPattern.test(usernameInput) || sqliPattern.test(passwordInput)) {
                // SQL Injection Succeeded! Returns the first user in DB (admin)
                return {
                    success: true,
                    user: this.users[0],
                    sqliTriggered: true,
                    executedQuery: rawQuery
                };
            }

            // Normal string match if no SQLi bypass used
            const foundUser = this.users.find(u => u.username === usernameInput);
            if (foundUser) {
                return { success: true, user: foundUser, sqliTriggered: false, executedQuery: rawQuery };
            }
            return { success: false, error: "Invalid username or password", executedQuery: rawQuery };
        } else {
            // PATCHED SECURE PARAMETERIZED QUERY
            const safeQuery = "SELECT * FROM users WHERE username = ? AND password = ?";
            // Strict sanitization & lookup
            const cleanUser = String(usernameInput).replace(/['";--]/g, "");
            const foundUser = this.users.find(u => u.username === cleanUser);
            if (foundUser) {
                return { success: true, user: foundUser, sqliTriggered: false, executedQuery: safeQuery };
            }
            return { success: false, error: "Invalid username or password", executedQuery: safeQuery };
        }
    }
};
