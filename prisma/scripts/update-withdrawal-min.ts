import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.withdrawalMethod.updateMany({
    where: { minAmount: { lt: 300 } },
    data: { minAmount: 300 },
  });
  console.log(`Updated ${result.count} withdrawal method(s) to minAmount = 300`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
