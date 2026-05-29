const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const prisma = new PrismaClient();

async function main() {
  try {
    const doctor = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
    if (!doctor) {
      console.log("No DOCTOR user found in database.");
      return;
    }
    
    const secret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
    const payload = { sub: doctor.id, email: doctor.email, role: doctor.role, clinicId: doctor.clinicId };
    const token = jwt.sign(payload, secret);

    console.log("Generated token for doctor:", doctor.email);

    // Call /api/inventory/low-stock
    try {
      console.log("Calling /api/inventory/low-stock...");
      const res = await axios.get('http://localhost:3000/api/inventory/low-stock', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("HTTP Get /api/inventory/low-stock success:", res.data);
    } catch (e) {
      if (e.response) {
        console.error("HTTP ERROR low-stock:", e.response.status, JSON.stringify(e.response.data));
      } else {
        console.error("CRITICAL ERROR low-stock:", e.message || e);
      }
    }

    // Call /api/inventory/expiring
    try {
      console.log("Calling /api/inventory/expiring...");
      const res = await axios.get('http://localhost:3000/api/inventory/expiring', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("HTTP Get /api/inventory/expiring success:", res.data);
    } catch (e) {
      if (e.response) {
        console.error("HTTP ERROR expiring:", e.response.status, JSON.stringify(e.response.data));
      } else {
        console.error("CRITICAL ERROR expiring:", e.message || e);
      }
    }

  } catch (e) {
    console.error("OUTER CRITICAL ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
