import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const VIP_PACKAGES = [
  {
    id: '6814352944eb2a098f932cd4',
    name: 'VIP 1 Tháng',
    price: 99000,
    duration: 30,
    features: [
      'Gửi tin nhắn không giới hạn',
      'Xem ai đã thích bạn',
      'Xem top người nổi bật',
    ],
  },
  {
    id: '6814352944eb2a098f932cd5',
    name: 'VIP 3 Tháng',
    price: 259000,
    duration: 90,
    features: [
      'Gửi tin nhắn không giới hạn',
      'Xem ai đã thích bạn',
      'Xem top người nổi bật',
      'Giảm 12% so với gói 1 tháng',
    ],
    mostPopular: true,
  },
  {
    id: '6814352944eb2a098f932cd6',
    name: 'VIP 6 Tháng',
    price: 459000,
    duration: 180,
    features: [
      'Gửi tin nhắn không giới hạn',
      'Xem ai đã thích bạn',
      'Xem top người nổi bật',
      'Giảm 23% so với gói 1 tháng',
    ],
  },
];

async function main() {
  for (const pkg of VIP_PACKAGES) {
    await prisma.vipPackage.upsert({
      where: { id: pkg.id },
      update: {},
      create: {
        duration: pkg.duration,
        price: pkg.price,
        features: pkg.features,
        name: pkg.name,
      },
    });
  }

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
