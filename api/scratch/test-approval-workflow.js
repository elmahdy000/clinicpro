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

async function verifyApprovalWorkflow() {
    console.log("====================================================");
    console.log("🔐 CLINICPRO: VERIFYING CLINIC APPROVAL WORKFLOW");
    console.log("====================================================\n");

    try {
        // 1. Admin Login to manage clinics
        console.log("--- 1. Login as Platform Owner (Admin) ---");
        const adminLogin = await request('/auth/login', 'POST', {
            email: 'owner@clinicpro.com',
            password: 'owner123'
        });
        if (adminLogin.status !== 200 && adminLogin.status !== 201) {
            throw new Error(`Admin Login failed: ${JSON.stringify(adminLogin.data)}`);
        }
        const adminToken = adminLogin.data.access_token;
        console.log("✅ Admin Login successful.\n");

        // 2. Register new clinic
        console.log("--- 2. Registering a New Clinic ---");
        const clinicEmail = `newclinic_${Date.now()}@test.com`;
        const registerRes = await request('/auth/register-clinic', 'POST', {
            clinicName: "Grand Central Clinic",
            email: clinicEmail,
            password: "password123",
            name: "Dr. Robert Carter"
        });

        if (registerRes.status !== 201) {
            throw new Error(`Clinic registration failed: ${JSON.stringify(registerRes.data)}`);
        }
        
        const clinicId = registerRes.data.clinicId;
        console.log(`✅ Clinic Registered Successfully. ID: ${clinicId}`);

        // 3. Fetch newly registered clinic details & verify status is PENDING
        console.log("\n--- 3. Verifying Clinic is Gated with PENDING Status ---");
        const clinicSettings = await request(`/clinics/${clinicId}/settings`, 'GET', null, adminToken);
        
        if (clinicSettings.status !== 200) {
            throw new Error(`Failed to fetch clinic settings: ${JSON.stringify(clinicSettings.data)}`);
        }

        const initialStatus = clinicSettings.data.subscriptionStatus;
        console.log(`Status retrieved: ${initialStatus}`);
        
        if (initialStatus === 'PENDING') {
            console.log("✅ SUCCESS: Newly registered clinic has 'PENDING' status by default!");
        } else {
            console.error(`❌ FAILURE: Expected status 'PENDING', but got '${initialStatus}'`);
            process.exit(1);
        }

        // 4. Platform Owner approves and activates the clinic
        console.log("\n--- 4. Platform Owner Approving & Activating Clinic ---");
        const updateRes = await request(`/clinics/${clinicId}`, 'PUT', {
            subscriptionStatus: 'ACTIVE'
        }, adminToken);

        if (updateRes.status !== 200) {
            throw new Error(`Failed to update clinic status: ${JSON.stringify(updateRes.data)}`);
        }

        const updatedStatus = updateRes.data.subscriptionStatus;
        console.log(`Updated Status retrieved: ${updatedStatus}`);

        if (updatedStatus === 'ACTIVE') {
            console.log("✅ SUCCESS: Platform Owner successfully approved the clinic to 'ACTIVE'!");
        } else {
            console.error(`❌ FAILURE: Expected status 'ACTIVE', but got '${updatedStatus}'`);
            process.exit(1);
        }

        console.log("\n====================================================");
        console.log("🏁 CLINIC APPROVAL WORKFLOW VERIFICATION PASSED!");
        console.log("====================================================\n");

    } catch (error) {
        console.error("❌ Test Script Failed:", error.message);
    }
}

verifyApprovalWorkflow();
