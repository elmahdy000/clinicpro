const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const email = 'doctor@clinic.com';

  // 1. Clean up existing records safely, taking care of foreign key constraints
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log('Cleaning up existing doctor user and profile...');
    // Delete doctor profile first
    await prisma.doctor.deleteMany({
      where: { userId: existingUser.id }
    });
    // Then delete the user
    await prisma.user.delete({
      where: { id: existingUser.id }
    });
  }
  
  // Clean up default clinic
  await prisma.clinic.deleteMany({
    where: { name: 'ClinicPro Premium Clinic' }
  });

  // 2. Create a default clinic
  const clinic = await prisma.clinic.create({
    data: {
      name: 'ClinicPro Premium Clinic',
      phone: '01234567890',
      address: 'Cairo, Egypt',
    },
  });
  console.log('Created clinic:', clinic.name, 'with ID:', clinic.id);

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 3. Create the User (DOCTOR role) linked to the clinic
  const u = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
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
  console.log('Created doctor credentials with Bcrypt Hash:', u.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
