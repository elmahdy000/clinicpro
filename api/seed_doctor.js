const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // 1. Create a default clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: 'ClinicPro Premium Clinic',
      phone: '01234567890',
      address: 'Cairo, Egypt',
    },
  });
  console.log('Created clinic:', clinic.name, 'with ID:', clinic.id);

  // 2. Create the User (DOCTOR role) linked to the clinic
  const u = await prisma.user.create({
    data: {
      email: 'doctor@clinic.com',
      password: 'password123',
      name: 'Dr. John Doe',
      role: 'DOCTOR',
      clinicId: clinic.id,
      doctorProfile: {
        create: {
          specialization: 'General Medicine',
          consultationFee: 150.0,
          status: 'ACTIVE',
          clinicId: clinic.id,
        },
      },
    },
  });
  console.log('Created doctor credentials:', u.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
