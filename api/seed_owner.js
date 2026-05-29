const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.create({
    data: {
      email: 'owner@clinicpro.online',
      password: 'password123',
      name: 'ClinicPro Platform Owner',
      role: 'PLATFORM_OWNER',
    },
  });
  console.log('Created Platform Owner credentials successfully:');
  console.log('Email:', u.email);
  console.log('Password: password123');
  console.log('Role:', u.role);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
