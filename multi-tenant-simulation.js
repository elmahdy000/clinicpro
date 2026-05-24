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
            headers: {
                'Content-Type': 'application/json',
            }
        };
        
        if (token) options.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    resolve({ status: res.statusCode, data: json });
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

function expectStatus(res, expectedStatus, message) {
    if (res.status !== expectedStatus) {
        console.error(`❌ FAILED: ${message}. Expected ${expectedStatus}, got ${res.status}`);
        console.error(res.data);
        return false;
    }
    console.log(`✅ SUCCESS: ${message}`);
    return true;
}

async function runSaaSSimulation() {
    console.log("=========================================");
    console.log("🏥 CLINICPRO SAAS: MULTI-TENANT SIMULATION");
    console.log("=========================================\n");

    try {
        // --- 1. REGISTER CLINIC A ---
        console.log("--- 1. REGISTER CLINIC A ---");
        const emailA = `adminA_${Date.now()}@clinicA.com`;
        const clinicA = await request('/auth/register-clinic', 'POST', {
            clinicName: "Elite Dental Clinic",
            email: emailA,
            password: "password123",
            name: "Dr. Ahmed Elite"
        });
        expectStatus(clinicA, 201, "Register Clinic A");

        // Login Clinic A
        const loginA = await request('/auth/login', 'POST', { email: emailA, password: 'password123' });
        if (loginA.status !== 201 && loginA.status !== 200) console.error('Login A failed:', loginA.data);
        const tokenA = loginA.data.access_token;


        // --- 2. REGISTER CLINIC B ---
        console.log("\n--- 2. REGISTER CLINIC B ---");
        const emailB = `adminB_${Date.now()}@clinicB.com`;
        const clinicB = await request('/auth/register-clinic', 'POST', {
            clinicName: "Smile Care Center",
            email: emailB,
            password: "password123",
            name: "Dr. Sarah Smile"
        });
        expectStatus(clinicB, 201, "Register Clinic B");

        // Login Clinic B
        const loginB = await request('/auth/login', 'POST', { email: emailB, password: 'password123' });
        if (loginB.status !== 201 && loginB.status !== 200) console.error('Login B failed:', loginB.data);
        const tokenB = loginB.data.access_token;


        // --- 3. PATIENTS IN CLINIC A ---
        console.log("\n--- 3. ADD PATIENTS TO CLINIC A ---");
        const sharedPhone = `+2010${Math.floor(Math.random() * 10000000)}`;
        const createPatA = await request('/patients', 'POST', {
            firstName: "Sami",
            lastName: "Ali",
            phone: sharedPhone,
            email: `sami_${Date.now()}@test.com`,
            gender: "MALE"
        }, tokenA);
        expectStatus(createPatA, 201, "Create Patient Sami in Clinic A");

        // --- 4. PATIENTS IN CLINIC B (SAME PATIENT) ---
        console.log("\n--- 4. ADD SAME PATIENT TO CLINIC B ---");
        const createPatB = await request('/patients', 'POST', {
            firstName: "Sami",
            lastName: "Ali (Updated by B)",
            phone: sharedPhone,
            email: `sami_${Date.now()}@test.com`,
        }, tokenB);
        expectStatus(createPatB, 201, "Create/Link Patient Sami in Clinic B");

        // --- 5. VERIFY EMR LOGIC ---
        console.log("\n--- 5. VERIFYING GLOBAL EMR LOGIC ---");
        
        if (createPatA.data.id === createPatB.data.id) {
            console.log("✅ SUCCESS: Clinic B linked to the EXACT SAME Patient ID instead of creating a duplicate!");
        } else {
            console.error(`❌ FAILED: Duplicate patients created! ID A: ${createPatA.data.id}, ID B: ${createPatB.data.id}`);
        }

        const patientsA = await request('/patients', 'GET', null, tokenA);
        const patientsB = await request('/patients', 'GET', null, tokenB);

        if (patientsA.data.data.length > 0) console.log("✅ SUCCESS: Clinic A can see the patient in its list.");
        if (patientsB.data.data.length > 0) console.log("✅ SUCCESS: Clinic B can see the patient in its list.");

        // --- 6. GLOBAL SEARCH TEST ---
        console.log("\n--- 6. GLOBAL SEARCH TEST ---");
        const searchRes = await request(`/patients/global-search?query=${encodeURIComponent(sharedPhone)}`, 'GET', null, tokenA);
        if (searchRes.data.length === 1 && searchRes.data[0].clinics) {
            console.log(`✅ SUCCESS: Global Search found 1 patient. Linked to ${searchRes.data[0].clinics.length} clinics!`);
        } else {
            console.error("❌ FAILED: Global Search did not return expected clinics array. Received:", JSON.stringify(searchRes.data, null, 2));
        }

        console.log("\n=========================================");
        console.log("🏁 MULTI-TENANT EMR SIMULATION COMPLETE!");
        console.log("=========================================\n");

    } catch (error) {
        console.error("\n❌ SIMULATION CRASHED:", error.message);
    }
}

runSaaSSimulation();
