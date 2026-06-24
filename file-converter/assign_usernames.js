const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { username: null }
  });

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    const newUsername = 'user_' + user.id.slice(0, 8);
    await prisma.user.update({
      where: { id: user.id },
      data: { username: newUsername }
    });
    console.log(`Updated user ${user.email} with username ${newUsername}`);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
