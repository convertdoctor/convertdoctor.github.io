const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const users = await prisma.user.findMany();
  for (const user of users) {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' }
    });
    console.log(`Updated user ${user.email} to ADMIN`);
  }
  
  // Seed some default settings
  const settings = [
    { key: "FEATURE_PDF_TO_WORD", value: "ENABLED" },
    { key: "FEATURE_WORD_TO_PDF", value: "ENABLED" },
    { key: "FEATURE_PDF_TO_JPG", value: "ENABLED" },
    { key: "FEATURE_PDF_OCR", value: "ENABLED" }
  ];
  
  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s
    });
  }
  console.log("Seeded default settings.");
  
  await prisma.$disconnect();
})();
