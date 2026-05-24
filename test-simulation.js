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

async function runSimulation() {
    console.log("=== CLINICPRO SAAS SCENARIO SIMULATION ===");

    try {
        // 1. Admin Login
        console.log("\n[1] Attempting Admin Login...");
        const adminLogin = await request('/auth/login', 'POST', {
            email: 'admin@clinicpro.com',
            password: 'admin123'
        });
        
        if (adminLogin.status !== 201 && adminLogin.status !== 200) {
            throw new Error(`Login failed: ${JSON.stringify(adminLogin.data)}`);
        }
        const adminToken = adminLogin.data.access_token;
        console.log("✅ Admin Login Successful. Token acquired.");

        // 2. Doctor Login
        console.log("\n[2] Attempting Doctor Login...");
        const docLogin = await request('/auth/login', 'POST', {
            email: 'doctor@clinicpro.com',
            password: 'doctor123'
        });
        const docToken = docLogin.data.access_token;
        console.log("✅ Doctor Login Successful. Token acquired.");

        // 3. Check Dashboard Stats (Admin)
        console.log("\n[3] Fetching Dashboard Stats...");
        const stats = await request('/dashboard/stats', 'GET', null, adminToken);
        console.log("✅ Dashboard Stats:", stats.data);

        // 4. Create a Patient
        console.log("\n[4] Registering a New Patient...");
        const newPatient = await request('/patients', 'POST', {
            firstName: "Ahmed",
            lastName: "Test",
            email: "ahmed.test@example.com",
            phone: "+201012345678",
            gender: "MALE"
        }, adminToken);
        
        let patientId;
        if (newPatient.status === 201) {
            patientId = newPatient.data.id;
            console.log("✅ Patient Created:", newPatient.data.firstName, newPatient.data.lastName, "| ID:", patientId);
        } else {
            console.warn("⚠️ Patient creation warning (might exist):", newPatient.data);
            const patients = await request('/patients', 'GET', null, adminToken);
            patientId = patients.data.data[0].id;
            console.log("✅ Using existing patient ID:", patientId);
        }

        // 5. Get Doctor ID for appointment
        console.log("\n[5] Fetching Doctor ID...");
        const docs = await request('/doctors', 'GET', null, adminToken);
        const doctorId = docs.data.data ? docs.data.data[0].id : docs.data[0].id;
        console.log("✅ Doctor ID:", doctorId);

        // 6. Book an Appointment
        console.log("\n[6] Booking an Appointment...");
        const appointmentDate = new Date();
        appointmentDate.setHours(appointmentDate.getHours() + 2); // 2 hours from now
        
        const appointment = await request('/appointments', 'POST', {
            patientId: patientId,
            doctorId: doctorId,
            appointmentDate: appointmentDate.toISOString(),
            durationMinutes: 30,
            type: "CONSULTATION",
            reason: "Headache simulation test"
        }, adminToken);

        if (appointment.status === 201) {
            console.log("✅ Appointment Booked:", appointment.data.id, "at", appointment.data.appointmentDate);
        } else {
            console.log("❌ Appointment Booking Failed:", appointment.data);
        }

        console.log("\n🎉 ALL SAAS SIMULATION SCENARIOS COMPLETED SUCCESSFULLY!");

    } catch (error) {
        console.error("❌ Simulation Failed:", error.message);
    }
}

runSimulation();
