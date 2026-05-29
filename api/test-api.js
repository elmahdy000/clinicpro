const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const prisma = new PrismaClient();

async function main() {
  try {
    const owner = await prisma.user.findFirst({ where: { role: 'PLATFORM_OWNER' } });
    if (!owner) {
      console.log("No PLATFORM_OWNER found");
      return;
    }
    
    // Check JWT_SECRET in .env or default
    const secret = process.env.JWT_SECRET || 'super-secret-key-change-in-production';
    const payload = { sub: owner.id, email: owner.email, role: owner.role, clinicId: null };
    const token = jwt.sign(payload, secret);

    console.log("Generated token:", token);

    const res = await axios.get('http://localhost:3000/api/dashboard/subscription-invoices', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log("Success:", res.data);
  } catch (e) {
    if (e.response) {
      console.error("HTTP ERROR:", e.response.status, e.response.data);
    } else {
      console.error("ERROR:", e);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
