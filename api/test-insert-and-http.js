const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const prisma = new PrismaClient();

async function main() {
  let stockId1 = null;
  let stockId2 = null;
  try {
    const doctor = await prisma.user.findFirst({ where: { role: 'DOCTOR' } });
    if (!doctor) {
      console.log("No DOCTOR found");
      return;
    }
    const clinicId = doctor.clinicId;

    let med = await prisma.medication.findFirst();
    if (!med) {
      med = await prisma.medication.create({
        data: {
          name: 'Panadol Extra Test',
          activeIngredient: 'Paracetamol',
          price: 50
        }
      });
    }

    // Insert stock 1: null dates
    const stock1 = await prisma.medicationStock.create({
      data: {
        medicationId: med.id,
        clinicId,
        quantityOnHand: 15,
        batchNumber: 'BATCH-TEST-NULL',
        expiryDate: null,
        lastRestockedAt: null,
      }
    });
    stockId1 = stock1.id;
    console.log("Inserted stock 1 (null dates):", stock1.id);

    // Insert stock 2: actual dates
    const stock2 = await prisma.medicationStock.create({
      data: {
        medicationId: med.id,
        clinicId,
        quantityOnHand: 5,
        batchNumber: 'BATCH-TEST-VAL',
        expiryDate: new Date('2027-12-31'),
        lastRestockedAt: new Date(),
      }
    });
    stockId2 = stock2.id;
    console.log("Inserted stock 2 (valid dates):", stock2.id);

    // Sign token
    const secret = process.env.JWT_SECRET || 'devsecret';
    const payload = { sub: doctor.id, email: doctor.email, role: doctor.role, clinicId: doctor.clinicId };
    const token = jwt.sign(payload, secret);

    // Call API
    console.log("Calling HTTP GET /api/inventory...");
    const res = await axios.get('http://localhost:3000/api/inventory', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("HTTP Get /api/inventory success status:", res.status);
    console.log("HTTP Get /api/inventory data length:", res.data?.data?.length);
    console.log("HTTP Get /api/inventory data sample:", JSON.stringify(res.data?.data));

  } catch (e) {
    if (e.response) {
      console.error("HTTP ERROR:", e.response.status, JSON.stringify(e.response.data));
    } else {
      console.error("ERROR:", e);
    }
  } finally {
    if (stockId1) {
      await prisma.medicationStock.delete({ where: { id: stockId1 } }).catch(() => {});
    }
    if (stockId2) {
      await prisma.medicationStock.delete({ where: { id: stockId2 } }).catch(() => {});
    }
    await prisma.$disconnect();
  }
}

main();
