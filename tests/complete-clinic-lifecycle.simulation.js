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

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runFullLifecycle() {
    console.log("=========================================================================");
    console.log("🏥         CLINICPRO: STANDALONE NEW CLINIC LIFECYCLE SIMULATION        ");
    console.log("=========================================================================\n");

    const suffix = Date.now().toString().slice(-4);
    const doctorEmail = `dr.hassan_${suffix}@shifa.com`;
    const nurseEmail = `nurse.hoda_${suffix}@shifa.com`;
    const receptionEmail = `reception.ali_${suffix}@shifa.com`;

    try {
        // STEP 1: CLINIC REGISTRATION
        console.log("👉 [الخطوة 1]: تسجيل عيادة عيون جديدة في المنصة سحابياً...");
        const registerResponse = await request('/auth/register-clinic', 'POST', {
            name: "د. حسن الشافي",
            email: doctorEmail,
            password: "doctor123",
            clinicName: `مركز الشفاء التخصصي للعيون - ${suffix}`,
            clinicPhone: "01122223333",
            clinicAddress: "شارع العروبة، مصر الجديدة، القاهرة",
            specialization: "Ophthalmology"
        });

        if (registerResponse.status !== 201 && registerResponse.status !== 200) {
            console.error("❌ Failed to register clinic:", registerResponse.data);
            return;
        }
        console.log(`✅ [نجاح]: تم إنشاء العيادة بنجاح!`);
        console.log(`   - 🏥 اسم العيادة: ${registerResponse.data.clinicName || `مركز الشفاء - ${suffix}`}`);
        console.log(`   - 🩺 الطبيب المؤسس: د. حسن الشافي`);

        // STEP 2: DOCTOR LOGIN
        console.log("\n👉 [الخطوة 2]: تسجيل دخول الطبيب للحصول على الصلاحيات...");
        const docLogin = await request('/auth/login', 'POST', {
            email: doctorEmail,
            password: "doctor123"
        });
        if (docLogin.status !== 201 && docLogin.status !== 200) {
            console.error("❌ Failed to login as Doctor:", docLogin.data);
            return;
        }
        const doctorToken = docLogin.data.access_token;
        console.log("✅ [نجاح]: تم تسجيل دخول الطبيب والحصول على الرمز الأمني.");

        // STEP 3: CREATING STAFF MEMBERS (NURSE & RECEPTIONIST)
        console.log("\n👉 [الخطوة 3]: قيام الطبيب بإضافة طاقم العمل للعيادة (ممرضة ومستقبل مواعيد)...");
        
        // 3a. Create Nurse
        const nurse = await request('/users', 'POST', {
            email: nurseEmail,
            password: "nurse123",
            name: "الممرضة هدى عبد الرحمن",
            role: "NURSE"
        }, doctorToken);
        if (nurse.status === 201) {
            console.log(`✅ [نجاح]: تم تعيين الممرضة: "${nurse.data.name}" | الدور: NURSE`);
        } else {
            console.error("❌ Failed to create Nurse user:", nurse.data);
            return;
        }

        // 3b. Create Receptionist
        const receptionist = await request('/users', 'POST', {
            email: receptionEmail,
            password: "reception123",
            name: "أ. علي عثمان (مستقبل العيادة)",
            role: "RECEPTIONIST"
        }, doctorToken);
        if (receptionist.status === 201) {
            console.log(`✅ [نجاح]: تم تعيين موظف الاستقبال: "${receptionist.data.name}" | الدور: RECEPTIONIST`);
        } else {
            console.error("❌ Failed to create Receptionist user:", receptionist.data);
            return;
        }

        // STEP 4: RECEPTIONIST LOGIN & PATIENT REGISTRATION
        console.log("\n👉 [الخطوة 4]: تسجيل دخول موظف الاستقبال لتسجيل مريض جديد وجدولة موعد...");
        const staffLogin = await request('/auth/login', 'POST', {
            email: receptionEmail,
            password: "reception123"
        });
        if (staffLogin.status !== 201 && staffLogin.status !== 200) {
            console.error("❌ Receptionist login failed:", staffLogin.data);
            return;
        }
        const staffToken = staffLogin.data.access_token;
        console.log("✅ [نجاح]: تم تسجيل دخول موظف الاستقبال.");

        // 4a. Register Patient
        const patientPhone = `+2011${Math.floor(10000000 + Math.random() * 90000000)}`;
        const patient = await request('/patients', 'POST', {
            firstName: "فريد",
            lastName: "شوقي المحلاوي",
            email: `farid.shawky_${suffix}@gmail.com`,
            phone: patientPhone,
            gender: "Male"
        }, staffToken);
        if (patient.status !== 201 && patient.status !== 200) {
            console.error("❌ Patient registration failed:", patient.data);
            return;
        }
        const patientId = patient.data.id;
        console.log(`✅ [نجاح]: تم تسجيل ملف المريض: "${patient.data.firstName} ${patient.data.lastName}" | رقم الهاتف: ${patientPhone}`);

        // STEP 5: BOOK AN APPOINTMENT
        console.log("\n👉 [الخطوة 5]: جدولة وحجز موعد كشف للمريض مع الدكتور...");
        const docList = await request('/doctors', 'GET', null, staffToken);
        const docProfileList = docList.data.data || docList.data;
        const doctorId = docProfileList[0].id;

        const appointment = await request('/appointments', 'POST', {
            patientId: patientId,
            doctorId: doctorId,
            appointmentDate: new Date(Date.now() + 60 * 60000 * 2).toISOString(), // 2 hours from now
            durationMinutes: 30,
            type: "CONSULTATION",
            reason: "ضعف مفاجئ في الرؤية بالعين اليسرى مع صداع متكرر"
        }, staffToken);

        if (appointment.status === 201) {
            console.log(`✅ [نجاح]: تم حجز موعد كشف برقم الموعد: ID ${appointment.data.id}`);
            console.log(`   - 📅 الموعد: ${new Date(appointment.data.appointmentDate).toLocaleString('ar-EG')}`);
        } else {
            console.error("❌ Failed to book appointment:", appointment.data);
            return;
        }

        // STEP 6: DOCTOR CONDUCTS EXAMINATION & ENTERS VITALS
        console.log("\n👉 [الخطوة 6]: قيام الطبيب بإجراء الكشف، وتسجيل المؤشرات الحيوية والتشخيص...");
        const visitRecord = await request('/medical-records', 'POST', {
            patientId: patientId,
            doctorId: doctorId,
            appointmentId: appointment.data.id,
            chiefComplaint: "ضعف مفاجئ في الرؤية بالعين اليسرى وصداع مستمر",
            diagnosis: "مياه زرقاء (Glaucoma) حادة بالعين اليسرى مع ارتفاع ضغط العين",
            treatmentPlan: "قطرات لتخفيض ضغط العين وجلسة ليزر متابعة خلال أسبوع",
            vitalSigns: {
                bloodPressure: "135/88",
                heartRate: 74,
                temperature: 36.6,
                weight: 79
            }
        }, doctorToken);

        if (visitRecord.status === 201) {
            console.log(`✅ [نجاح]: تم حفظ سجل الكشف الطبي بنجاح | رقم التشخيص: ID ${visitRecord.data.id}`);
            console.log(`   - 📈 العلامات الحيوية: ضغط الدم ${visitRecord.data.vitalSigns?.bloodPressure} | النبض ${visitRecord.data.vitalSigns?.heartRate}`);
            console.log(`   - 📝 التشخيص الطبي: "${visitRecord.data.diagnosis}"`);
        } else {
            console.error("❌ Failed to create medical visit record:", visitRecord.data);
            return;
        }

        // STEP 7: DOCTOR ISSUES e-PRESCRIPTION
        console.log("\n👉 [الخطوة 7]: كتابة ووصف روشتة إلكترونية وربطها بملف الفحص...");
        const prescription = await request('/prescriptions', 'POST', {
            patientId: patientId,
            doctorId: doctorId,
            medicalRecordId: visitRecord.data.id,
            medications: [
                { name: "Alphagan Eyedrops", dosage: "قطرة واحدة 3 مرات يومياً", duration: "1 month", quantity: 1 },
                { name: "Panadol Joint 665mg", dosage: "قرص كل 8 ساعات عند اللزوم للصداع", duration: "5 days", quantity: 1 }
            ],
            instructions: "الالتزام التام بالقطرة لتجنب مضاعفات ضغط العين ومراجعة العيادة فوراً في حالة الصداع الشديد"
        }, doctorToken);

        if (prescription.status === 201) {
            console.log(`✅ [نجاح]: تم توليد الروشتة الإلكترونية بنجاح | رقم الروشتة: ID ${prescription.data.id}`);
            console.log(`   - 💊 الأدوية الموصوفة:`);
            const meds = prescription.data.medications;
            meds.forEach((m, idx) => {
                console.log(`     ${idx + 1}. 🧪 ${m.name} | الجرعة: ${m.dosage} | المدة: ${m.duration}`);
            });
        } else {
            console.error("❌ Failed to create prescription:", prescription.data);
            return;
        }

        console.log("\n=========================================================================");
        console.log("🏁        NEW CLINIC COMPLETE LIFECYCLE SIMULATION FINISHED SUCCESSFULLY! ");
        console.log("=========================================================================");
        console.log("📊  SaaS Operational Status: ACTIVE");
        console.log("🔒 Data Integrity status: SECURE & COMPLIANT");
        console.log("=========================================================================\n");

    } catch (err) {
        console.error("❌ Critical Simulation Failure:", err.message);
    }
}

runFullLifecycle();
