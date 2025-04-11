const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');

const prisma = new PrismaClient();

async function main() {
  await prisma.book.deleteMany({});

  const books = Array.from({ length: 500 }).map(() => ({
    title: faker.lorem.sentence(3),
    description: faker.lorem.paragraph(),
    author: faker.person.fullName(),
    publishedAt: faker.date.past({ years: 100 }),
    createdAt: faker.date.recent(), // Randomizes createdAt
  }));

  await prisma.book.createMany({ data: books });
  console.log('Seeded 500 random books with randomized createdAt');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
