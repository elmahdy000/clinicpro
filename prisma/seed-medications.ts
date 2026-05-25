import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const medications = [
  // Cardiology
  { name: 'Aspirin', activeIngredient: 'Acetylsalicylic acid', category: 'Cardiology', manufacturer: 'Bayer' },
  { name: 'Atorvastatin', activeIngredient: 'Atorvastatin', category: 'Cardiology', manufacturer: 'Pfizer' },
  { name: 'Lisinopril', activeIngredient: 'Lisinopril', category: 'Cardiology', manufacturer: 'AstraZeneca' },
  { name: 'Amlodipine', activeIngredient: 'Amlodipine', category: 'Cardiology', manufacturer: 'Pfizer' },
  { name: 'Metoprolol', activeIngredient: 'Metoprolol', category: 'Cardiology', manufacturer: 'AstraZeneca' },
  { name: 'Clopidogrel', activeIngredient: 'Clopidogrel', category: 'Cardiology', manufacturer: 'Sanofi' },
  { name: 'Rosuvastatin', activeIngredient: 'Rosuvastatin', category: 'Cardiology', manufacturer: 'AstraZeneca' },
  { name: 'Concor', activeIngredient: 'Bisoprolol', category: 'Cardiology', manufacturer: 'Merck' },

  // Endocrinology
  { name: 'Metformin', activeIngredient: 'Metformin', category: 'Endocrinology', manufacturer: 'Merck' },
  { name: 'Glucophage', activeIngredient: 'Metformin', category: 'Endocrinology', manufacturer: 'Merck' },
  { name: 'Levothyroxine', activeIngredient: 'Levothyroxine', category: 'Endocrinology', manufacturer: 'AbbVie' },
  { name: 'Euthyrox', activeIngredient: 'Levothyroxine', category: 'Endocrinology', manufacturer: 'Merck' },
  { name: 'Glimepiride', activeIngredient: 'Glimepiride', category: 'Endocrinology', manufacturer: 'Sanofi' },
  { name: 'Amaryl', activeIngredient: 'Glimepiride', category: 'Endocrinology', manufacturer: 'Sanofi' },
  { name: 'Lantus', activeIngredient: 'Insulin Glargine', category: 'Endocrinology', manufacturer: 'Sanofi' },
  { name: 'Januvia', activeIngredient: 'Sitagliptin', category: 'Endocrinology', manufacturer: 'Merck' },

  // Gastroenterology
  { name: 'Omeprazole', activeIngredient: 'Omeprazole', category: 'Gastroenterology', manufacturer: 'AstraZeneca' },
  { name: 'Nexium', activeIngredient: 'Esomeprazole', category: 'Gastroenterology', manufacturer: 'AstraZeneca' },
  { name: 'Controloc', activeIngredient: 'Pantoprazole', category: 'Gastroenterology', manufacturer: 'Takeda' },
  { name: 'Colospasmin', activeIngredient: 'Mebeverine', category: 'Gastroenterology', manufacturer: 'EIPICO' },
  { name: 'Motilium', activeIngredient: 'Domperidone', category: 'Gastroenterology', manufacturer: 'Janssen' },

  // Respiratory
  { name: 'Ventolin', activeIngredient: 'Salbutamol', category: 'Respiratory', manufacturer: 'GSK' },
  { name: 'Symbicort', activeIngredient: 'Budesonide/Formoterol', category: 'Respiratory', manufacturer: 'AstraZeneca' },
  { name: 'Singulair', activeIngredient: 'Montelukast', category: 'Respiratory', manufacturer: 'Organon' },
  { name: 'Zithromax', activeIngredient: 'Azithromycin', category: 'Respiratory', manufacturer: 'Pfizer' },
  { name: 'Claric', activeIngredient: 'Clarithromycin', category: 'Respiratory', manufacturer: 'Abbott' },

  // Neurology / Psychiatry
  { name: 'Panadol', activeIngredient: 'Paracetamol', category: 'General', manufacturer: 'GSK' },
  { name: 'Brufen', activeIngredient: 'Ibuprofen', category: 'General', manufacturer: 'Abbott' },
  { name: 'Voltaren', activeIngredient: 'Diclofenac', category: 'General', manufacturer: 'Novartis' },
  { name: 'Cataflam', activeIngredient: 'Diclofenac Potassium', category: 'General', manufacturer: 'Novartis' },
  { name: 'Neurontin', activeIngredient: 'Gabapentin', category: 'Neurology', manufacturer: 'Pfizer' },
  { name: 'Lyrica', activeIngredient: 'Pregabalin', category: 'Neurology', manufacturer: 'Pfizer' },
  { name: 'Cipralex', activeIngredient: 'Escitalopram', category: 'Psychiatry', manufacturer: 'Lundbeck' },
  { name: 'Zoloft', activeIngredient: 'Sertraline', category: 'Psychiatry', manufacturer: 'Pfizer' },

  // Pediatrics & General Antibiotics
  { name: 'Augmentin', activeIngredient: 'Amoxicillin/Clavulanate', category: 'Antibiotics', manufacturer: 'GSK' },
  { name: 'Amoxil', activeIngredient: 'Amoxicillin', category: 'Antibiotics', manufacturer: 'GSK' },
  { name: 'Cipro', activeIngredient: 'Ciprofloxacin', category: 'Antibiotics', manufacturer: 'Bayer' },
  { name: 'Flagyl', activeIngredient: 'Metronidazole', category: 'Antibiotics', manufacturer: 'Sanofi' },
  { name: 'Zyrtec', activeIngredient: 'Cetirizine', category: 'Allergy', manufacturer: 'GSK' },
  { name: 'Claritin', activeIngredient: 'Loratadine', category: 'Allergy', manufacturer: 'Bayer' },
  { name: 'Telfast', activeIngredient: 'Fexofenadine', category: 'Allergy', manufacturer: 'Sanofi' },

  // Supplements
  { name: 'Vitamin D3', activeIngredient: 'Cholecalciferol', category: 'Supplements', manufacturer: 'Various' },
  { name: 'Centrum', activeIngredient: 'Multivitamins', category: 'Supplements', manufacturer: 'GSK' },
  { name: 'Feroglobin', activeIngredient: 'Iron & Vitamins', category: 'Supplements', manufacturer: 'Vitabiotics' },
  { name: 'Osteocare', activeIngredient: 'Calcium & Magnesium', category: 'Supplements', manufacturer: 'Vitabiotics' }
];

async function main() {
  console.log('Seeding medications...');
  let count = 0;
  for (const med of medications) {
    try {
      await prisma.medication.upsert({
        where: { name: med.name },
        update: med,
        create: med,
      });
      count++;
    } catch (e) {
      console.error(`Error seeding ${med.name}:`, e);
    }
  }
  console.log(`Successfully seeded ${count} medications.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
