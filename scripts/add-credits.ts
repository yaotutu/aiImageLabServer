import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addCredits(email: string, amount: number) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User not found: ${email}`);
    process.exit(1);
  }

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { credits: user.credits + amount },
  });

  console.log(`Added ${amount} credits to ${email}`);
  console.log(`New balance: ${updatedUser.credits}`);
}

const email = process.argv[2] || 'testuser@example.com';
const amount = parseInt(process.argv[3] || '100');

addCredits(email, amount)
  .then(() => prisma.$disconnect())
  .catch((error) => {
    console.error(error);
    prisma.$disconnect();
    process.exit(1);
  });
