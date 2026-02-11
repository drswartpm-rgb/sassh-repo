import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Tendon Repairs", order: 1 },
  { name: "Nerve Repairs", order: 2 },
  { name: "Scaphoid", order: 3 },
  { name: "Arthritis", order: 4 },
  { name: "Dupuytrens", order: 5 },
  { name: "Carpal Tunnel", order: 6 },
];

async function main() {
  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: { order: cat.order },
      create: cat,
    });
  }
  console.log("Seeded 6 categories");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
