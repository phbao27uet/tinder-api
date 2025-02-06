import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'src/shared/utils/hash';

const prisma = new PrismaClient();

async function main() {
  const password = await hashPassword('123123a');

  await prisma.user.upsert({
    where: { id: 1 },
    update: {},
    create: {
      email: 'admin',
      password: password,
      role: 'VN_ADMIN',
      name: 'Admin',
    },
  });

  await prisma.user.upsert({
    where: { id: 2 },
    update: {},
    create: {
      email: 'user',
      password: password,
      role: 'VN_USER',
      name: 'Nguyễn Văn A',
    },
  });

  await prisma.user.upsert({
    where: { id: 3 },
    update: {},
    create: {
      email: 'kho_tq',
      password: password,
      role: 'CN_WAREHOUSE',
      name: 'Kho TQ',
    },
  });

  await prisma.user.upsert({
    where: { id: 4 },
    update: {},
    create: {
      email: 'kho_vn',
      password: password,
      role: 'VN_WAREHOUSE',
      name: 'Kho VN',
    },
  });

  console.log('seed success');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
