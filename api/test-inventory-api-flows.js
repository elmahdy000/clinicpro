const axios = require('axios');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'devsecret';
const token = jwt.sign(
  { sub: 106, email: 'doctor@clinicpro.com', role: 'DOCTOR', clinicId: 64 },
  JWT_SECRET
);

const client = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});

async function runTests() {
  console.log("=== STARTING INVENTORY API FLOW TESTS ===");
  try {
    // 1. Get current inventory
    console.log("1. Fetching current inventory...");
    const invRes = await client.get('/inventory');
    console.log(`Found ${invRes.data.data.length} stock items in clinic 64.`);
    
    // We need a medication to add stock to. Let's search medications.
    console.log("2. Fetching available medications...");
    const medsRes = await client.get('/medications', { params: { limit: 10 } });
    if (medsRes.data.length === 0) {
      throw new Error("No medications found in database to test stock creation.");
    }
    const targetMed = medsRes.data[0];
    console.log(`Target Medication for testing: "${targetMed.name}" (ID: ${targetMed.id})`);

    // Let's check if medication stock record already exists.
    let stockItem = invRes.data.data.find(item => item.medicationId === targetMed.id);
    
    if (!stockItem) {
      console.log(`3. Creating a new MedicationStock record for "${targetMed.name}"...`);
      const createRes = await client.post('/inventory', {
        medicationId: targetMed.id,
        quantityOnHand: 20,
        batchNumber: 'BATCH-TEST-123',
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Shelf B-4'
      });
      stockItem = createRes.data;
      console.log("Stock record created successfully:", stockItem.id);
    } else {
      console.log(`3. Stock record already exists for "${targetMed.name}" (ID: ${stockItem.id}, Qty: ${stockItem.quantityOnHand}). Using existing.`);
    }

    // 4. Perform RESTOCK (add-stock)
    console.log(`4. Restocking stock item #${stockItem.id} (+15)...`);
    const restockRes = await client.put(`/inventory/${stockItem.id}/add-stock`, {
      quantity: 15,
      notes: 'Test restock operation via automated diagnostic script performedBy: 106'
    });
    console.log("Restock successful. New Quantity:", restockRes.data.quantityOnHand);

    // 5. Fetch single stock item details to verify movements are loaded
    console.log(`5. Fetching details for stock item #${stockItem.id}...`);
    const detailRes = await client.get(`/inventory/${stockItem.id}`);
    console.log(`QuantityOnHand in DB: ${detailRes.data.quantityOnHand}`);
    console.log(`Movements count: ${detailRes.data.stockMovements?.length}`);
    if (detailRes.data.stockMovements && detailRes.data.stockMovements.length > 0) {
      console.log("Latest movement details:", detailRes.data.stockMovements[0]);
    } else {
      throw new Error("No stock movements recorded for restock!");
    }

    // 6. Perform DISPENSE (remove-stock)
    console.log(`6. Dispensing stock item #${stockItem.id} (-5)...`);
    const dispenseRes = await client.put(`/inventory/${stockItem.id}/remove-stock`, {
      quantity: 5,
      notes: 'Test dispensing operation'
    });
    console.log("Dispense successful. New Quantity:", dispenseRes.data.quantityOnHand);

    // 7. Perform ADJUSTMENT (adjust)
    console.log(`7. Adjusting stock item #${stockItem.id} directly to 50...`);
    const adjustRes = await client.put(`/inventory/${stockItem.id}/adjust`, {
      quantity: 50,
      notes: 'Manual audit correction to 50'
    });
    console.log("Adjustment successful. New Quantity:", adjustRes.data.quantityOnHand);

    // Verify low stock and expiring endpoints
    console.log("8. Checking low stock endpoint...");
    const lowStockRes = await client.get('/inventory/low-stock');
    console.log(`Low stock items count: ${lowStockRes.data.length}`);

    console.log("9. Checking expiring endpoint...");
    const expiringRes = await client.get('/inventory/expiring');
    console.log(`Expiring items count: ${expiringRes.data.length}`);

    console.log("=== ALL INVENTORY API FLOW TESTS COMPLETED SUCCESSFULLY ===");
  } catch (error) {
    console.error("!!! TEST FLOW FAILED !!!");
    if (error.response) {
      console.error(`HTTP Status: ${error.response.status}`);
      console.error("HTTP Response Body:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message || error);
    }
    process.exit(1);
  }
}

runTests();
