const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('./dist/app.module');
const { PrismaService } = require('./dist/prisma/prisma.service');
const { tenantStorage } = require('./dist/prisma/tenant-context');

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const prisma = app.get(PrismaService);
  
  console.log("Testing under tenant context...");
  
  await tenantStorage.run({ clinicId: 64 }, async () => {
    try {
      console.log("Trying findMany StockMovement...");
      const res = await prisma.stockMovement.findMany();
      console.log("findMany success:", res);
    } catch (e) {
      console.error("findMany FAILED:", e.message || e);
    }
    
    try {
      console.log("Trying create StockMovement...");
      const res = await prisma.stockMovement.create({
        data: {
          medicationStockId: 1, // dummy
          type: 'IN',
          quantity: 10,
        }
      });
      console.log("create success:", res);
    } catch (e) {
      console.error("create FAILED:", e.message || e);
    }
  });

  await app.close();
}

test();
