const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { tenantStorage } = require('./api/dist/prisma/tenant-context.js') || {};

async function test() {
    console.log("Testing Global Search...");
    const results = await prisma.patient.findMany({
        where: {
            OR: [
                { phone: { contains: '201' } },
            ]
        },
        include: { clinic: true }
    });
    console.log(`Found ${results.length} patients globally!`);
    console.log(results.map(p => `${p.firstName} ${p.lastName} - Clinic: ${p.clinic.name}`));
}

test().catch(console.error).finally(() => prisma.$disconnect());
