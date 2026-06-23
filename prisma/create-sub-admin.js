const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'subadmin@clinicpro.com';
  const existing = await prisma.user.findFirst({ where: { email } });
  
  if (existing) {
    console.log(`User ${email} already exists! Updating role to SUB_ADMIN.`);
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: 'SUB_ADMIN' },
    });
    console.log('User role updated successfully.');
  } else {
    console.log(`Creating user ${email} with role SUB_ADMIN...`);
    const hashedPassword = bcrypt.hashSync('subadmin123', 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Sub Admin Monitor',
        role: 'SUB_ADMIN',
      },
    });
    console.log('User created successfully:', user.id);
  }
}

main()
  .catch((e) => {
    console.error('Failed to create sub-admin user:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
