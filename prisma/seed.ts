import { PrismaClient } from '@prisma/client';
import { hashPassword } from 'src/shared/utils/hash';

const prisma = new PrismaClient();

async function main() {
  const password = await hashPassword('123123a');

  await prisma.user.upsert({
    where: { id: '666666666666666666666666' },
    update: {},
    create: {
      email: 'admin',
      password: password,
      role: 'ADMIN',
      name: 'Admin',
    },
  });

  await prisma.user.upsert({
    where: { id: '666666666666666666666667' },
    update: {},
    create: {
      email: 'user',
      password: password,
      role: 'USER',
      name: 'Nguyễn Văn A',
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
