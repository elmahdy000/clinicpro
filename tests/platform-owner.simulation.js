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
    console.log("\n👑 [SCENARIO]: PLATFORM OWNER / SaaS ADMIN");
    console.log("--------------------------------------------------");
    try {
        // 1. Authenticate Platform Owner
        const login = await request('/auth/login', 'POST', {
            email: 'owner@clinicpro.com',
            password: 'owner123'
        });
        if (login.status !== 200 && login.status !== 201) {
            console.error("❌ Failed to log in as Platform Owner. Status:", login.status);
            return false;
        }
        const token = login.data.access_token;
        console.log("✅ Authenticated successfully as Platform Owner.");

        // 2. Fetch Global Dashboard Statistics
        const stats = await request('/dashboard/stats', 'GET', null, token);
        if (stats.status === 200) {
            console.log(`✅ Fetched Global SaaS Stats (Total Clinics: ${stats.data.clinicsCount}, Total Patients: ${stats.data.totalPatients || stats.data.patients})`);
        } else {
            console.error("❌ Failed to fetch Global SaaS Stats. Status:", stats.status);
            return false;
        }

        // 3. Fetch List of Registered Clinics
        const clinics = await request('/clinics', 'GET', null, token);
        if (clinics.status === 200) {
            const list = clinics.data.data || clinics.data;
            console.log(`✅ Fetched Registered Clinics List successfully (Found: ${list.length} clinics)`);
            list.forEach(c => {
                console.log(`   - 🏥 ${c.name} | Plan: ${c.subscriptionPlan} | Status: ${c.subscriptionStatus}`);
            });
        } else {
            console.error("❌ Failed to fetch clinics list. Status:", clinics.status);
            return false;
        }

        // 4. Fetch Platform Pharma Insights
        const pharma = await request('/dashboard/pharma-insights', 'GET', null, token);
        if (pharma.status === 200) {
            console.log("✅ Fetched Global Pharma analytics & Top Medications successfully.");
        } else {
            console.error("❌ Failed to fetch global pharma insights. Status:", pharma.status);
            return false;
        }

        console.log("🎉 PLATFORM OWNER SIMULATION COMPLETED SUCCESSFULLY!");
        return true;
    } catch (err) {
        console.error("❌ Simulation crashed:", err.message);
        return false;
    }
}

// Support running directly
if (require.main === module) run();

module.exports = { run };
