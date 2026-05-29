const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const egyptLocations = [
  {
    code: "CAI",
    nameAr: "القاهرة",
    nameEn: "Cairo",
    cities: [
      { nameAr: "مدينة نصر", nameEn: "Nasr City", code: "NASR" },
      { nameAr: "مصر الجديدة", nameEn: "Heliopolis", code: "HELIO" },
      { nameAr: "المعادي", nameEn: "Maadi", code: "MAADI" },
      { nameAr: "حلوان", nameEn: "Helwan", code: "HELW" },
      { nameAr: "شبرا", nameEn: "Shubra", code: "SHUB" },
      { nameAr: "الزيتون", nameEn: "Zeitoun", code: "ZEIT" },
      { nameAr: "عين شمس", nameEn: "Ain Shams", code: "AIN" },
      { nameAr: "المطرية", nameEn: "Matareya", code: "MATAR" },
      { nameAr: "المرج", nameEn: "El Marg", code: "MARG" },
      { nameAr: "السلام", nameEn: "El Salam", code: "SALAM" },
      { nameAr: "التجمع الخامس", nameEn: "Fifth Settlement", code: "FIFTH" },
      { nameAr: "القاهرة الجديدة", nameEn: "New Cairo", code: "NEWCAI" },
      { nameAr: "وسط البلد", nameEn: "Downtown", code: "DOWN" },
      { nameAr: "السيدة زينب", nameEn: "Sayeda Zeinab", code: "SAYEDA" },
      { nameAr: "العباسية", nameEn: "Abassia", code: "ABAS" },
      { nameAr: "الوايلي", nameEn: "El Wayli", code: "WAYLI" },
      { nameAr: "حدائق القبة", nameEn: "Hadayek El Kobba", code: "KOBBA" },
      { nameAr: "روض الفرج", nameEn: "Rod El Farag", code: "ROD" },
      { nameAr: "بولاق", nameEn: "Boulaq", code: "BOUL" },
      { nameAr: "دار السلام", nameEn: "Dar El Salam", code: "DAR" },
      { nameAr: "البساتين", nameEn: "El Basatin", code: "BASAT" }
    ]
  },
  {
    code: "GIZ",
    nameAr: "الجيزة",
    nameEn: "Giza",
    cities: [
      { nameAr: "الدقي", nameEn: "Dokki", code: "DOKKI" },
      { nameAr: "العجوزة", nameEn: "Agouza", code: "AGOUZ" },
      { nameAr: "المهندسين", nameEn: "Mohandessin", code: "MOHAND" },
      { nameAr: "الهرم", nameEn: "Haram", code: "HARAM" },
      { nameAr: "فيصل", nameEn: "Faisal", code: "FAIS" },
      { nameAr: "6 أكتوبر", nameEn: "6th of October", code: "OCT6" },
      { nameAr: "الشيخ زايد", nameEn: "Sheikh Zayed", code: "ZAYED" },
      { nameAr: "البدرشين", nameEn: "Badrashein", code: "BADRA" },
      { nameAr: "العياط", nameEn: "Ayat", code: "AYAT" },
      { nameAr: "الصف", nameEn: "Saff", code: "SAFF" },
      { nameAr: "أطفيح", nameEn: "Atfih", code: "ATFIH" },
      { nameAr: "كرداسة", nameEn: "Kerdasa", code: "KERDA" },
      { nameAr: "أوسيم", nameEn: "Ouseem", code: "OUSEE" },
      { nameAr: "منشأة القناطر", nameEn: "Manshiyet El Qanater", code: "MANSH" },
      { nameAr: "إمبابة", nameEn: "Imbaba", code: "IMBAB" },
      { nameAr: "بولاق الدكرور", nameEn: "Boulaq El Dakrour", code: "BOULDA" }
    ]
  },
  {
    code: "ALX",
    nameAr: "الإسكندرية",
    nameEn: "Alexandria",
    cities: [
      { nameAr: "سيدي جابر", nameEn: "Sidi Gaber", code: "GABER" },
      { nameAr: "سموحة", nameEn: "Smouha", code: "SMOUH" },
      { nameAr: "ميامي", nameEn: "Miami", code: "MIAMI" },
      { nameAr: "العصافرة", nameEn: "Asafra", code: "ASAF" },
      { nameAr: "العجمي", nameEn: "Ajami", code: "AJAMI" },
      { nameAr: "محرم بك", nameEn: "Moharam Bek", code: "MOHAR" },
      { nameAr: "المنتزه", nameEn: "Montaza", code: "MONTA" },
      { nameAr: "الرمل", nameEn: "Raml", code: "RAML" },
      { nameAr: "كرموز", nameEn: "Karmooz", code: "KARM" },
      { nameAr: "برج العرب", nameEn: "Borg El Arab", code: "BORG" },
      { nameAr: "أبو قير", nameEn: "Abu Qir", code: "ABUQ" },
      { nameAr: "العامرية", nameEn: "Amriya", code: "AMRI" },
      { nameAr: "الجمرك", nameEn: "Gomrok", code: "GOMR" },
      { nameAr: "اللبان", nameEn: "Labban", code: "LABB" }
    ]
  },
  {
    code: "SHR",
    nameAr: "الشرقية",
    nameEn: "Sharqia",
    cities: [
      { nameAr: "الزقازيق", nameEn: "Zagazig", code: "ZAG" },
      { nameAr: "منيا القمح", nameEn: "Minya El Qamh", code: "MINQ" },
      { nameAr: "بلبيس", nameEn: "Belbeis", code: "BELB" },
      { nameAr: "أبو حماد", nameEn: "Abu Hammad", code: "ABUH" },
      { nameAr: "فاقوس", nameEn: "Faqous", code: "FAQO" },
      { nameAr: "كفر صقر", nameEn: "Kafr Saqr", code: "KAFR" },
      { nameAr: "أولاد صقر", nameEn: "Oulad Saqr", code: "OULAD" },
      { nameAr: "ديرب نجم", nameEn: "Diyarb Nigm", code: "DIYAR" },
      { nameAr: "ههيا", nameEn: "Hehia", code: "HEHIA" },
      { nameAr: "الإبراهيمية", nameEn: "Ibrahimia", code: "IBRAH" },
      { nameAr: "العاشر من رمضان", nameEn: "10th of Ramadan", code: "RAMA10" },
      { nameAr: "الصالحية الجديدة", nameEn: "New Salhia", code: "SALH" },
      { nameAr: "أبو كبير", nameEn: "Abu Hammad", code: "ABUK" },
      { nameAr: "مشتول السوق", nameEn: "Mashtool", code: "MASH" },
      { nameAr: "القنايات", nameEn: "Qanayat", code: "QANA" },
      { nameAr: "الحسينية", nameEn: "Husseiniya", code: "HUSS" },
      { nameAr: "صان الحجر", nameEn: "San El Hagar", code: "SAN" },
      { nameAr: "منشأة أبو عمر", nameEn: "Manshiyet Abu Omar", code: "OMAR" }
    ]
  },
  {
    code: "DKH",
    nameAr: "الدقهلية",
    nameEn: "Dakahlia",
    cities: [
      { nameAr: "المنصورة", nameEn: "Mansoura", code: "MANS" },
      { nameAr: "طلخا", nameEn: "Talkha", code: "TALK" },
      { nameAr: "ميت غمر", nameEn: "Mit Ghamr", code: "MITG" },
      { nameAr: "دكرنس", nameEn: "Dikirnis", code: "DIK" },
      { nameAr: "منية النصر", nameEn: "Minyat El Nasr", code: "MINN" },
      { nameAr: "السنبلاوين", nameEn: "Senbellawein", code: "SENB" },
      { nameAr: "أجا", nameEn: "Aga", code: "AGA" },
      { nameAr: "بلقاس", nameEn: "Belqas", code: "BELQ" },
      { nameAr: "شربين", nameEn: "Sherbin", code: "SHERB" },
      { nameAr: "نبروه", nameEn: "Nabarouh", code: "NABAR" },
      { nameAr: "تمي الأمديد", nameEn: "Temay El Amdeed", code: "TEMAY" },
      { nameAr: "الجمالية", nameEn: "Gamaliya", code: "GAMA" },
      { nameAr: "المطرية", nameEn: "Matareya", code: "MATAR" },
      { nameAr: "محلة دمنة", nameEn: "Mahalet Damana", code: "MAHAL" },
      { nameAr: "بني عبيد", nameEn: "Bani Obeid", code: "OBEID" }
    ]
  },
  {
    code: "KLB",
    nameAr: "القليوبية",
    nameEn: "Qalyubia",
    cities: [
      { nameAr: "بنها", nameEn: "Banha", code: "BANHA" },
      { nameAr: "شبرا الخيمة", nameEn: "Shubra El Kheima", code: "SHUBK" },
      { nameAr: "القناطر الخيرية", nameEn: "Qanater", code: "QANAT" },
      { nameAr: "الخانكة", nameEn: "Khanka", code: "KHAN" },
      { nameAr: "قليوب", nameEn: "Qalyub", code: "QALY" },
      { nameAr: "طوخ", nameEn: "Toukh", code: "TOUKH" },
      { nameAr: "كفر شكر", nameEn: "Kafr Shukr", code: "SHUKR" },
      { nameAr: "شبين القناطر", nameEn: "Shebeen El Qanater", code: "SHEBQ" },
      { nameAr: "الخصوص", nameEn: "Khosous", code: "KHOS" },
      { nameAr: "العبور", nameEn: "Obour", code: "OBOUR" },
      { nameAr: "قها", nameEn: "Qaha", code: "QAHA" }
    ]
  },
  {
    code: "GHB",
    nameAr: "الغربية",
    nameEn: "Gharbia",
    cities: [
      { nameAr: "طنطا", nameEn: "Tanta", code: "TANTA" },
      { nameAr: "المحلة الكبرى", nameEn: "El Mahalla", code: "MAHAL" },
      { nameAr: "كفر الزيات", nameEn: "Kafr El Zayat", code: "ZAYAT" },
      { nameAr: "زفتى", nameEn: "Zefta", code: "ZEFTA" },
      { nameAr: "السنطة", nameEn: "El Santa", code: "SANTA" },
      { nameAr: "قطور", nameEn: "Qotour", code: "QOT" },
      { nameAr: "بسيون", nameEn: "Basyoun", code: "BASY" },
      { nameAr: "سمنود", nameEn: "Samanoud", code: "SAMA" }
    ]
  },
  {
    code: "MNF",
    nameAr: "المنوفية",
    nameEn: "Monufia",
    cities: [
      { nameAr: "شبين الكوم", nameEn: "Shebin El Kom", code: "SHEB" },
      { nameAr: "منوف", nameEn: "Menouf", code: "MENOUF" },
      { nameAr: "أشمون", nameEn: "Ashmoun", code: "ASHM" },
      { nameAr: "الباجور", nameEn: "Bagour", code: "BAG" },
      { nameAr: "قويسنا", nameEn: "Quesna", code: "QUES" },
      { nameAr: "بركة السبع", nameEn: "Birkat El Sab", code: "BIRK" },
      { nameAr: "تلا", nameEn: "Tala", code: "TALA" },
      { nameAr: "الشهداء", nameEn: "Shohada", code: "SHOH" },
      { nameAr: "السادات", nameEn: "Sadat City", code: "SADAT" },
      { nameAr: "سرس الليان", nameEn: "Sers El Lyan", code: "SERS" }
    ]
  },
  {
    code: "BEH",
    nameAr: "البحيرة",
    nameEn: "Beheira",
    cities: [
      { nameAr: "دمنهور", nameEn: "Damanhour", code: "DAM" },
      { nameAr: "كفر الدوار", nameEn: "Kafr El Dawar", code: "KAFLD" },
      { nameAr: "رشيد", nameEn: "Rosetta", code: "ROSET" },
      { nameAr: "إدكو", nameEn: "Edko", code: "EDKO" },
      { nameAr: "أبو المطامير", nameEn: "Abu Hummus", code: "ABUM" },
      { nameAr: "أبو حمص", nameEn: "Abu Hummus", code: "ABUH" },
      { nameAr: "الدلنجات", nameEn: "Delengat", code: "DEL" },
      { nameAr: "المحمودية", nameEn: "Mahmoudia", code: "MAHM" },
      { nameAr: "الرحمانية", nameEn: "Rahmania", code: "RAHM" },
      { nameAr: "إيتاي البارود", nameEn: "Itay El Baroud", code: "ITAY" },
      { nameAr: "حوش عيسى", nameEn: "Housh Eissa", code: "HOUSH" },
      { nameAr: "كوم حمادة", nameEn: "Kom Hamada", code: "KOM" },
      { nameAr: "وادي النطرون", nameEn: "Wadi El Natrun", code: "NATRUN" },
      { nameAr: "بدر", nameEn: "Badr", code: "BADR" }
    ]
  },
  {
    code: "KFS",
    nameAr: "كفر الشيخ",
    nameEn: "Kafr El Sheikh",
    cities: [
      { nameAr: "كفر الشيخ", nameEn: "Kafr El Sheikh", code: "KAFR" },
      { nameAr: "دسوق", nameEn: "Desouk", code: "DES" },
      { nameAr: "فوه", nameEn: "Fouh", code: "FOUH" },
      { nameAr: "مطوبس", nameEn: "Metoubes", code: "METO" },
      { nameAr: "بيلا", nameEn: "Bila", code: "BILA" },
      { nameAr: "الحامول", nameEn: "Hamoul", code: "HAMO" },
      { nameAr: "بلطيم", nameEn: "Baltim", code: "BALT" },
      { nameAr: "سيدي سالم", nameEn: "Sidi Salem", code: "SIDIS" },
      { nameAr: "قلين", nameEn: "Qallin", code: "QALL" },
      { nameAr: "الرياض", nameEn: "Riyadh", code: "RIYA" }
    ]
  },
  {
    code: "DMT",
    nameAr: "دمياط",
    nameEn: "Damietta",
    cities: [
      { nameAr: "دمياط", nameEn: "Damietta", code: "DAM" },
      { nameAr: "دمياط الجديدة", nameEn: "New Damietta", code: "NEWDAM" },
      { nameAr: "رأس البر", nameEn: "Ras El Bar", code: "RAS" },
      { nameAr: "فارسكور", nameEn: "Faraskour", code: "FARAS" },
      { nameAr: "كفر سعد", nameEn: "Kafr Saad", code: "SAAD" },
      { nameAr: "الزرقا", nameEn: "Zarqa", code: "ZARQA" },
      { nameAr: "السرو", nameEn: "El Sarw", code: "SARW" },
      { nameAr: "كفر البطيخ", nameEn: "Kafr El Bateekh", code: "BATE" },
      { nameAr: "ميت أبو غالب", nameEn: "Mit Abu Ghalib", code: "GHAL" }
    ]
  },
  {
    code: "PTS",
    nameAr: "بورسعيد",
    nameEn: "Port Said",
    cities: [
      { nameAr: "بورسعيد", nameEn: "Port Said", code: "PORT" },
      { nameAr: "بورفؤاد", nameEn: "Port Fouad", code: "FOUAD" },
      { nameAr: "حي الشرق", nameEn: "Sharq", code: "SHARQ" },
      { nameAr: "حي العرب", nameEn: "Arab", code: "ARAB" },
      { nameAr: "حي المناخ", nameEn: "Manakh", code: "MANAKH" },
      { nameAr: "حي الضواحي", nameEn: "Dawahi", code: "DAWA" },
      { nameAr: "حي الزهور", nameEn: "Zohour", code: "ZOH" },
      { nameAr: "حي الجنوب", nameEn: "Ganoub", code: "GANOUB" }
    ]
  },
  {
    code: "ISL",
    nameAr: "الإسماعيلية",
    nameEn: "Ismailia",
    cities: [
      { nameAr: "الإسماعيلية", nameEn: "Ismailia", code: "ISM" },
      { nameAr: "فايد", nameEn: "Fayed", code: "FAYED" },
      { nameAr: "القنطرة شرق", nameEn: "Qantara East", code: "QANTE" },
      { nameAr: "القنطرة غرب", nameEn: "Qantara West", code: "QANTW" },
      { nameAr: "التل الكبير", nameEn: "El Tell El Kebir", code: "TELL" },
      { nameAr: "أبو صوير", nameEn: "Abu Suweir", code: "SUW" },
      { nameAr: "القصاصين", nameEn: "Qassassin", code: "QAS" }
    ]
  },
  {
    code: "SUZ",
    nameAr: "السويس",
    nameEn: "Suez",
    cities: [
      { nameAr: "السويس", nameEn: "Suez", code: "SUEZ" },
      { nameAr: "الأربعين", nameEn: "Arbaeen", code: "ARBA" },
      { nameAr: "عتاقة", nameEn: "Ataqah", code: "ATAQ" },
      { nameAr: "الجناين", nameEn: "Ganayen", code: "GANA" },
      { nameAr: "فيصل", nameEn: "Faisal", code: "FAIS" }
    ]
  },
  {
    code: "FYM",
    nameAr: "الفيوم",
    nameEn: "Fayoum",
    cities: [
      { nameAr: "الفيوم", nameEn: "Fayoum", code: "FAY" },
      { nameAr: "سنورس", nameEn: "Sinnuris", code: "SINN" },
      { nameAr: "إطسا", nameEn: "Itsa", code: "ITSA" },
      { nameAr: "طامية", nameEn: "Tamiya", code: "TAMI" },
      { nameAr: "أبشواي", nameEn: "Ibshawai", code: "IBSH" },
      { nameAr: "يوسف الصديق", nameEn: "Youssef El Sediq", code: "YOUS" }
    ]
  },
  {
    code: "BSW",
    nameAr: "بني سويف",
    nameEn: "Beni Suef",
    cities: [
      { nameAr: "بني سويف", nameEn: "Beni Suef", code: "BS" },
      { nameAr: "الواسطى", nameEn: "Wasta", code: "WAST" },
      { nameAr: "ناصر", nameEn: "Nasser", code: "NASS" },
      { nameAr: "إهناسيا", nameEn: "Ehnasia", code: "EHNA" },
      { nameAr: "ببا", nameEn: "Biba", code: "BIBA" },
      { nameAr: "سمسطا", nameEn: "Somosta", code: "SOMO" },
      { nameAr: "الفشن", nameEn: "Fashn", code: "FASHN" }
    ]
  },
  {
    code: "MNY",
    nameAr: "المنيا",
    nameEn: "Minya",
    cities: [
      { nameAr: "المنيا", nameEn: "Minya", code: "MINYA" },
      { nameAr: "العدوة", nameEn: "Edwa", code: "EDWA" },
      { nameAr: "مغاغة", nameEn: "Maghagha", code: "MAGH" },
      { nameAr: "بني مزار", nameEn: "Beni Mazar", code: "MAZAR" },
      { nameAr: "مطاي", nameEn: "Matai", code: "MATAI" },
      { nameAr: "سمالوط", nameEn: "Samalut", code: "SAMAL" },
      { nameAr: "أبو قرقاص", nameEn: "Abu Qurqas", code: "QURQ" },
      { nameAr: "ملوي", nameEn: "Mallawi", code: "MALL" },
      { nameAr: "دير مواس", nameEn: "Deir Mawas", code: "MAWAS" }
    ]
  },
  {
    code: "AST",
    nameAr: "أسيوط",
    nameEn: "Assiut",
    cities: [
      { nameAr: "أسيوط", nameEn: "Assiut", code: "ASS" },
      { nameAr: "ديروط", nameEn: "Dayrout", code: "DAYR" },
      { nameAr: "القوصية", nameEn: "Qusiya", code: "QUSI" },
      { nameAr: "أبنوب", nameEn: "Abnoub", code: "ABN" },
      { nameAr: "منفلوط", nameEn: "Manfalut", code: "MANF" },
      { nameAr: "الفتح", nameEn: "Fateh", code: "FATEH" },
      { nameAr: "أبو تيج", nameEn: "Abu Tig", code: "TIG" },
      { nameAr: "الغنايم", nameEn: "Ghanayem", code: "GHAN" },
      { nameAr: "ساحل سليم", nameEn: "Sahel Selim", code: "SAHEL" },
      { nameAr: "البداري", nameEn: "Badari", code: "BAD" },
      { nameAr: "صدفا", nameEn: "Sidfa", code: "SIDFA" }
    ]
  },
  {
    code: "SHG",
    nameAr: "سوهاج",
    nameEn: "Sohag",
    cities: [
      { nameAr: "سوهاج", nameEn: "Sohag", code: "SOH" },
      { nameAr: "أخميم", nameEn: "Akhmim", code: "AKHM" },
      { nameAr: "البلينا", nameEn: "Balyana", code: "BALY" },
      { nameAr: "المراغة", nameEn: "Maragha", code: "MARA" },
      { nameAr: "المنشأة", nameEn: "Monsha'a", code: "MONS" },
      { nameAr: "دار السلام", nameEn: "Dar El Salam", code: "DAR" },
      { nameAr: "جرجا", nameEn: "Girga", code: "GIRG" },
      { nameAr: "جهينة", nameEn: "Gehayna", code: "GEHA" },
      { nameAr: "ساقلته", nameEn: "Saqalta", code: "SAQ" },
      { nameAr: "طما", nameEn: "Tema", code: "TEMA" },
      { nameAr: "طهطا", nameEn: "Tahta", code: "TAHTA" },
      { nameAr: "العسيرات", nameEn: "Oseirat", code: "OSEI" }
    ]
  },
  {
    code: "QNA",
    nameAr: "قنا",
    nameEn: "Qena",
    cities: [
      { nameAr: "قنا", nameEn: "Qena", code: "QEN" },
      { nameAr: "أبو تشت", nameEn: "Abu Tesht", code: "TESHT" },
      { nameAr: "نجع حمادي", nameEn: "Nag Hammadi", code: "NAG" },
      { nameAr: "دشنا", nameEn: "Deshna", code: "DESH" },
      { nameAr: "الوقف", nameEn: "Waqf", code: "WAQF" },
      { nameAr: "قفط", nameEn: "Qift", code: "QIFT" },
      { nameAr: "قوص", nameEn: "Qous", code: "QOUS" },
      { nameAr: "نقادة", nameEn: "Naqada", code: "NAQ" },
      { nameAr: "فرشوط", nameEn: "Farshout", code: "FARSH" }
    ]
  },
  {
    code: "LXR",
    nameAr: "الأقصر",
    nameEn: "Luxor",
    cities: [
      { nameAr: "الأقصر", nameEn: "Luxor", code: "LUX" },
      { nameAr: "الزينية", nameEn: "Zeynia", code: "ZEYN" },
      { nameAr: "البياضية", nameEn: "Bayadiya", code: "BAYAD" },
      { nameAr: "القرنة", nameEn: "Qurna", code: "QURN" },
      { nameAr: "أرمنت", nameEn: "Armant", code: "ARM" },
      { nameAr: "إسنا", nameEn: "Esna", code: "ESNA" },
      { nameAr: "الطود", nameEn: "Tod", code: "TOD" }
    ]
  },
  {
    code: "ASN",
    nameAr: "أسوان",
    nameEn: "Aswan",
    cities: [
      { nameAr: "أسوان", nameEn: "Aswan", code: "ASW" },
      { nameAr: "دراو", nameEn: "Daraw", code: "DARAW" },
      { nameAr: "كوم أمبو", nameEn: "Kom Ombo", code: "OMBO" },
      { nameAr: "نصر النوبة", nameEn: "Nasr Nuba", code: "NUBA" },
      { nameAr: "إدفو", nameEn: "Edfu", code: "EDFU" },
      { nameAr: "أبو سمبل", nameEn: "Abu Simbel", code: "SIMB" },
      { nameAr: "كلابشة", nameEn: "Kalabsha", code: "KALA" }
    ]
  },
  {
    code: "BAH",
    nameAr: "البحر الأحمر",
    nameEn: "Red Sea",
    cities: [
      { nameAr: "الغردقة", nameEn: "Hurghada", code: "HURG" },
      { nameAr: "رأس غارب", nameEn: "Ras Gharib", code: "GHARIB" },
      { nameAr: "سفاجا", nameEn: "Safaga", code: "SAFA" },
      { nameAr: "القصير", nameEn: "Quseir", code: "QUSE" },
      { nameAr: "مرسى علم", nameEn: "Marsa Alam", code: "ALAM" },
      { nameAr: "الشلاتين", nameEn: "Shalatin", code: "SHAL" },
      { nameAr: "حلايب", nameEn: "Halaib", code: "HALA" }
    ]
  },
  {
    code: "MTR",
    nameAr: "مطروح",
    nameEn: "Matrouh",
    cities: [
      { nameAr: "مرسى مطروح", nameEn: "Marsa Matrouh", code: "MATR" },
      { nameAr: "الحمام", nameEn: "Hamam", code: "HAMAM" },
      { nameAr: "العلمين", nameEn: "El Alamein", code: "ALAM" },
      { nameAr: "الضبعة", nameEn: "Dabaa", code: "DABAA" },
      { nameAr: "النجيلة", nameEn: "Negeila", code: "NEGE" },
      { nameAr: "سيدي براني", nameEn: "Sidi Barrani", code: "BARRA" },
      { nameAr: "السلوم", nameEn: "Salloum", code: "SALL" },
      { nameAr: "سيوة", nameEn: "Siwa", code: "SIWA" }
    ]
  },
  {
    code: "NSN",
    nameAr: "شمال سيناء",
    nameEn: "North Sinai",
    cities: [
      { nameAr: "العريش", nameEn: "Arish", code: "ARISH" },
      { nameAr: "بئر العبد", nameEn: "Bir El Abd", code: "BIR" },
      { nameAr: "الشيخ زويد", nameEn: "Sheikh Zuweid", code: "ZUW" },
      { nameAr: "رفح", nameEn: "Rafah", code: "RAFAH" },
      { nameAr: "الحسنة", nameEn: "Hasana", code: "HASA" },
      { nameAr: "نخل", nameEn: "Nakhl", code: "NAKHL" }
    ]
  },
  {
    code: "JSN",
    nameAr: "جنوب سيناء",
    nameEn: "South Sinai",
    cities: [
      { nameAr: "طور سيناء", nameEn: "El Tor", code: "TOR" },
      { nameAr: "شرم الشيخ", nameEn: "Sharm El Sheikh", code: "SHARM" },
      { nameAr: "دهب", nameEn: "Dahab", code: "DAHAB" },
      { nameAr: "نويبع", nameEn: "Nuweiba", code: "NUW" },
      { nameAr: "طابا", nameEn: "Taba", code: "TABA" },
      { nameAr: "رأس سدر", nameEn: "Ras Sudr", code: "SUDR" },
      { nameAr: "أبو رديس", nameEn: "Abu Rudeis", code: "RUDE" },
      { nameAr: "أبو زنيمة", nameEn: "Abu Zenima", code: "ZENI" },
      { nameAr: "سانت كاترين", nameEn: "Saint Catherine", code: "CATH" }
    ]
  },
  {
    code: "WJD",
    nameAr: "الوادي الجديد",
    nameEn: "New Valley",
    cities: [
      { nameAr: "الخارجة", nameEn: "Kharga", code: "KHAR" },
      { nameAr: "الداخلة", nameEn: "Dakhla", code: "DAKH" },
      { nameAr: "الفرافرة", nameEn: "Farafra", code: "FARA" },
      { nameAr: "باريس", nameEn: "Baris", code: "BARIS" },
      { nameAr: "بلاط", nameEn: "Balat", code: "BALAT" }
    ]
  }
];

async function main() {
  console.log("Starting to seed Egypt Governorates and Cities...");
  const p = prisma;
  let govCount = 0;
  let cityCount = 0;

  for (const governorate of egyptLocations) {
    try {
      const gov = await p.governorate.upsert({
        where: { code: governorate.code },
        update: {
          nameAr: governorate.nameAr,
          nameEn: governorate.nameEn,
        },
        create: {
          code: governorate.code,
          nameAr: governorate.nameAr,
          nameEn: governorate.nameEn,
        },
      });
      govCount++;

      for (const city of governorate.cities) {
        await p.city.upsert({
          where: {
            governorateId_nameAr: {
              governorateId: gov.id,
              nameAr: city.nameAr,
            },
          },
          update: {
            nameEn: city.nameEn,
            code: city.code,
          },
          create: {
            governorateId: gov.id,
            nameAr: city.nameAr,
            nameEn: city.nameEn,
            code: city.code,
          },
        });
        cityCount++;
      }
    } catch (err) {
      console.error(`Failed to seed governorate ${governorate.nameAr}:`, err.message);
    }
  }

  console.log(`\n======================================================`);
  console.log(`  EGYPT LOCATIONS SEED COMPLETED SUCCESSFULLY`);
  console.log(`  --------------------------------------------------`);
  console.log(`  Governorates Seeded: ${govCount}`);
  console.log(`  Cities Seeded:       ${cityCount}`);
  console.log(`======================================================\n`);
}

main()
  .catch((e) => {
    console.error("\n❌ Seeding Process Failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
