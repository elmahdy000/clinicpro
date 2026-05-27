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
    console.log("\n🩺 [SCENARIO]: CLINICAL DOCTOR");
    console.log("--------------------------------------------------");
    try {
        // 1. Authenticate Doctor
        const login = await request('/auth/login', 'POST', {
            email: 'doctor@clinicpro.com',
            password: 'doctor123'
        });
        if (login.status !== 200 && login.status !== 201) {
            console.error("❌ Failed to log in as Doctor. Status:", login.status);
            return false;
        }
        const token = login.data.access_token;
        console.log("✅ Authenticated successfully as Doctor (Dr. Mahdy - Cardiology).");

        // 2. Fetch Scheduled Appointments
        const appointments = await request('/appointments', 'GET', null, token);
        if (appointments.status === 200) {
            const list = appointments.data.data || appointments.data;
            console.log(`✅ Fetched Doctor Appointments successfully (Found: ${list.length || 0} slots)`);
        } else {
            console.error("❌ Failed to fetch appointments. Status:", appointments.status);
            return false;
        }

        // 3. Get Doctor ID
        const docs = await request('/doctors', 'GET', null, token);
        const docList = docs.data.data || docs.data;
        if (!docList || docList.length === 0) {
            console.error("❌ No doctor profiles found.");
            return false;
        }
        const doctorId = docList[0].id;
        console.log(`✅ Doctor ID resolved: ${doctorId}`);

        // 4. Find a Patient
        const patients = await request('/patients', 'GET', null, token);
        if (patients.status !== 200 || !patients.data.data || patients.data.data.length === 0) {
            console.error("❌ No patients found to conduct checkup.");
            return false;
        }
        const patient = patients.data.data[0];
        console.log(`✅ Selected active patient: "${patient.firstName} ${patient.lastName}" | ID: ${patient.id}`);

        // 5. Create a Medical Visit Record (Vitals, Diagnosis, Recommendations)
        const checkupData = {
            patientId: patient.id,
            doctorId: doctorId,
            chiefComplaint: "ألم متكرر في الصدر عند المجهود وضيق تنفس مؤقت",
            diagnosis: "ذبحة صدرية مستقرة مع ارتفاع طفيف بضغط الدم",
            treatmentPlan: "الراحة التامة وتجنب المجهود الشديد والالتزام بمواعيد العلاج المحددة",
            vitalSigns: {
                bloodPressure: "135/85",
                heartRate: 78,
                temperature: 36.8,
                weight: 82,
                sugarLevel: "95"
            }
        };

        const checkup = await request('/medical-records', 'POST', checkupData, token);
        if (checkup.status === 201) {
            console.log(`✅ Created Medical Visit Record successfully | Visit ID: ${checkup.data.id}`);
            console.log(`   - 📈 Recorded Vitals: BP ${checkup.data.vitalSigns?.bloodPressure || 'N/A'} | HR ${checkup.data.vitalSigns?.heartRate || 'N/A'}`);
            console.log(`   - 📝 Diagnosis: "${checkup.data.diagnosis}"`);
        } else {
            console.error("❌ Failed to create medical record. Status:", checkup.status, checkup.data);
            return false;
        }

        console.log("🎉 DOCTOR SIMULATION COMPLETED SUCCESSFULLY!");
        return true;
    } catch (err) {
        console.error("❌ Simulation crashed:", err.message);
        return false;
    }
}

// Support running directly
if (require.main === module) run();

module.exports = { run };
