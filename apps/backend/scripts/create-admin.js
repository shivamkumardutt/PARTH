import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { prisma } from '../src/config/database.js';

async function main() {
  const name = process.env.ADMIN_NAME;
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password || password.length < 12) {
    throw new Error(
      'Provide ADMIN_NAME, ADMIN_EMAIL and a password of at least 12 characters.'
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email }],
    },
  });

  if (existingUser) {
    throw new Error('This email already has an account. No changes made.');
  }

  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    throw new Error('ADMIN role is missing. Run the seed script first.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      name: name.trim(),
      email,
      passwordHash,
      status: 'ACTIVE',
      roles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
    },
  });

  console.log('Admin account created successfully:');
  console.table([admin]);
}

main()
  .catch((error) => {
    console.error('Admin creation failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
