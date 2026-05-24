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

async function runSimulation() {
    console.log("=========================================");
    console.log("🏥 CLINICPRO SAAS: FULL SCENARIO TESTING");
    console.log("=========================================\n");

    try {
        // --- AUTHENTICATION ---
        console.log("--- 1. AUTHENTICATION & USERS ---");
        
        // Login Admin
        let adminToken;
        const adminLogin = await request('/auth/login', 'POST', { email: 'admin@clinicpro.com', password: 'admin123' });
        if (expectStatus(adminLogin, 201, "Admin Login")) adminToken = adminLogin.data.access_token;

        // Register New Patient User
        const randomEmail = `patient${Date.now()}@test.com`;
        const registerPatient = await request('/auth/register', 'POST', {
            email: randomEmail,
            password: 'password123',
            name: 'New Test Patient',
            role: 'PATIENT'
        });
        expectStatus(registerPatient, 201, "Register New Patient User");

        // Login New Patient
        let patientToken;
        const patientLogin = await request('/auth/login', 'POST', { email: randomEmail, password: 'password123' });
        if (expectStatus(patientLogin, 201, "New Patient Login")) patientToken = patientLogin.data.access_token;


        // --- DOCTORS CRUD ---
        console.log("\n--- 2. DOCTOR CRUD ---");
        
        // Get Doctors List
        const docsList = await request('/doctors', 'GET', null, adminToken);
        expectStatus(docsList, 200, "Fetch Doctors List");
        const doctorId = docsList.data.data ? docsList.data.data[0].id : docsList.data[0].id;
        
        // Read Doctor Details
        const docDetails = await request(`/doctors/${doctorId}`, 'GET', null, adminToken);
        expectStatus(docDetails, 200, "Read Doctor Details");

        // Update Doctor
        const docUpdate = await request(`/doctors/${doctorId}`, 'PUT', { consultationFee: 250 }, adminToken);
        expectStatus(docUpdate, 200, "Update Doctor Fee");


        // --- PATIENTS CRUD ---
        console.log("\n--- 3. PATIENTS CRUD ---");
        
        // Create Patient Profile
        const createPat = await request('/patients', 'POST', {
            firstName: "Sami",
            lastName: "Ali",
            phone: `+201${Math.floor(Math.random() * 100000000)}`,
            email: randomEmail,
            gender: "MALE"
        }, adminToken);
        expectStatus(createPat, 201, "Create Patient Profile");
        const patientId = createPat.data.id;

        // Update Patient
        const updatePat = await request(`/patients/${patientId}`, 'PUT', { bloodGroup: "O+" }, adminToken);
        expectStatus(updatePat, 200, "Update Patient Blood Group");

        // Get Patient
        const getPat = await request(`/patients/${patientId}`, 'GET', null, adminToken);
        expectStatus(getPat, 200, "Fetch Patient Details");


        // --- SCHEDULING & APPOINTMENTS ---
        console.log("\n--- 4. SCHEDULING & APPOINTMENTS ---");
        
        const appointmentDate = new Date();
        appointmentDate.setDate(appointmentDate.getDate() + 1); // Tomorrow
        
        // Reserve Appointment
        const reserveApt = await request('/appointments', 'POST', {
            patientId: patientId,
            doctorId: doctorId,
            appointmentDate: appointmentDate.toISOString(),
            durationMinutes: 30,
            type: "CONSULTATION",
            reason: "General Checkup"
        }, adminToken);
        expectStatus(reserveApt, 201, "Book an Appointment");
        const aptId = reserveApt.data.id;

        // Reschedule Appointment
        appointmentDate.setHours(appointmentDate.getHours() + 2);
        const rescheduleApt = await request(`/appointments/${aptId}/reschedule`, 'PUT', {
            appointmentDate: appointmentDate.toISOString(),
            reason: "Patient asked for delay"
        }, adminToken);
        expectStatus(rescheduleApt, 200, "Reschedule Appointment");

        // Today's Appointments
        const todayApt = await request('/appointments/today', 'GET', null, adminToken);
        expectStatus(todayApt, 200, "Fetch Today's Appointments");


        // --- MEDICAL RECORDS & PRESCRIPTIONS ---
        console.log("\n--- 5. MEDICAL RECORDS & PRESCRIPTIONS ---");

        // Create Medical Record
        const createMed = await request('/medical-records', 'POST', {
            patientId: patientId,
            doctorId: doctorId,
            appointmentId: aptId,
            chiefComplaint: "Cough and Fever",
            diagnosis: "Common Cold",
            treatmentPlan: "Rest and fluids",
            vitalSigns: { temp: 38, bp: "120/80" }
        }, adminToken);
        expectStatus(createMed, 201, "Create Medical Record");
        const medRecordId = createMed.data.id;

        // Write Prescription
        const createPrescription = await request('/prescriptions', 'POST', {
            patientId: patientId,
            doctorId: doctorId,
            medicalRecordId: medRecordId,
            medications: [{ name: "Panadol", dosage: "500mg", frequency: "Twice a day" }],
            instructions: "Take after meals"
        }, adminToken);
        expectStatus(createPrescription, 201, "Write Prescription");


        // --- BILLING & INVOICES ---
        console.log("\n--- 6. BILLING ---");

        // Generate Invoice
        const createInvoice = await request('/billing', 'POST', {
            patientId: patientId,
            doctorId: doctorId,
            appointmentId: aptId,
            items: [
                { description: "Consultation Fee", quantity: 1, unitPrice: 250 }
            ],
            tax: 0,
            discount: 50,
            notes: "Discount applied"
        }, adminToken);
        expectStatus(createInvoice, 201, "Generate Invoice");
        const invoiceId = createInvoice.data.id;

        // Pay Invoice
        const payInvoice = await request(`/billing/${invoiceId}`, 'PUT', {
            status: "PAID",
            paymentMethod: "CASH"
        }, adminToken);
        expectStatus(payInvoice, 200, "Mark Invoice as Paid");

        console.log("\n=========================================");
        console.log("🏁 ALL SCENARIOS EXECUTED SUCCESSFULLY!");
        console.log("=========================================\n");

    } catch (error) {
        console.error("\n❌ SIMULATION CRASHED:", error.message);
    }
}

runSimulation();
