const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const medications = [
  // === Category: Analgesics & Anti-inflammatory (مسكنات ومضادات الالتهاب) ===
  {
    name: "Panadol Advance 500mg",
    activeIngredient: "Paracetamol",
    manufacturer: "GSK",
    category: "Analgesic",
    strength: "500mg",
    form: "أقراص",
    therapeuticClass: "NSAID / Analgesic",
    route: "Oral",
    price: 30.0
  },
  {
    name: "Panadol Extra",
    activeIngredient: "Paracetamol / Caffeine",
    manufacturer: "GSK",
    category: "Analgesic",
    strength: "500mg/65mg",
    form: "أقراص",
    therapeuticClass: "NSAID / Analgesic",
    route: "Oral",
    price: 45.0
  },
  {
    name: "Panadol Joint 665mg",
    activeIngredient: "Paracetamol",
    manufacturer: "GSK",
    category: "Analgesic",
    strength: "665mg",
    form: "أقراص ممتدة المفعول",
    therapeuticClass: "NSAID / Analgesic",
    route: "Oral",
    price: 55.0
  },
  {
    name: "Panadol Migraine",
    activeIngredient: "Paracetamol / Aspirin / Caffeine",
    manufacturer: "GSK",
    category: "Analgesic",
    strength: "250mg/250mg/65mg",
    form: "أقراص",
    therapeuticClass: "Migraine Remedy",
    route: "Oral",
    price: 50.0
  },
  {
    name: "Brufen 200mg",
    activeIngredient: "Ibuprofen",
    manufacturer: "Abbott",
    category: "Analgesic",
    strength: "200mg",
    form: "أقراص",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 25.0
  },
  {
    name: "Brufen 400mg",
    activeIngredient: "Ibuprofen",
    manufacturer: "Abbott",
    category: "Analgesic",
    strength: "400mg",
    form: "أقراص",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 40.0
  },
  {
    name: "Brufen 600mg",
    activeIngredient: "Ibuprofen",
    manufacturer: "Abbott",
    category: "Analgesic",
    strength: "600mg",
    form: "أقراص",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 50.0
  },
  {
    name: "Brufen Syrup",
    activeIngredient: "Ibuprofen",
    manufacturer: "Abbott",
    category: "Analgesic",
    strength: "100mg/5ml",
    form: "شراب",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 30.0
  },
  {
    name: "Cataflam 25mg",
    activeIngredient: "Diclofenac Potassium",
    manufacturer: "Novartis",
    category: "Analgesic",
    strength: "25mg",
    form: "أقراص",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 35.0
  },
  {
    name: "Cataflam 50mg",
    activeIngredient: "Diclofenac Potassium",
    manufacturer: "Novartis",
    category: "Analgesic",
    strength: "50mg",
    form: "أقراص",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 48.0
  },
  {
    name: "Cataflam 75mg Ampoule",
    activeIngredient: "Diclofenac Potassium",
    manufacturer: "Novartis",
    category: "Analgesic",
    strength: "75mg/3ml",
    form: "حقن عضلية",
    therapeuticClass: "NSAID / Injectable",
    route: "Intramuscular",
    price: 60.0
  },
  {
    name: "Voltaren 75mg Ampoule",
    activeIngredient: "Diclofenac Sodium",
    manufacturer: "Novartis",
    category: "Analgesic",
    strength: "75mg/3ml",
    form: "حقن عضلية",
    therapeuticClass: "NSAID / Injectable",
    route: "Intramuscular",
    price: 65.0
  },
  {
    name: "Voltaren 100mg Suppository",
    activeIngredient: "Diclofenac Sodium",
    manufacturer: "Novartis",
    category: "Analgesic",
    strength: "100mg",
    form: "لبوس شرجي",
    therapeuticClass: "NSAID / Suppository",
    route: "Rectal",
    price: 45.0
  },
  {
    name: "Voltaren Emulgel 100g",
    activeIngredient: "Diclofenac Diethylammonium",
    manufacturer: "Novartis",
    category: "Analgesic",
    strength: "1%",
    form: "جل موضعي",
    therapeuticClass: "NSAID / Topical Gel",
    route: "Topical",
    price: 120.0
  },
  {
    name: "Adolor 30mg Ampoule",
    activeIngredient: "Ketorolac Tromethamine",
    manufacturer: "Pharco",
    category: "Analgesic",
    strength: "30mg/1ml",
    form: "حقن",
    therapeuticClass: "NSAID / Potent Analgesic",
    route: "Intramuscular / Intravenous",
    price: 38.0
  },
  {
    name: "Ketofan 50mg",
    activeIngredient: "Ketoprofen",
    manufacturer: "Amriya",
    category: "Analgesic",
    strength: "50mg",
    form: "كبسولات",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 20.0
  },
  {
    name: "Ketofan 100mg",
    activeIngredient: "Ketoprofen",
    manufacturer: "Amriya",
    category: "Analgesic",
    strength: "100mg",
    form: "كبسولات",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 32.0
  },
  {
    name: "Feldene 20mg Capsule",
    activeIngredient: "Piroxicam",
    manufacturer: "Pfizer",
    category: "Analgesic",
    strength: "20mg",
    form: "كبسولات",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 42.0
  },
  {
    name: "Feldene Gel",
    activeIngredient: "Piroxicam",
    manufacturer: "Pfizer",
    category: "Analgesic",
    strength: "0.5%",
    form: "جل موضعي",
    therapeuticClass: "NSAID / Topical",
    route: "Topical",
    price: 30.0
  },
  {
    name: "Cetal 500mg",
    activeIngredient: "Paracetamol",
    manufacturer: "EPICO",
    category: "Analgesic",
    strength: "500mg",
    form: "أقراص",
    therapeuticClass: "Analgesic / Antipyretic",
    route: "Oral",
    price: 15.0
  },
  {
    name: "Cetal Drops",
    activeIngredient: "Paracetamol",
    manufacturer: "EPICO",
    category: "Analgesic",
    strength: "100mg/ml",
    form: "نقط للفم للاطفال",
    therapeuticClass: "Analgesic / Antipyretic",
    route: "Oral",
    price: 18.0
  },
  {
    name: "Cetal Suspension",
    activeIngredient: "Paracetamol",
    manufacturer: "EPICO",
    category: "Analgesic",
    strength: "250mg/5ml",
    form: "شراب للأطفال",
    therapeuticClass: "Analgesic / Antipyretic",
    route: "Oral",
    price: 22.0
  },
  {
    name: "Novaldol 1000mg",
    activeIngredient: "Paracetamol",
    manufacturer: "Sanofi",
    category: "Analgesic",
    strength: "1000mg",
    form: "أقراص",
    therapeuticClass: "Analgesic / Antipyretic",
    route: "Oral",
    price: 40.0
  },
  {
    name: "Migranil",
    activeIngredient: "Ergotamine / Caffeine / Paracetamol",
    manufacturer: "ADWIA",
    category: "Analgesic",
    strength: "1mg/100mg/250mg",
    form: "أقراص",
    therapeuticClass: "Anti-Migraine",
    route: "Oral",
    price: 36.0
  },
  {
    name: "Spasmo-Amigran",
    activeIngredient: "Ergotamine / Caffeine / Camylofin / Analgin",
    manufacturer: "Amriya",
    category: "Analgesic",
    strength: "1mg/100mg/10mg/500mg",
    form: "أقراص",
    therapeuticClass: "Anti-Migraine / Antispasmodic",
    route: "Oral",
    price: 45.0
  },
  {
    name: "Celebrex 100mg",
    activeIngredient: "Celecoxib",
    manufacturer: "Pfizer",
    category: "Analgesic",
    strength: "100mg",
    form: "كبسولات",
    therapeuticClass: "Selective COX-2 Inhibitor",
    route: "Oral",
    price: 95.0
  },
  {
    name: "Celebrex 200mg",
    activeIngredient: "Celecoxib",
    manufacturer: "Pfizer",
    category: "Analgesic",
    strength: "200mg",
    form: "كبسولات",
    therapeuticClass: "Selective COX-2 Inhibitor",
    route: "Oral",
    price: 160.0
  },
  {
    name: "Arcoxia 60mg",
    activeIngredient: "Etoricoxib",
    manufacturer: "MSD",
    category: "Analgesic",
    strength: "60mg",
    form: "أقراص",
    therapeuticClass: "Selective COX-2 Inhibitor",
    route: "Oral",
    price: 130.0
  },
  {
    name: "Arcoxia 90mg",
    activeIngredient: "Etoricoxib",
    manufacturer: "MSD",
    category: "Analgesic",
    strength: "90mg",
    form: "أقراص",
    therapeuticClass: "Selective COX-2 Inhibitor",
    route: "Oral",
    price: 155.0
  },
  {
    name: "Arcoxia 120mg",
    activeIngredient: "Etoricoxib",
    manufacturer: "MSD",
    category: "Analgesic",
    strength: "120mg",
    form: "أقراص",
    therapeuticClass: "Selective COX-2 Inhibitor",
    route: "Oral",
    price: 180.0
  },
  {
    name: "Lornoxicam 8mg",
    activeIngredient: "Lornoxicam",
    manufacturer: "Sigma",
    category: "Analgesic",
    strength: "8mg",
    form: "أقراص",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 36.0
  },
  {
    name: "Melocam 15mg",
    activeIngredient: "Meloxicam",
    manufacturer: "Apex",
    category: "Analgesic",
    strength: "15mg",
    form: "أقراص",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 45.0
  },
  {
    name: "Proxen 500mg",
    activeIngredient: "Naproxen",
    manufacturer: "Kahira",
    category: "Analgesic",
    strength: "500mg",
    form: "أقراص",
    therapeuticClass: "NSAID",
    route: "Oral",
    price: 52.0
  },

  // === Category: Antibiotics & Anti-infectives (المضادات الحيوية) ===
  {
    name: "Augmentin 1g",
    activeIngredient: "Amoxicillin / Clavulanic Acid",
    manufacturer: "GSK",
    category: "Antibiotic",
    strength: "1g",
    form: "أقراص",
    therapeuticClass: "Penicillin Antibiotic",
    route: "Oral",
    price: 120.0
  },
  {
    name: "Augmentin 625mg",
    activeIngredient: "Amoxicillin / Clavulanic Acid",
    manufacturer: "GSK",
    category: "Antibiotic",
    strength: "625mg",
    form: "أقراص",
    therapeuticClass: "Penicillin Antibiotic",
    route: "Oral",
    price: 90.0
  },
  {
    name: "Augmentin Suspension 457mg",
    activeIngredient: "Amoxicillin / Clavulanic Acid",
    manufacturer: "GSK",
    category: "Antibiotic",
    strength: "457mg/5ml",
    form: "معلق شراب للأطفال",
    therapeuticClass: "Penicillin Antibiotic",
    route: "Oral",
    price: 75.0
  },
  {
    name: "Curam 1g",
    activeIngredient: "Amoxicillin / Clavulanic Acid",
    manufacturer: "Sandoz",
    category: "Antibiotic",
    strength: "1g",
    form: "أقراص",
    therapeuticClass: "Penicillin Antibiotic",
    route: "Oral",
    price: 110.0
  },
  {
    name: "Curam Suspension 228mg",
    activeIngredient: "Amoxicillin / Clavulanic Acid",
    manufacturer: "Sandoz",
    category: "Antibiotic",
    strength: "228.5mg/5ml",
    form: "معلق شراب للأطفال",
    therapeuticClass: "Penicillin Antibiotic",
    route: "Oral",
    price: 60.0
  },
  {
    name: "Flumox 1g",
    activeIngredient: "Amoxicillin / Flucloxacillin",
    manufacturer: "EPICO",
    category: "Antibiotic",
    strength: "1g",
    form: "أقراص",
    therapeuticClass: "Broad Spectrum Antibiotic",
    route: "Oral",
    price: 68.0
  },
  {
    name: "Flumox 500mg",
    activeIngredient: "Amoxicillin / Flucloxacillin",
    manufacturer: "EPICO",
    category: "Antibiotic",
    strength: "500mg",
    form: "كبسولات",
    therapeuticClass: "Broad Spectrum Antibiotic",
    route: "Oral",
    price: 45.0
  },
  {
    name: "Megamox 1g",
    activeIngredient: "Amoxicillin / Clavulanic Acid",
    manufacturer: "Hikma",
    category: "Antibiotic",
    strength: "1g",
    form: "أقراص",
    therapeuticClass: "Penicillin Antibiotic",
    route: "Oral",
    price: 105.0
  },
  {
    name: "Amoxil 500mg Capsule",
    activeIngredient: "Amoxicillin",
    manufacturer: "GSK",
    category: "Antibiotic",
    strength: "500mg",
    form: "كبسولات",
    therapeuticClass: "Broad Spectrum Penicillin",
    route: "Oral",
    price: 38.0
  },
  {
    name: "Velosef 1g Capsule",
    activeIngredient: "Cephradine",
    manufacturer: "Squibb",
    category: "Antibiotic",
    strength: "1g",
    form: "كبسولات",
    therapeuticClass: "First-Generation Cephalosporin",
    route: "Oral",
    price: 75.0
  },
  {
    name: "Velosef 500mg",
    activeIngredient: "Cephradine",
    manufacturer: "Squibb",
    category: "Antibiotic",
    strength: "500mg",
    form: "كبسولات",
    therapeuticClass: "First-Generation Cephalosporin",
    route: "Oral",
    price: 50.0
  },
  {
    name: "Duricef 1g",
    activeIngredient: "Cefadroxil",
    manufacturer: "Bristol-Myers Squibb",
    category: "Antibiotic",
    strength: "1g",
    form: "أقراص",
    therapeuticClass: "First-Generation Cephalosporin",
    route: "Oral",
    price: 60.0
  },
  {
    name: "Cefotax 1g Injection",
    activeIngredient: "Cefotaxime",
    manufacturer: "EPICO",
    category: "Antibiotic",
    strength: "1g",
    form: "حقن وريد / عضل",
    therapeuticClass: "Third-Generation Cephalosporin",
    route: "Intravenous / Intramuscular",
    price: 45.0
  },
  {
    name: "Cefotax 500mg Injection",
    activeIngredient: "Cefotaxime",
    manufacturer: "EPICO",
    category: "Antibiotic",
    strength: "500mg",
    form: "حقن وريد / عضل",
    therapeuticClass: "Third-Generation Cephalosporin",
    route: "Intravenous / Intramuscular",
    price: 32.0
  },
  {
    name: "Keftrex 1g Injection",
    activeIngredient: "Ceftriaxone",
    manufacturer: "Pharco",
    category: "Antibiotic",
    strength: "1g",
    form: "حقن وريد / عضل",
    therapeuticClass: "Third-Generation Cephalosporin",
    route: "Intravenous / Intramuscular",
    price: 70.0
  },
  {
    name: "Zithromax 500mg",
    activeIngredient: "Azithromycin",
    manufacturer: "Pfizer",
    category: "Antibiotic",
    strength: "500mg",
    form: "أقراص",
    therapeuticClass: "Macrolide Antibiotic",
    route: "Oral",
    price: 90.0
  },
  {
    name: "Zithromax Suspension",
    activeIngredient: "Azithromycin",
    manufacturer: "Pfizer",
    category: "Antibiotic",
    strength: "200mg/5ml",
    form: "معلق شراب للأطفال",
    therapeuticClass: "Macrolide Antibiotic",
    route: "Oral",
    price: 72.0
  },
  {
    name: "Klacid 500mg",
    activeIngredient: "Clarithromycin",
    manufacturer: "Abbott",
    category: "Antibiotic",
    strength: "500mg",
    form: "أقراص",
    therapeuticClass: "Macrolide Antibiotic",
    route: "Oral",
    price: 140.0
  },
  {
    name: "Ciprofar 500mg",
    activeIngredient: "Ciprofloxacin",
    manufacturer: "Pharco",
    category: "Antibiotic",
    strength: "500mg",
    form: "أقراص",
    therapeuticClass: "Fluoroquinolone Antibiotic",
    route: "Oral",
    price: 52.0
  },
  {
    name: "Ciprofar 750mg",
    activeIngredient: "Ciprofloxacin",
    manufacturer: "Pharco",
    category: "Antibiotic",
    strength: "750mg",
    form: "أقراص",
    therapeuticClass: "Fluoroquinolone Antibiotic",
    route: "Oral",
    price: 68.0
  },
  {
    name: "Tavanic 500mg",
    activeIngredient: "Levofloxacin",
    manufacturer: "Sanofi",
    category: "Antibiotic",
    strength: "500mg",
    form: "أقراص",
    therapeuticClass: "Fluoroquinolone Antibiotic",
    route: "Oral",
    price: 180.0
  },
  {
    name: "Vibramycin 100mg",
    activeIngredient: "Doxycycline",
    manufacturer: "Pfizer",
    category: "Antibiotic",
    strength: "100mg",
    form: "كبسولات",
    therapeuticClass: "Tetracycline Antibiotic",
    route: "Oral",
    price: 45.0
  },
  {
    name: "Dalacin C 300mg",
    activeIngredient: "Clindamycin",
    manufacturer: "Pfizer",
    category: "Antibiotic",
    strength: "300mg",
    form: "كبسولات",
    therapeuticClass: "Lincosamide Antibiotic",
    route: "Oral",
    price: 135.0
  },
  {
    name: "Flagyl 500mg Tablet",
    activeIngredient: "Metronidazole",
    manufacturer: "Sanofi",
    category: "Antibiotic",
    strength: "500mg",
    form: "أقراص",
    therapeuticClass: "Antiprotozoal / Antibacterial",
    route: "Oral",
    price: 30.0
  },
  {
    name: "Flagyl Syrup",
    activeIngredient: "Metronidazole Benzoate",
    manufacturer: "Sanofi",
    category: "Antibiotic",
    strength: "125mg/5ml",
    form: "شراب",
    therapeuticClass: "Antiprotozoal / Antibacterial",
    route: "Oral",
    price: 20.0
  },
  {
    name: "Amrizole 500mg",
    activeIngredient: "Metronidazole",
    manufacturer: "Amriya",
    category: "Antibiotic",
    strength: "500mg",
    form: "أقراص",
    therapeuticClass: "Antiprotozoal / Antibacterial",
    route: "Oral",
    price: 24.0
  },
  {
    name: "Septrin DS",
    activeIngredient: "Sulfamethoxazole / Trimethoprim",
    manufacturer: "GSK",
    category: "Antibiotic",
    strength: "800mg/160mg",
    form: "أقراص",
    therapeuticClass: "Sulfonamide Antibiotic",
    route: "Oral",
    price: 36.0
  },

  // === Category: Cardiovascular & Antihypertensives (أدوية القلب والضغط) ===
  {
    name: "Concor 5mg",
    activeIngredient: "Bisoprolol Fumarate",
    manufacturer: "Merck",
    category: "Cardiovascular",
    strength: "5mg",
    form: "أقراص",
    therapeuticClass: "Beta-Blocker",
    route: "Oral",
    price: 45.0
  },
  {
    name: "Concor 2.5mg",
    activeIngredient: "Bisoprolol Fumarate",
    manufacturer: "Merck",
    category: "Cardiovascular",
    strength: "2.5mg",
    form: "أقراص",
    therapeuticClass: "Beta-Blocker",
    route: "Oral",
    price: 38.0
  },
  {
    name: "Concor 5mg Plus",
    activeIngredient: "Bisoprolol Fumarate / Hydrochlorothiazide",
    manufacturer: "Merck",
    category: "Cardiovascular",
    strength: "5mg/12.5mg",
    form: "أقراص",
    therapeuticClass: "Beta-Blocker & Diuretic",
    route: "Oral",
    price: 52.0
  },
  {
    name: "Capoten 25mg",
    activeIngredient: "Captopril",
    manufacturer: "Squibb",
    category: "Cardiovascular",
    strength: "25mg",
    form: "أقراص",
    therapeuticClass: "ACE Inhibitor",
    route: "Oral",
    price: 30.0
  },
  {
    name: "Capoten 50mg",
    activeIngredient: "Captopril",
    manufacturer: "Squibb",
    category: "Cardiovascular",
    strength: "50mg",
    form: "أقراص",
    therapeuticClass: "ACE Inhibitor",
    route: "Oral",
    price: 42.0
  },
  {
    name: "Zestril 10mg",
    activeIngredient: "Lisinopril",
    manufacturer: "AstraZeneca",
    category: "Cardiovascular",
    strength: "10mg",
    form: "أقراص",
    therapeuticClass: "ACE Inhibitor",
    route: "Oral",
    price: 60.0
  },
  {
    name: "Zestril 20mg",
    activeIngredient: "Lisinopril",
    manufacturer: "AstraZeneca",
    category: "Cardiovascular",
    strength: "20mg",
    form: "أقراص",
    therapeuticClass: "ACE Inhibitor",
    route: "Oral",
    price: 85.0
  },
  {
    name: "Exforge 5/160mg",
    activeIngredient: "Amlodipine / Valsartan",
    manufacturer: "Novartis",
    category: "Cardiovascular",
    strength: "5mg/160mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Calcium Channel Blocker & ARB",
    route: "Oral",
    price: 185.0
  },
  {
    name: "Exforge 10/160mg",
    activeIngredient: "Amlodipine / Valsartan",
    manufacturer: "Novartis",
    category: "Cardiovascular",
    strength: "10mg/160mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Calcium Channel Blocker & ARB",
    route: "Oral",
    price: 210.0
  },
  {
    name: "Atacand 16mg",
    activeIngredient: "Candesartan Cilexetil",
    manufacturer: "AstraZeneca",
    category: "Cardiovascular",
    strength: "16mg",
    form: "أقراص",
    therapeuticClass: "Angiotensin II Receptor Blocker (ARB)",
    route: "Oral",
    price: 110.0
  },
  {
    name: "Micardis 80mg",
    activeIngredient: "Telmisartan",
    manufacturer: "Boehringer Ingelheim",
    category: "Cardiovascular",
    strength: "80mg",
    form: "أقراص",
    therapeuticClass: "Angiotensin II Receptor Blocker (ARB)",
    route: "Oral",
    price: 160.0
  },
  {
    name: "Natrilix SR 1.5mg",
    activeIngredient: "Indapamide",
    manufacturer: "Servier",
    category: "Cardiovascular",
    strength: "1.5mg",
    form: "أقراص ممتدة المفعول",
    therapeuticClass: "Thiazide-like Diuretic",
    route: "Oral",
    price: 75.0
  },
  {
    name: "Lasix 40mg",
    activeIngredient: "Furosemide",
    manufacturer: "Sanofi",
    category: "Cardiovascular",
    strength: "40mg",
    form: "أقراص",
    therapeuticClass: "Loop Diuretic",
    route: "Oral",
    price: 20.0
  },
  {
    name: "Lasix Ampoule 20mg",
    activeIngredient: "Furosemide",
    manufacturer: "Sanofi",
    category: "Cardiovascular",
    strength: "20mg/2ml",
    form: "حقن وريدية / عضلية",
    therapeuticClass: "Loop Diuretic",
    route: "Intravenous / Intramuscular",
    price: 30.0
  },
  {
    name: "Aldactone 100mg",
    activeIngredient: "Spironolactone",
    manufacturer: "Pfizer",
    category: "Cardiovascular",
    strength: "100mg",
    form: "أقراص",
    therapeuticClass: "Aldosterone Antagonist / Diuretic",
    route: "Oral",
    price: 85.0
  },
  {
    name: "Norvasc 5mg",
    activeIngredient: "Amlodipine Besylate",
    manufacturer: "Pfizer",
    category: "Cardiovascular",
    strength: "5mg",
    form: "أقراص",
    therapeuticClass: "Calcium Channel Blocker",
    route: "Oral",
    price: 120.0
  },
  {
    name: "Norvasc 10mg",
    activeIngredient: "Amlodipine Besylate",
    manufacturer: "Pfizer",
    category: "Cardiovascular",
    strength: "10mg",
    form: "أقراص",
    therapeuticClass: "Calcium Channel Blocker",
    route: "Oral",
    price: 180.0
  },
  {
    name: "Adalat Retard 20mg",
    activeIngredient: "Nifedipine",
    manufacturer: "Bayer",
    category: "Cardiovascular",
    strength: "20mg",
    form: "أقراص ممتدة المفعول",
    therapeuticClass: "Calcium Channel Blocker",
    route: "Oral",
    price: 65.0
  },
  {
    name: "Aspirin Protect 100mg",
    activeIngredient: "Acetylsalicylic Acid",
    manufacturer: "Bayer",
    category: "Cardiovascular",
    strength: "100mg",
    form: "أقراص مغلفة معوياً",
    therapeuticClass: "Antiplatelet / Aspirin",
    route: "Oral",
    price: 25.0
  },
  {
    name: "Plavix 75mg",
    activeIngredient: "Clopidogrel Bisulfate",
    manufacturer: "Sanofi",
    category: "Cardiovascular",
    strength: "75mg",
    form: "أقراص",
    therapeuticClass: "Antiplatelet Agent",
    route: "Oral",
    price: 205.0
  },
  {
    name: "Clexane 40mg Injection",
    activeIngredient: "Enoxaparin Sodium",
    manufacturer: "Sanofi",
    category: "Cardiovascular",
    strength: "40mg/0.4ml",
    form: "حقن معبأة مسبقاً تحت الجلد",
    therapeuticClass: "Low Molecular Weight Heparin",
    route: "Subcutaneous",
    price: 140.0
  },
  {
    name: "Clexane 60mg Injection",
    activeIngredient: "Enoxaparin Sodium",
    manufacturer: "Sanofi",
    category: "Cardiovascular",
    strength: "60mg/0.6ml",
    form: "حقن معبأة مسبقاً تحت الجلد",
    therapeuticClass: "Low Molecular Weight Heparin",
    route: "Subcutaneous",
    price: 180.0
  },
  {
    name: "Lipitor 10mg",
    activeIngredient: "Atorvastatin Calcium",
    manufacturer: "Pfizer",
    category: "Cardiovascular",
    strength: "10mg",
    form: "أقراص",
    therapeuticClass: "Statin / Lipid Regulator",
    route: "Oral",
    price: 150.0
  },
  {
    name: "Lipitor 20mg",
    activeIngredient: "Atorvastatin Calcium",
    manufacturer: "Pfizer",
    category: "Cardiovascular",
    strength: "20mg",
    form: "أقراص",
    therapeuticClass: "Statin / Lipid Regulator",
    route: "Oral",
    price: 210.0
  },
  {
    name: "Lipitor 40mg",
    activeIngredient: "Atorvastatin Calcium",
    manufacturer: "Pfizer",
    category: "Cardiovascular",
    strength: "40mg",
    form: "أقراص",
    therapeuticClass: "Statin / Lipid Regulator",
    route: "Oral",
    price: 260.0
  },
  {
    name: "Crestor 10mg",
    activeIngredient: "Rosuvastatin Calcium",
    manufacturer: "AstraZeneca",
    category: "Cardiovascular",
    strength: "10mg",
    form: "أقراص",
    therapeuticClass: "Statin / Lipid Regulator",
    route: "Oral",
    price: 160.0
  },
  {
    name: "Crestor 20mg",
    activeIngredient: "Rosuvastatin Calcium",
    manufacturer: "AstraZeneca",
    category: "Cardiovascular",
    strength: "20mg",
    form: "أقراص",
    therapeuticClass: "Statin / Lipid Regulator",
    route: "Oral",
    price: 230.0
  },
  {
    name: "Lanoxin 0.25mg",
    activeIngredient: "Digoxin",
    manufacturer: "GSK",
    category: "Cardiovascular",
    strength: "0.25mg",
    form: "أقراص",
    therapeuticClass: "Cardiac Glycoside",
    route: "Oral",
    price: 22.0
  },
  {
    name: "Cordarone 200mg",
    activeIngredient: "Amiodarone Hydrochloride",
    manufacturer: "Sanofi",
    category: "Cardiovascular",
    strength: "200mg",
    form: "أقراص",
    therapeuticClass: "Anti-Arrhythmic",
    route: "Oral",
    price: 68.0
  },

  // === Category: Gastrointestinal (أدوية الجهاز الهضمي) ===
  {
    name: "Antinal Capsule 200mg",
    activeIngredient: "Nifuroxazide",
    manufacturer: "Amriya",
    category: "Gastrointestinal",
    strength: "200mg",
    form: "كبسولات",
    therapeuticClass: "Intestinal Antiseptic",
    route: "Oral",
    price: 36.0
  },
  {
    name: "Antinal Syrup",
    activeIngredient: "Nifuroxazide",
    manufacturer: "Amriya",
    category: "Gastrointestinal",
    strength: "220mg/5ml",
    form: "شراب معلق للأطفال",
    therapeuticClass: "Intestinal Antiseptic",
    route: "Oral",
    price: 26.0
  },
  {
    name: "Streptoquin",
    activeIngredient: "Diiodohydroxyquinoline / Phthalylsulfathiazole / Streptomycin Sulfate",
    manufacturer: "Pharco",
    category: "Gastrointestinal",
    strength: "200mg/200mg/100mg",
    form: "أقراص",
    therapeuticClass: "Anti-diarrheal / Antispasmodic",
    route: "Oral",
    price: 24.0
  },
  {
    name: "Controloc 40mg",
    activeIngredient: "Pantoprazole Sodium",
    manufacturer: "Takeda",
    category: "Gastrointestinal",
    strength: "40mg",
    form: "أقراص مقاومة لعصارة المعدة",
    therapeuticClass: "Proton Pump Inhibitor (PPI)",
    route: "Oral",
    price: 135.0
  },
  {
    name: "Controloc 20mg",
    activeIngredient: "Pantoprazole Sodium",
    manufacturer: "Takeda",
    category: "Gastrointestinal",
    strength: "20mg",
    form: "أقراص مقاومة لعصارة المعدة",
    therapeuticClass: "Proton Pump Inhibitor (PPI)",
    route: "Oral",
    price: 90.0
  },
  {
    name: "Nexium 40mg",
    activeIngredient: "Esomeprazole",
    manufacturer: "AstraZeneca",
    category: "Gastrointestinal",
    strength: "40mg",
    form: "أقراص مقاومة لعصارة المعدة",
    therapeuticClass: "Proton Pump Inhibitor (PPI)",
    route: "Oral",
    price: 220.0
  },
  {
    name: "Nexium 20mg",
    activeIngredient: "Esomeprazole",
    manufacturer: "AstraZeneca",
    category: "Gastrointestinal",
    strength: "20mg",
    form: "أقراص مقاومة لعصارة المعدة",
    therapeuticClass: "Proton Pump Inhibitor (PPI)",
    route: "Oral",
    price: 155.0
  },
  {
    name: "Omez 20mg Capsule",
    activeIngredient: "Omeprazole",
    manufacturer: "Pharco",
    category: "Gastrointestinal",
    strength: "20mg",
    form: "كبسولات مغلفة معوياً",
    therapeuticClass: "Proton Pump Inhibitor (PPI)",
    route: "Oral",
    price: 33.0
  },
  {
    name: "Antodine 40mg",
    activeIngredient: "Famotidine",
    manufacturer: "Amriya",
    category: "Gastrointestinal",
    strength: "40mg",
    form: "أقراص",
    therapeuticClass: "H2-Receptor Antagonist",
    route: "Oral",
    price: 48.0
  },
  {
    name: "Spasmo-Digestin",
    activeIngredient: "Dicyclomine / Papain / Sanzyme / Dehydrocholic Acid",
    manufacturer: "Pharco",
    category: "Gastrointestinal",
    strength: "Complex",
    form: "أقراص",
    therapeuticClass: "Digestive Enzymes & Antispasmodic",
    route: "Oral",
    price: 30.0
  },
  {
    name: "Digestin",
    activeIngredient: "Pepsin / Sanzyme",
    manufacturer: "Pharco",
    category: "Gastrointestinal",
    strength: "Complex",
    form: "أقراص",
    therapeuticClass: "Digestive Enzymes",
    route: "Oral",
    price: 22.0
  },
  {
    name: "Motilium 10mg",
    activeIngredient: "Domperidone",
    manufacturer: "Janssen",
    category: "Gastrointestinal",
    strength: "10mg",
    form: "أقراص",
    therapeuticClass: "Antiemetic / Prokinetic",
    route: "Oral",
    price: 55.0
  },
  {
    name: "Gastreg 200mg",
    activeIngredient: "Trimebutine Maleate",
    manufacturer: "Amriya",
    category: "Gastrointestinal",
    strength: "200mg",
    form: "أقراص",
    therapeuticClass: "Gastrointestinal Regulator",
    route: "Oral",
    price: 52.0
  },
  {
    name: "Primeperan 10mg",
    activeIngredient: "Metoclopramide Hydrochloride",
    manufacturer: "Sanofi",
    category: "Gastrointestinal",
    strength: "10mg",
    form: "أقراص",
    therapeuticClass: "Antiemetic / Dopamine Antagonist",
    route: "Oral",
    price: 18.0
  },
  {
    name: "Mucogel Suspension 180ml",
    activeIngredient: "Magnesium Hydroxide / Aluminium Hydroxide",
    manufacturer: "EPICO",
    category: "Gastrointestinal",
    strength: "Complex",
    form: "شراب معلق مضاد للحموضة",
    therapeuticClass: "Antacid",
    route: "Oral",
    price: 24.0
  },
  {
    name: "Epicogel Suspension",
    activeIngredient: "Aluminium Hydroxide / Magnesium Hydroxide / Dimethicone",
    manufacturer: "EPICO",
    category: "Gastrointestinal",
    strength: "Complex",
    form: "شراب مضاد للحموضة والانتفاخ",
    therapeuticClass: "Antacid & Antiflatulent",
    route: "Oral",
    price: 26.0
  },
  {
    name: "Gaviscon Liquid 150ml",
    activeIngredient: "Sodium Alginate / Sodium Bicarbonate / Calcium Carbonate",
    manufacturer: "Reckitt Benckiser",
    category: "Gastrointestinal",
    strength: "Complex",
    form: "شراب معلق لعلاج ارتجاع المريء",
    therapeuticClass: "Antacid / Reflux Barrier",
    route: "Oral",
    price: 90.0
  },
  {
    name: "Duspatalin Retard 200mg",
    activeIngredient: "Mebeverine Hydrochloride",
    manufacturer: "Abbott",
    category: "Gastrointestinal",
    strength: "200mg",
    form: "كبسولات ممتدة المفعول",
    therapeuticClass: "Antispasmodic for IBS",
    route: "Oral",
    price: 85.0
  },
  {
    name: "Coloverin D",
    activeIngredient: "Mebeverine Hydrochloride / Dimethicone",
    manufacturer: "Pharco",
    category: "Gastrointestinal",
    strength: "135mg/40mg",
    form: "أقراص",
    therapeuticClass: "Antispasmodic / Antiflatulent for IBS",
    route: "Oral",
    price: 48.0
  },
  {
    name: "Coloverin SR",
    activeIngredient: "Mebeverine Hydrochloride",
    manufacturer: "Pharco",
    category: "Gastrointestinal",
    strength: "200mg",
    form: "أقراص ممتدة المفعول",
    therapeuticClass: "Antispasmodic for IBS",
    route: "Oral",
    price: 55.0
  },
  {
    name: "Librax",
    activeIngredient: "Chlordiazepoxide / Clidinium Bromide",
    manufacturer: "Roche",
    category: "Gastrointestinal",
    strength: "5mg/2.5mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Anxiolytic / Antispasmodic for Colon",
    route: "Oral",
    price: 45.0
  },
  {
    name: "Visceralgine Tablets",
    activeIngredient: "Tiemonium Methylsulfate",
    manufacturer: "Sedico",
    category: "Gastrointestinal",
    strength: "50mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Antispasmodic",
    route: "Oral",
    price: 32.0
  },
  {
    name: "Duphalac Syrup 200ml",
    activeIngredient: "Lactulose",
    manufacturer: "Abbott",
    category: "Gastrointestinal",
    strength: "66.7g/100ml",
    form: "شراب ملين",
    therapeuticClass: "Osmotic Laxative",
    route: "Oral",
    price: 68.0
  },

  // === Category: Respiratory & Antihistamines (أدوية الجهاز التنفسي والحساسية) ===
  {
    name: "Ventolin Inhaler",
    activeIngredient: "Salbutamol (Albuterol)",
    manufacturer: "GSK",
    category: "Respiratory",
    strength: "100mcg/dose",
    form: "بخاخة صدر",
    therapeuticClass: "Bronchodilator (SABA)",
    route: "Inhalation",
    price: 85.0
  },
  {
    name: "Ventolin Syrup",
    activeIngredient: "Salbutamol",
    manufacturer: "GSK",
    category: "Respiratory",
    strength: "2mg/5ml",
    form: "شراب موسع للشعب الهوائية",
    therapeuticClass: "Bronchodilator (SABA)",
    route: "Oral",
    price: 24.0
  },
  {
    name: "Ventolin Respirator Solution",
    activeIngredient: "Salbutamol",
    manufacturer: "GSK",
    category: "Respiratory",
    strength: "5mg/ml (0.5%)",
    form: "محلول جلسات استنشاق بخار",
    therapeuticClass: "Bronchodilator",
    route: "Inhalation via Nebulizer",
    price: 50.0
  },
  {
    name: "Farcolin Nebulizer Solution",
    activeIngredient: "Salbutamol",
    manufacturer: "Pharco",
    category: "Respiratory",
    strength: "0.5%",
    form: "محلول جلسات استنشاق بخار",
    therapeuticClass: "Bronchodilator",
    route: "Inhalation via Nebulizer",
    price: 25.0
  },
  {
    name: "Symbicort Inhaler 160/4.5",
    activeIngredient: "Budesonide / Formoterol Fumarate",
    manufacturer: "AstraZeneca",
    category: "Respiratory",
    strength: "160mcg/4.5mcg",
    form: "بودرة استنشاق معبأة بالجرعة Turbuhaler",
    therapeuticClass: "Inhaled Corticosteroid & LABA",
    route: "Inhalation",
    price: 280.0
  },
  {
    name: "Seretide Evohaler 125mg",
    activeIngredient: "Fluticasone Propionate / Salmeterol",
    manufacturer: "GSK",
    category: "Respiratory",
    strength: "125mcg/25mcg",
    form: "بخاخة صدر بجرعات مقننة",
    therapeuticClass: "Inhaled Corticosteroid & LABA",
    route: "Inhalation",
    price: 260.0
  },
  {
    name: "Singulair 10mg",
    activeIngredient: "Montelukast Sodium",
    manufacturer: "MSD",
    category: "Respiratory",
    strength: "10mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Leukotriene Receptor Antagonist",
    route: "Oral",
    price: 180.0
  },
  {
    name: "Singulair 5mg Pediatric",
    activeIngredient: "Montelukast Sodium",
    manufacturer: "MSD",
    category: "Respiratory",
    strength: "5mg",
    form: "أقراص مضغ للأطفال",
    therapeuticClass: "Leukotriene Receptor Antagonist",
    route: "Oral",
    price: 150.0
  },
  {
    name: "Zyrtec 10mg",
    activeIngredient: "Cetirizine Hydrochloride",
    manufacturer: "GSK",
    category: "Respiratory",
    strength: "10mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Second-Generation Antihistamine",
    route: "Oral",
    price: 45.0
  },
  {
    name: "Zyrtec Drops 10ml",
    activeIngredient: "Cetirizine Hydrochloride",
    manufacturer: "GSK",
    category: "Respiratory",
    strength: "10mg/ml",
    form: "نقط للحساسية للفم للأطفال",
    therapeuticClass: "Second-Generation Antihistamine",
    route: "Oral",
    price: 36.0
  },
  {
    name: "Zyrtec Syrup",
    activeIngredient: "Cetirizine Hydrochloride",
    manufacturer: "GSK",
    category: "Respiratory",
    strength: "5mg/5ml",
    form: "شراب مضاد للحساسية للأطفال",
    therapeuticClass: "Second-Generation Antihistamine",
    route: "Oral",
    price: 32.0
  },
  {
    name: "Kestine 10mg",
    activeIngredient: "Ebastine",
    manufacturer: "Almirall",
    category: "Respiratory",
    strength: "10mg",
    form: "أقراص",
    therapeuticClass: "Second-Generation Antihistamine",
    route: "Oral",
    price: 55.0
  },
  {
    name: "Claritine 10mg",
    activeIngredient: "Loratadine",
    manufacturer: "Bayer",
    category: "Respiratory",
    strength: "10mg",
    form: "أقراص",
    therapeuticClass: "Second-Generation Antihistamine",
    route: "Oral",
    price: 60.0
  },
  {
    name: "Telfast 120mg",
    activeIngredient: "Fexofenadine Hydrochloride",
    manufacturer: "Sanofi",
    category: "Respiratory",
    strength: "120mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Second-Generation Antihistamine",
    route: "Oral",
    price: 90.0
  },
  {
    name: "Telfast 180mg",
    activeIngredient: "Fexofenadine Hydrochloride",
    manufacturer: "Sanofi",
    category: "Respiratory",
    strength: "180mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Second-Generation Antihistamine (High Potency)",
    route: "Oral",
    price: 110.0
  },
  {
    name: "Aerius 5mg",
    activeIngredient: "Desloratadine",
    manufacturer: "Organon",
    category: "Respiratory",
    strength: "5mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Second-Generation Antihistamine",
    route: "Oral",
    price: 75.0
  },
  {
    name: "Selgon Tablets",
    activeIngredient: "Pipazethate Hydrochloride",
    manufacturer: "EPICO",
    category: "Respiratory",
    strength: "20mg",
    form: "أقراص مهدئة للسعال",
    therapeuticClass: "Antitussive / Cough Suppressant",
    route: "Oral",
    price: 24.0
  },
  {
    name: "Selgon Drops 15ml",
    activeIngredient: "Pipazethate",
    manufacturer: "EPICO",
    category: "Respiratory",
    strength: "40mg/ml",
    form: "نقط مهدئة للسعال للفم",
    therapeuticClass: "Antitussive / Cough Suppressant",
    route: "Oral",
    price: 20.0
  },
  {
    name: "Sinecod Syrup 200ml",
    activeIngredient: "Butamirate Citrate",
    manufacturer: "Novartis",
    category: "Respiratory",
    strength: "1.5mg/ml",
    form: "شراب مهدئ للسعال الجاف",
    therapeuticClass: "Centrally Acting Antitussive",
    route: "Oral",
    price: 48.0
  },
  {
    name: "Bronchicum Elixir Syrup",
    activeIngredient: "Thyme Extract / Primula Root Extract",
    manufacturer: "Sanofi",
    category: "Respiratory",
    strength: "Natural Complex",
    form: "شراب طارد للبلغم ومذيب",
    therapeuticClass: "Herbal Mucolytic / Expectorant",
    route: "Oral",
    price: 45.0
  },
  {
    name: "Otrivin Adult Nasal Spray",
    activeIngredient: "Xylometazoline Hydrochloride",
    manufacturer: "Novartis",
    category: "Respiratory",
    strength: "0.1%",
    form: "بخاخة للأنف للبالغين مضادة للاحتقان",
    therapeuticClass: "Nasal Decongestant",
    route: "Nasal Spray",
    price: 25.0
  },
  {
    name: "Otrivin Child Nasal Drops",
    activeIngredient: "Xylometazoline",
    manufacturer: "Novartis",
    category: "Respiratory",
    strength: "0.05%",
    form: "نقط للأنف للأطفال مضادة للاحتقان",
    therapeuticClass: "Nasal Decongestant",
    route: "Nasal Drops",
    price: 20.0
  },
  {
    name: "Otrivin Baby Saline Spray",
    activeIngredient: "Sodium Chloride",
    manufacturer: "Novartis",
    category: "Respiratory",
    strength: "0.74%",
    form: "بخاخ أنف معقم للأطفال والرضع",
    therapeuticClass: "Nasal Saline Wash / Moisturizer",
    route: "Nasal Spray",
    price: 35.0
  },
  {
    name: "Solupred 20mg soluble",
    activeIngredient: "Prednisolone Sodium Phosphate",
    manufacturer: "Sanofi",
    category: "Respiratory",
    strength: "20mg",
    form: "أقراص قابلة للذوبان للفم",
    therapeuticClass: "Systemic Corticosteroid",
    route: "Oral",
    price: 68.0
  },
  {
    name: "Solupred 5mg soluble",
    activeIngredient: "Prednisolone Sodium Phosphate",
    manufacturer: "Sanofi",
    category: "Respiratory",
    strength: "5mg",
    form: "أقراص قابلة للذوبان للفم",
    therapeuticClass: "Systemic Corticosteroid",
    route: "Oral",
    price: 40.0
  },
  {
    name: "Hostacortin H 5mg",
    activeIngredient: "Prednisolone",
    manufacturer: "Sanofi",
    category: "Respiratory",
    strength: "5mg",
    form: "أقراص",
    therapeuticClass: "Corticosteroid",
    route: "Oral",
    price: 18.0
  },

  // === Category: Diabetes & Endocrine (أدوية السكري والغدد) ===
  {
    name: "Glucophage 1000mg",
    activeIngredient: "Metformin Hydrochloride",
    manufacturer: "Merck",
    category: "Endocrine",
    strength: "1000mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Oral Antidiabetic (Biguanide)",
    route: "Oral",
    price: 60.0
  },
  {
    name: "Glucophage XR 1000mg",
    activeIngredient: "Metformin Hydrochloride",
    manufacturer: "Merck",
    category: "Endocrine",
    strength: "1000mg",
    form: "أقراص ممتدة المفعول",
    therapeuticClass: "Oral Antidiabetic (Biguanide)",
    route: "Oral",
    price: 80.0
  },
  {
    name: "Glucophage 500mg",
    activeIngredient: "Metformin Hydrochloride",
    manufacturer: "Merck",
    category: "Endocrine",
    strength: "500mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Oral Antidiabetic (Biguanide)",
    route: "Oral",
    price: 36.0
  },
  {
    name: "Cidophage 1000mg",
    activeIngredient: "Metformin Hydrochloride",
    manufacturer: "CID",
    category: "Endocrine",
    strength: "1000mg",
    form: "أقراص",
    therapeuticClass: "Oral Antidiabetic",
    route: "Oral",
    price: 24.0
  },
  {
    name: "Cidophage 500mg",
    activeIngredient: "Metformin Hydrochloride",
    manufacturer: "CID",
    category: "Endocrine",
    strength: "500mg",
    form: "أقراص",
    therapeuticClass: "Oral Antidiabetic",
    route: "Oral",
    price: 16.0
  },
  {
    name: "Diamicron 60mg MR",
    activeIngredient: "Gliclazide",
    manufacturer: "Servier",
    category: "Endocrine",
    strength: "60mg",
    form: "أقراص معدلة الإفراز",
    therapeuticClass: "Sulfonylurea Antidiabetic",
    route: "Oral",
    price: 85.0
  },
  {
    name: "Diamicron 30mg MR",
    activeIngredient: "Gliclazide",
    manufacturer: "Servier",
    category: "Endocrine",
    strength: "30mg",
    form: "أقراص معدلة الإفراز",
    therapeuticClass: "Sulfonylurea Antidiabetic",
    route: "Oral",
    price: 60.0
  },
  {
    name: "Amaryl 1mg",
    activeIngredient: "Glimepiride",
    manufacturer: "Sanofi",
    category: "Endocrine",
    strength: "1mg",
    form: "أقراص",
    therapeuticClass: "Sulfonylurea Antidiabetic",
    route: "Oral",
    price: 36.0
  },
  {
    name: "Amaryl 2mg",
    activeIngredient: "Glimepiride",
    manufacturer: "Sanofi",
    category: "Endocrine",
    strength: "2mg",
    form: "أقراص",
    therapeuticClass: "Sulfonylurea Antidiabetic",
    route: "Oral",
    price: 52.0
  },
  {
    name: "Amaryl 3mg",
    activeIngredient: "Glimepiride",
    manufacturer: "Sanofi",
    category: "Endocrine",
    strength: "3mg",
    form: "أقراص",
    therapeuticClass: "Sulfonylurea Antidiabetic",
    route: "Oral",
    price: 64.0
  },
  {
    name: "Amaryl 4mg",
    activeIngredient: "Glimepiride",
    manufacturer: "Sanofi",
    category: "Endocrine",
    strength: "4mg",
    form: "أقراص",
    therapeuticClass: "Sulfonylurea Antidiabetic",
    route: "Oral",
    price: 78.0
  },
  {
    name: "Januvia 100mg",
    activeIngredient: "Sitagliptin Phosphate",
    manufacturer: "MSD",
    category: "Endocrine",
    strength: "100mg",
    form: "أقراص مغلفة",
    therapeuticClass: "DPP-4 Inhibitor Antidiabetic",
    route: "Oral",
    price: 195.0
  },
  {
    name: "Januvia 50mg",
    activeIngredient: "Sitagliptin Phosphate",
    manufacturer: "MSD",
    category: "Endocrine",
    strength: "50mg",
    form: "أقراص مغلفة",
    therapeuticClass: "DPP-4 Inhibitor Antidiabetic",
    route: "Oral",
    price: 140.0
  },
  {
    name: "Galvus 50mg",
    activeIngredient: "Vildagliptin",
    manufacturer: "Novartis",
    category: "Endocrine",
    strength: "50mg",
    form: "أقراص",
    therapeuticClass: "DPP-4 Inhibitor Antidiabetic",
    route: "Oral",
    price: 120.0
  },
  {
    name: "Galvus Met 50/1000mg",
    activeIngredient: "Vildagliptin / Metformin Hydrochloride",
    manufacturer: "Novartis",
    category: "Endocrine",
    strength: "50mg/1000mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Combination Oral Antidiabetic",
    route: "Oral",
    price: 180.0
  },
  {
    name: "Galvus Met 50/850mg",
    activeIngredient: "Vildagliptin / Metformin Hydrochloride",
    manufacturer: "Novartis",
    category: "Endocrine",
    strength: "50mg/850mg",
    form: "أقراص مغلفة",
    therapeuticClass: "Combination Oral Antidiabetic",
    route: "Oral",
    price: 165.0
  },
  {
    name: "Jardiance 10mg",
    activeIngredient: "Empagliflozin",
    manufacturer: "Boehringer Ingelheim",
    category: "Endocrine",
    strength: "10mg",
    form: "أقراص مغلفة",
    therapeuticClass: "SGLT-2 Inhibitor Antidiabetic",
    route: "Oral",
    price: 240.0
  },
  {
    name: "Jardiance 25mg",
    activeIngredient: "Empagliflozin",
    manufacturer: "Boehringer Ingelheim",
    category: "Endocrine",
    strength: "25mg",
    form: "أقراص مغلفة",
    therapeuticClass: "SGLT-2 Inhibitor Antidiabetic",
    route: "Oral",
    price: 310.0
  },
  {
    name: "Forxiga 10mg",
    activeIngredient: "Dapagliflozin",
    manufacturer: "AstraZeneca",
    category: "Endocrine",
    strength: "10mg",
    form: "أقراص مغلفة",
    therapeuticClass: "SGLT-2 Inhibitor Antidiabetic",
    route: "Oral",
    price: 225.0
  },
  {
    name: "Lantus SoloStar Pen",
    activeIngredient: "Insulin Glargine",
    manufacturer: "Sanofi",
    category: "Endocrine",
    strength: "100 U/ml",
    form: "قلم أنسولين معبأ مسبقاً ممتد المفعول",
    therapeuticClass: "Long-Acting Analog Insulin",
    route: "Subcutaneous",
    price: 360.0
  },
  {
    name: "Mixtard 30 Penfill",
    activeIngredient: "Insulin Human (Bi-phasic Isophane)",
    manufacturer: "Novo Nordisk",
    category: "Endocrine",
    strength: "100 IU/ml",
    form: "خراطيش أقلام أنسولين معلق مختلط",
    therapeuticClass: "Intermediate & Rapid-Acting Insulin Mix",
    route: "Subcutaneous",
    price: 160.0
  },
  {
    name: "NovoRapid FlexPen",
    activeIngredient: "Insulin Aspart",
    manufacturer: "Novo Nordisk",
    category: "Endocrine",
    strength: "100 U/ml",
    form: "قلم أنسولين سريع المفعول معبأ مسبقاً",
    therapeuticClass: "Rapid-Acting Analog Insulin",
    route: "Subcutaneous",
    price: 250.0
  },
  {
    name: "Euthyrox 50mcg",
    activeIngredient: "Levothyroxine Sodium",
    manufacturer: "Merck",
    category: "Endocrine",
    strength: "50mcg",
    form: "أقراص",
    therapeuticClass: "Thyroid Hormone replacement",
    route: "Oral",
    price: 45.0
  },
  {
    name: "Euthyrox 100mcg",
    activeIngredient: "Levothyroxine Sodium",
    manufacturer: "Merck",
    category: "Endocrine",
    strength: "100mcg",
    form: "أقراص",
    therapeuticClass: "Thyroid Hormone replacement",
    route: "Oral",
    price: 60.0
  },
  {
    name: "Carbimazole 5mg",
    activeIngredient: "Carbimazole",
    manufacturer: "CID",
    category: "Endocrine",
    strength: "5mg",
    form: "أقراص لعلاج فرط نشاط الغدة الدرقية",
    therapeuticClass: "Antithyroid Agent",
    route: "Oral",
    price: 30.0
  },
  {
    name: "Aldomet 250mg",
    activeIngredient: "Methyldopa",
    manufacturer: "Kahira / MSD",
    category: "Endocrine",
    strength: "250mg",
    form: "أقراص لعلاج الضغط لدى الحوامل",
    therapeuticClass: "Centrally Acting Alpha-2 Adrenergic Agonist",
    route: "Oral",
    price: 48.0
  },
  {
    name: "Dostinex 0.5mg",
    activeIngredient: "Cabergoline",
    manufacturer: "Pfizer",
    category: "Endocrine",
    strength: "0.5mg",
    form: "أقراص لعلاج هرمون البرولاكتين",
    therapeuticClass: "Dopamine Receptor Agonist",
    route: "Oral",
    price: 190.0
  }
];

async function main() {
  console.log(`Starting to seed ${medications.length} famous medications...`);
  
  let insertedCount = 0;
  for (const med of medications) {
    try {
      await prisma.medication.upsert({
        where: { name: med.name },
        update: {
          activeIngredient: med.activeIngredient,
          manufacturer: med.manufacturer,
          category: med.category,
          strength: med.strength,
          form: med.form,
          therapeuticClass: med.therapeuticClass,
          route: med.route,
          price: med.price,
          isGlobal: true
        },
        create: {
          name: med.name,
          activeIngredient: med.activeIngredient,
          manufacturer: med.manufacturer,
          category: med.category,
          strength: med.strength,
          form: med.form,
          therapeuticClass: med.therapeuticClass,
          route: med.route,
          price: med.price,
          isGlobal: true
        }
      });
      insertedCount++;
    } catch (err) {
      console.error(`Failed to seed ${med.name}:`, err.message);
    }
  }

  console.log(`Successfully seeded ${insertedCount} medications to the database!`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
