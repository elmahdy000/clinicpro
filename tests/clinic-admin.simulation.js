const http = require('http');

const BASE_URL = 'http://localhost:3000/api';

async function request(path, method = 'GET', data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(BASE_URL + path);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method: method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (token) options.headers['Authorization'] = `Bearer ${token}`;
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function run() {
    console.log("\n🏢 [SCENARIO]: CLINIC ADMINISTRATOR");
    console.log("--------------------------------------------------");
    try {
        // 1. Authenticate Clinic Admin
        const login = await request('/auth/login', 'POST', {
            email: 'sarah_admin@clinicpro.com',
            password: 'admin123'
        });
        if (login.status !== 200 && login.status !== 201) {
            console.error("❌ Failed to log in as Clinic Admin. Status:", login.status);
            return false;
        }
        const token = login.data.access_token;
        console.log("✅ Authenticated successfully as Clinic Admin (Clinic 2 - Pediatrics).");

        // 2. Fetch Clinic Dashboard Statistics
        const stats = await request('/dashboard/stats', 'GET', null, token);
        if (stats.status === 200) {
            console.log(`✅ Fetched Clinic Dashboard Stats successfully (Revenue: ${stats.data.revenue?.total || 0} EGP | Patients: ${stats.data.totalPatients || stats.data.patients || 0})`);
        } else {
            console.error("❌ Failed to fetch Clinic Dashboard Stats. Status:", stats.status);
            return false;
        }

        // 3. Register a New Patient
        const phone = `+2012${Math.floor(10000000 + Math.random() * 90000000)}`;
        const patientData = {
            firstName: "عمر",
            lastName: "مصطفى شاكر",
            email: `omar_${Date.now()}@gmail.com`,
            phone: phone,
            gender: "Male"
        };
        const patient = await request('/patients', 'POST', patientData, token);
        let patientId;
        if (patient.status === 201) {
            patientId = patient.data.id;
            console.log(`✅ Registered new Patient: "${patient.data.firstName} ${patient.data.lastName}" | ID: ${patientId}`);
        } else {
            console.error("❌ Failed to register new patient. Status:", patient.status, patient.data);
            return false;
        }

        // 4. Check Clinic Inventory
        const inventory = await request('/inventory', 'GET', null, token);
        if (inventory.status === 200) {
            const list = inventory.data.data || inventory.data;
            console.log(`✅ Fetched Clinic Medication Inventory successfully (Found: ${list.length || 0} drugs)`);
            if (list.length > 0) {
                console.log(`   - 💊 Sample stock: "${list[0].medication?.name || 'Drug'}" | Qty: ${list[0].quantity} | Expiry: ${list[0].expiryDate ? list[0].expiryDate.split('T')[0] : 'N/A'}`);
            }
        } else {
            console.error("❌ Failed to fetch inventory list. Status:", inventory.status);
            return false;
        }

        console.log("🎉 CLINIC ADMINISTRATOR SIMULATION COMPLETED SUCCESSFULLY!");
        return true;
    } catch (err) {
        console.error("❌ Simulation crashed:", err.message);
        return false;
    }
}

// Support running directly
if (require.main === module) run();

module.exports = { run };
