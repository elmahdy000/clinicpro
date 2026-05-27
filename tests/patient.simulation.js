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
    console.log("\n👤 [SCENARIO]: PATIENT PORTAL");
    console.log("--------------------------------------------------");
    try {
        const phoneNum = '01211111111'; // Pre-seeded clinic patient Ahmed Ali
        
        // 1. Patient Registration (Or login if already exists)
        console.log(`[1] Registering Portal Account for phone: ${phoneNum}...`);
        const register = await request('/auth/patient-register', 'POST', {
            phone: phoneNum,
            name: "أحمد علي عبد الله",
            password: "patient123"
        });

        let token;
        if (register.status === 201 || register.status === 200) {
            token = register.data.access_token;
            console.log("✅ Registered Portal Account successfully.");
        } else if (register.status === 409 || register.status === 400) {
            // Already registered, attempt login
            console.log("ℹ️ Account already registered. Attempting Portal Login...");
            const login = await request('/auth/patient-login', 'POST', {
                phone: phoneNum,
                password: "patient123"
            });
            if (login.status === 200 || login.status === 201) {
                token = login.data.access_token;
                console.log("✅ Logged in successfully to Patient Portal.");
            } else {
                console.error("❌ Failed to log in. Status:", login.status, login.data);
                return false;
            }
        } else {
            console.error("❌ Failed to register or login. Status:", register.status, register.data);
            return false;
        }

        // 2. Fetch Patient Portal Dashboard
        const dashboard = await request('/patient-portal/dashboard', 'GET', null, token);
        if (dashboard.status === 200) {
            console.log(`✅ Fetched Patient Personal Dashboard successfully.`);
            console.log(`   - 📈 Vital Stats trend count: ${dashboard.data.vitalsTrend?.length || 0}`);
            console.log(`   - 📅 Upcoming appointments: ${dashboard.data.upcomingAppointments?.length || 0}`);
        } else {
            console.error("❌ Failed to fetch patient dashboard. Status:", dashboard.status);
            return false;
        }

        // 3. Fetch Patient EMR Records
        const emr = await request('/patient-portal/medical-records', 'GET', null, token);
        if (emr.status === 200) {
            console.log(`✅ Fetched personal Medical History successfully (Visits count: ${emr.data?.length || 0})`);
        } else {
            console.error("❌ Failed to fetch EMR history. Status:", emr.status);
            return false;
        }

        // 4. Fetch e-Prescriptions
        const rx = await request('/patient-portal/prescriptions', 'GET', null, token);
        if (rx.status === 200) {
            console.log(`✅ Fetched personal e-Prescriptions successfully (Total: ${rx.data?.length || 0})`);
        } else {
            console.error("❌ Failed to fetch prescriptions. Status:", rx.status);
            return false;
        }

        console.log("🎉 PATIENT PORTAL SIMULATION COMPLETED SUCCESSFULLY!");
        return true;
    } catch (err) {
        console.error("❌ Simulation crashed:", err.message);
        return false;
    }
}

// Support running directly
if (require.main === module) run();

module.exports = { run };
