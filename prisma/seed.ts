import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database via Prisma for Лампа 2026...');

  // 1. Seed 12 Tasks
  const tasks = [
    {
      orderNum: 1,
      title: '«На связи»',
      description: 'Подпишись на группы Профкома КГУ им. К.Э. Циолковского и Лагеря студенческого актива «Лампа» в ВК, не забудь прислать скриншоты для подтверждения',
      points: 10,
      frequency: 'ONCE' as const,
      taskType: 'SCREENSHOT' as const,
      dailyGlobalLimit: null,
    },
    {
      orderNum: 2,
      title: '«Я в тренде»',
      description: 'Установи брендированную аватарку в ВК и пришли фото-подтверждение',
      points: 30,
      frequency: 'ONCE' as const,
      taskType: 'SCREENSHOT' as const,
      dailyGlobalLimit: null,
    },
    {
      orderNum: 3,
      title: '«Зафиксировано»',
      description: 'Выложи историю в ВК о лагере (1 день = 1 история)',
      points: 20,
      frequency: 'DAILY' as const,
      taskType: 'SCREENSHOT' as const,
      dailyGlobalLimit: null,
    },
    {
      orderNum: 4,
      title: '«Сыщик»',
      description: 'Найди QR-код от организаторов на территории лагеря (1 QR-код = 1 человек)',
      points: 10,
      frequency: 'DAILY' as const,
      taskType: 'QR' as const,
      dailyGlobalLimit: null,
    },
    {
      orderNum: 5,
      title: '«Счастливчик дня»',
      description: 'Пиши комментарии и ставь лайки в группах ВК (Профком и Лампа), случайным образом выберем 5 счастливчиков',
      points: 50,
      frequency: 'DAILY' as const,
      taskType: 'MANUAL' as const,
      dailyGlobalLimit: 5,
    },
    {
      orderNum: 6,
      title: '«Самый умный»',
      description: 'Будь активным на лекции и получи ачивку от лектора',
      points: 50,
      frequency: 'DAILY' as const,
      taskType: 'MANUAL' as const,
      dailyGlobalLimit: null,
    },
    {
      orderNum: 7,
      title: '«Мемный чел»',
      description: 'Сделай мем связанный с лагерем и пришли его в сообщения сообщества',
      points: 30,
      frequency: 'DAILY' as const,
      taskType: 'SCREENSHOT' as const,
      dailyGlobalLimit: null,
    },
    {
      orderNum: 8,
      title: '«GYM-бро»',
      description: 'Приходи на зарядку первым и получи доп. балл (Получают первые 5 человек)',
      points: 10,
      frequency: 'DAILY' as const,
      taskType: 'MANUAL' as const,
      dailyGlobalLimit: 5,
    },
    {
      orderNum: 9,
      title: '«Живые легенды»',
      description: 'Победи на вечернем мероприятии и все члены вашей команды получат баллы',
      points: 30,
      frequency: 'DAILY' as const,
      taskType: 'MANUAL' as const,
      dailyGlobalLimit: null,
    },
    {
      orderNum: 10,
      title: '«Расскажи всем»',
      description: 'Выложи на своей странице пост о лагере с хештегом #Лампа_2026',
      points: 50,
      frequency: 'ONCE' as const,
      taskType: 'SCREENSHOT' as const,
      dailyGlobalLimit: null,
    },
    {
      orderNum: 11,
      title: '«МВП»',
      description: 'Сними вертикальное трендовое видео, связанное с лагерем и пришли в сообщения сообщества (1 день = 1 клип)',
      points: 80,
      frequency: 'DAILY' as const,
      taskType: 'SCREENSHOT' as const,
      dailyGlobalLimit: null,
    },
    {
      orderNum: 12,
      title: '«Фото со звездой»',
      description: 'Сделай фото с организаторами и пришли в сообщения сообщества',
      points: 20,
      frequency: 'ONCE' as const,
      taskType: 'SCREENSHOT' as const,
      dailyGlobalLimit: null,
    },
  ];

  for (const t of tasks) {
    const existing = await prisma.task.findFirst({ where: { title: t.title } });
    if (!existing) {
      await prisma.task.create({ data: t });
    }
  }
  console.log(`✅ Tasks seeded: ${tasks.length}`);

  // 2. Seed 5 Shop Items
  const shopItems = [
    {
      title: 'СЮРПРИЗ ОТ ОРГАНИЗАТОРОВ',
      price: 700,
      stock: 1,
      maxPerUser: null,
    },
    {
      title: 'ШОППЕР',
      price: 600,
      stock: 10,
      maxPerUser: null,
    },
    {
      title: 'СТИКЕРЫ',
      price: 500,
      stock: 10,
      maxPerUser: null,
    },
    {
      title: 'ЗАПАС ЕДЫ',
      price: 400,
      stock: 30,
      maxPerUser: null,
    },
    {
      title: 'VIP-БЕЙДЖ',
      price: 300,
      stock: 50,
      maxPerUser: 1,
    },
  ];

  for (const item of shopItems) {
    const existing = await prisma.shopItem.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.shopItem.create({ data: item });
    }
  }
  console.log(`✅ Shop items seeded: ${shopItems.length}`);

  // 3. Seed Demo Users
  const users = [
    {
      vkId: BigInt(10001),
      firstName: 'Алексей',
      lastName: 'Иванов',
      ratingPoints: 900,
      spendablePoints: 900,
      role: 'ADMIN' as const,
      teamName: 'Отряд 1',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    },
    {
      vkId: BigInt(10002),
      firstName: 'Екатерина',
      lastName: 'Смирнова',
      ratingPoints: 1000,
      spendablePoints: 1000,
      role: 'USER' as const,
      teamName: 'Отряд 2',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    },
    {
      vkId: BigInt(10003),
      firstName: 'Дмитрий',
      lastName: 'Соколов',
      ratingPoints: 800,
      spendablePoints: 800,
      role: 'USER' as const,
      teamName: 'Отряд 1',
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=200&q=80',
    },
  ];

  for (const u of users) {
    const existing = await prisma.user.findUnique({ where: { vkId: u.vkId } });
    if (!existing) {
      await prisma.user.create({ data: u });
    }
  }
  console.log(`✅ Demo users seeded`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
