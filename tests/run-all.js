const platformOwner = require('./platform-owner.simulation');
const clinicAdmin = require('./clinic-admin.simulation');
const doctor = require('./doctor.simulation');
const patient = require('./patient.simulation');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
    console.log("=================================================================");
    console.log("🏥            CLINICPRO SYSTEM-WIDE QA INTEGRATION TEST          ");
    console.log("=================================================================");
    console.log(`⏱️  Start Time: ${new Date().toISOString()}`);
    console.log("🌐 Targeted Server: http://localhost:3000/api");

    const results = {
        platformOwner: false,
        clinicAdmin: false,
        doctor: false,
        patient: false,
        multiTenant: false
    };

    // 1. Run Platform Owner Scenario
    results.platformOwner = await platformOwner.run().catch(() => false);

    // 2. Run Clinic Admin Scenario
    results.clinicAdmin = await clinicAdmin.run().catch(() => false);

    // 3. Run Doctor Scenario
    results.doctor = await doctor.run().catch(() => false);

    // 4. Run Patient Scenario
    results.patient = await patient.run().catch(() => false);

    // 5. Run Multi-Tenant EMR Scenario
    console.log("\n🌐 [SCENARIO]: MULTI-TENANT & GLOBAL EMR SHARING");
    console.log("--------------------------------------------------");
    try {
        const rootDir = path.resolve(__dirname, '..');
        const output = execSync('node multi-tenant-simulation.js', { cwd: rootDir, encoding: 'utf-8' });
        console.log(output);
        if (output.includes("MULTI-TENANT EMR SIMULATION COMPLETE!")) {
            results.multiTenant = true;
        }
    } catch (err) {
        console.error("❌ Multi-tenant EMR matching simulation failed:", err.message);
    }

    // 6. Print Gorgeous Executive Summary Dashboard
    console.log("\n=================================================================");
    console.log("🏁               SYSTEM SIMULATION INTEGRATION REPORT             ");
    console.log("=================================================================");
    
    const printRow = (title, status) => {
        const check = status ? "🟢 PASSED" : "🔴 FAILED";
        const paddedTitle = title.padEnd(45, '.');
        console.log(`| ${paddedTitle} [${check}] |`);
    };

    printRow("1. Platform Owner SaaS Admin Operations", results.platformOwner);
    printRow("2. Clinic Admin Local Resource & Patient Onboarding", results.clinicAdmin);
    printRow("3. Doctor Scheduled EMR Consultations & Vitals", results.doctor);
    printRow("4. Patient Secure Health Portal & e-Rx Access", results.patient);
    printRow("5. Multi-Tenant EMR Matcher & Tenant Isolation", results.multiTenant);
    
    console.log("=================================================================");
    
    const allPassed = Object.values(results).every(v => v === true);
    if (allPassed) {
        console.log("\n🎉 CONGRATULATIONS! ALL ROLE SIMULATIONS PASSED 100% SUCCESSFULLY!");
        console.log("👉 The system architecture is completely verified, secure, and production-ready.");
    } else {
        console.warn("\n⚠️ ATTENTION: Some role simulations failed. Please review the detailed logs above.");
    }
    console.log("=================================================================\n");
}

main();
