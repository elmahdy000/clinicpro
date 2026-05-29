const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Get the nurse or doctor user
    const user = await prisma.user.findFirst({
      where: { email: 'doctor@clinicpro.com' } // or 'mohamedsayed@clinicpro.com'
    });
    if (!user) {
      console.error("User not found!");
      return;
    }

    // 2. Generate a valid JWT token
    const secret = process.env.JWT_SECRET || 'supersecretjwtkey';
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      clinicId: user.clinicId,
    };
    const token = jwt.sign(payload, secret);
    console.log(`Simulating request for user: ${user.name} (${user.role})`);
    console.log(`ClinicId: ${user.clinicId}`);
    console.log(`Token: ${token.substring(0, 20)}...`);

    // 3. Prepare the post payload for /appointments
    const appointmentPayload = {
      patientId: 55, // Existing patient ID
      doctorId: 59,  // Existing doctor ID
      appointmentDate: '2026-06-01T10:00:00.000Z',
      durationMinutes: 30,
      type: 'CONSULTATION',
      reason: 'Regular heart checkup',
      status: 'CONFIRMED',
      notes: 'No special notes',
    };

    console.log("Sending payload:", appointmentPayload);

    // 4. Send the POST request to our running backend
    const response = await axios.post('http://localhost:3000/api/appointments', appointmentPayload, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    console.log("Response Status:", response.status);
    console.log("Response Data:", response.data);

  } catch (e) {
    if (e.response) {
      console.error("HTTP ERROR STATUS:", e.response.status);
      console.error("HTTP ERROR DATA:", JSON.stringify(e.response.data, null, 2));
    } else {
      console.error("ERROR:", e);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
