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
    
    const secret = process.env.JWT_SECRET || 'devsecret';
    const payload = { sub: doctor.id, email: doctor.email, role: doctor.role, clinicId: doctor.clinicId };
    const token = jwt.sign(payload, secret);

    console.log("Generated token for doctor:", doctor.email, "clinicId:", doctor.clinicId);

    // 1. Call /api/inventory
    try {
      console.log("Calling /api/inventory...");
      const res = await axios.get('http://localhost:3000/api/inventory', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("HTTP Get /api/inventory success:", res.data);
    } catch (e) {
      if (e.response) {
        console.error("HTTP ERROR /api/inventory:", e.response.status, JSON.stringify(e.response.data));
      } else {
        console.error("CRITICAL ERROR /api/inventory:", e.message || e);
      }
    }

    // 2. Call /api/inventory/low-stock
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

  } catch (e) {
    console.error("OUTER CRITICAL ERROR:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
