import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@streamsphere.com' },
    update: { role: 'ADMIN', isVerified: true },
    create: {
      email: 'admin@streamsphere.com',
      username: 'admin',
      password: adminPassword,
      displayName: 'StreamSphere Admin',
      role: 'ADMIN',
      bio: 'Platform administrator',
      isVerified: true,
    },
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   Admin: admin@streamsphere.com / admin123456`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
