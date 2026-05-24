const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.create({
    data: {
      email: 'doctor@clinic.com',
      password: 'password123',
      name: 'Dr. John Doe',
      role: 'DOCTOR',
      doctorProfile: {
        create: {
          specialization: 'General Medicine',
          consultationFee: 150.0,
          status: 'ACTIVE',
          department: {
            connectOrCreate: {
              where: { name: 'General Medicine' },
              create: { name: 'General Medicine' },
            },
          },
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
