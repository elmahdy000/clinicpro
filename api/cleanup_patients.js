const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING PATIENT DATA CLEANUP ON VPS ===");
  
  // Get all patient IDs and User IDs to delete
  const patients = await prisma.patient.findMany({
    select: { id: true, userId: true }
  });
  
  const patientIds = patients.map(p => p.id);
  const userIds = patients.map(p => p.userId).filter(id => id !== null);
  
  console.log(`Found ${patientIds.length} patients and ${userIds.length} linked user accounts.`);

  if (patientIds.length === 0) {
    console.log("No patients found to delete.");
    return;
  }

  // Perform deletion in a safe transaction
  await prisma.$transaction(async (tx) => {
    console.log("Deleting prescriptions...");
    await tx.prescription.deleteMany({
      where: { patientId: { in: patientIds } }
    });

    console.log("Deleting medical records...");
    await tx.medicalRecord.deleteMany({
      where: { patientId: { in: patientIds } }
    });

    console.log("Deleting appointments...");
    await tx.appointment.deleteMany({
      where: { patientId: { in: patientIds } }
    });

    console.log("Deleting invoices...");
    await tx.invoice.deleteMany({
      where: { patientId: { in: patientIds } }
    });

    console.log("Deleting file uploads...");
    await tx.fileUpload.deleteMany({
      where: { patientId: { in: patientIds } }
    });

    console.log("Deleting patient medical files...");
    await tx.patientMedicalFile.deleteMany({
      where: { patientId: { in: patientIds } }
    });

    console.log("Deleting medical timeline events...");
    await tx.patientMedicalTimelineEvent.deleteMany({
      where: { patientId: { in: patientIds } }
    });

    console.log("Deleting clinic patient associations...");
    await tx.clinicPatient.deleteMany({
      where: { patientId: { in: patientIds } }
    });

    console.log("Deleting patient profiles...");
    await tx.patient.deleteMany({
      where: { id: { in: patientIds } }
    });

    if (userIds.length > 0) {
      console.log("Deleting user notifications...");
      await tx.notification.deleteMany({
        where: { userId: { in: userIds } }
      });

      console.log("Nullifying user IDs in audit logs...");
      await tx.auditLog.updateMany({
        where: { userId: { in: userIds } },
        data: { userId: null }
      });

      console.log("Deleting linked user accounts with role PATIENT...");
      await tx.user.deleteMany({
        where: {
          id: { in: userIds },
          role: 'PATIENT'
        }
      });
    }
  });

  console.log("=== PATIENT DATA CLEANUP COMPLETED SUCCESSFULLY ===");
}

main()
  .catch(e => {
    console.error("ERROR during patient data cleanup:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
