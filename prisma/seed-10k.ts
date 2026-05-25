import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const prefixes = ['Amoxi', 'Cipro', 'Para', 'Ome', 'Venta', 'Ceta', 'Ibu', 'Pana', 'Moxi', 'Azi', 'Cefa', 'Zithro', 'Vola', 'Nova', 'Rosi', 'Meta', 'Gluco', 'Epi', 'Neuro', 'Vito', 'Levo', 'Dexa', 'Hydro', 'Keto', 'Lorat', 'Fexo', 'Aten', 'Biso', 'Olan', 'Sert', 'Flu', 'Clinda', 'Doxy', 'Diclo', 'Melo', 'Piro', 'Tena', 'Sita', 'Vilda', 'Dapa', 'Empa', 'Lisi', 'Cande', 'Val', 'Telmi'];
const suffixes = ['cillin', 'floxacin', 'cetamol', 'prazole', 'lin', 'fen', 'dol', 'cin', 'zole', 'sone', 'tadine', 'mine', 'pril', 'sartan', 'dipine', 'statin', 'formin', 'cort', 'xacin', 'micin', 'thromycin', 'conazole', 'nazole', 'vir', 'mab', 'tinib', 'lol', 'pine', 'mide', 'zide', 'glitazone', 'gliptin', 'flozin', 'xa', 'ban', 'tran', 'parin', 'teplase', 'kinase'];
const forms = ['Tabs', 'Caps', 'Syrup', 'Injection', 'Cream', 'Ointment', 'Drops', 'Sachet', 'Suspension', 'Gel', 'Lotion', 'Spray', 'Inhaler', 'Suppositories', 'Patch', 'Powder'];
const strengths = ['1mg', '2mg', '5mg', '10mg', '20mg', '25mg', '40mg', '50mg', '75mg', '100mg', '150mg', '200mg', '250mg', '300mg', '400mg', '500mg', '600mg', '750mg', '875mg', '1g'];
const companies = ['Eva Pharma', 'Amoun', 'EIPICO', 'Pharco', 'Marcyrl', 'Hikma', 'Sedico', 'Minapharm', 'Apex', 'Global Napi', 'CID', 'Memphis', 'Nile', 'Kahira', 'Rameda', 'Utopia', 'October Pharma', 'SIGMA', 'Medical Union', 'Delta Pharma', 'Atco', 'Biopharm', 'Chemipharm'];
const categories = ['Antibiotics', 'Analgesics', 'Antacids', 'Antihistamines', 'Vitamins', 'Cardiovascular', 'Diabetics', 'Respiratory', 'Dermatology', 'Neurology', 'Psychiatry', 'Gastrointestinal', 'Endocrinology', 'Ophthalmology', 'Gynecology', 'Urology', 'Oncology', 'Hematology'];

function getRandomItem(arr: any[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('Seeding 10,000 Egyptian medications...');
  const BATCH_SIZE = 500;
  let allMeds = new Map<string, any>();
  
  while (allMeds.size < 10000) {
    const name = `${getRandomItem(prefixes)}${getRandomItem(suffixes)} ${getRandomItem(strengths)} ${getRandomItem(forms)}`;
    if (!allMeds.has(name)) {
      allMeds.set(name, {
        name,
        activeIngredient: getRandomItem(prefixes) + getRandomItem(suffixes),
        manufacturer: getRandomItem(companies),
        category: getRandomItem(categories)
      });
    }
  }

  const medsArray = Array.from(allMeds.values());
  let count = 0;
  
  await prisma.prescriptionItem.deleteMany({});
  await prisma.medication.deleteMany({});
  
  for (let i = 0; i < medsArray.length; i += BATCH_SIZE) {
    const batch = medsArray.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((med: any) => prisma.medication.create({ data: med })));
    count += batch.length;
    console.log(`Seeded ${count} medications...`);
  }
  
  console.log('Successfully seeded 10,000 medications!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
