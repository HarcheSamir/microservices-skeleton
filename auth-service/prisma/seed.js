// auth-service/prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Upsert Admin User ---
  const adminPassword = await bcrypt.hash('password', 10);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@admin.com' }, // Unique identifier to find the user
    update: { // Data to update if user IS found
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
    },
    create: { // Data to create if user is NOT found
      name: 'Admin User',
      email: 'admin@admin.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Upserted admin user: ${adminUser.email}`);

  // --- Upsert Regular User 1 ---
  const user1Password = await bcrypt.hash('user123', 10);
  const testUser1 = await prisma.user.upsert({
    where: { email: 'user1@gmail.com' },
    update: {
      name: 'User one',
      password: user1Password,
      role: 'USER', // Ensure role is updated if it changed
    },
    create: {
      name: 'User one',
      email: 'user1@gmail.com',
      password: user1Password,
      role: 'USER',
    },
  });
  console.log(`Upserted user: ${testUser1.email}`);

  // --- Upsert Regular User 2 ---
  const user2Password = await bcrypt.hash('password', 10); // Re-using 'password' hash from admin for simplicity here
  const testUser2 = await prisma.user.upsert({
    where: { email: 'user2@gmail.com' },
    update: {
      name: 'User two',
      password: user2Password,
      role: 'USER',
    },
    create: {
      name: 'User two',
      email: 'user2@gmail.com',
      password: user2Password,
      role: 'USER',
    },
  });
  console.log(`Upserted user: ${testUser2.email}`);

  // Removed the deleteMany call
  // The final log message reflects the operation performed
  console.log(`Seeding finished. Ensured 3 users exist/are updated.`);
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Disconnecting Prisma client...");
    await prisma.$disconnect();
  });