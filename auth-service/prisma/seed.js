// auth-service/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (optional)
  await prisma.user.deleteMany({});
  
  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@admin.com',
      password: await bcrypt.hash('password', 10),
      role: 'ADMIN'
    },
  });
  
  // Create regular users
  const testUser1 = await prisma.user.create({
    data: {
      name: 'User one',
      email: 'user1@gmail.com',
      password: await bcrypt.hash('user123', 10),
      role: 'USER'
    },
  });
  
  const testUser2 = await prisma.user.create({
    data: {
      name: 'User two',
      email: 'user2@gmail.com',
      password: await bcrypt.hash('password', 10),
      role: 'USER'
    },
  });
  
  console.log(`Created ${3} users`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });