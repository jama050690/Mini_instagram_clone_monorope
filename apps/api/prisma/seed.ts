import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// PasswordService bilan bir xil cost (≥10).
const SALT_ROUNDS = 10;

interface SeedUser {
  email: string;
  password: string;
  username: string;
  fullName: string;
  role?: Role;
  isPrivate?: boolean;
  bio?: string;
}

const USERS: SeedUser[] = [
  {
    email: 'admin@example.com',
    password: 'admin1234',
    username: 'admin',
    fullName: 'Admin',
    role: Role.ADMIN,
    bio: 'Platforma administratori',
  },
  {
    email: 'user@example.com',
    password: 'user1234',
    username: 'user',
    fullName: 'Oddiy User',
    bio: 'Test foydalanuvchi',
  },
  // Qidiruv / follow / feed testlari uchun qo'shimcha userlar
  {
    email: 'aziz@example.com',
    password: 'aziz1234',
    username: 'aziz',
    fullName: 'Aziz Karimov',
  },
  {
    email: 'bobur@example.com',
    password: 'bobur1234',
    username: 'bobur',
    fullName: 'Bobur Aliyev',
  },
  {
    email: 'dilnoza@example.com',
    password: 'dilnoza1234',
    username: 'dilnoza',
    fullName: 'Dilnoza Yusupova',
    isPrivate: true,
    bio: 'Maxfiy akkaunt',
  },
];

async function main(): Promise<void> {
  console.log('🌱 Seed boshlandi...');

  for (const u of USERS) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email: u.email },
      // Mavjud bo'lsa — parol/rol/profilni qayta o'rnatamiz (idempotent + qayta seed)
      update: {
        passwordHash,
        username: u.username,
        fullName: u.fullName,
        role: u.role ?? Role.USER,
        isPrivate: u.isPrivate ?? false,
        bio: u.bio ?? null,
        isBlocked: false,
      },
      create: {
        email: u.email,
        passwordHash,
        username: u.username,
        fullName: u.fullName,
        role: u.role ?? Role.USER,
        isPrivate: u.isPrivate ?? false,
        bio: u.bio ?? null,
      },
    });
    console.log(
      `  ✓ ${user.role.padEnd(5)} ${u.email}  /  ${u.password}  (@${u.username})`,
    );
  }

  console.log('✅ Seed tugadi.');
}

main()
  .catch((e) => {
    console.error('❌ Seed xatosi:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
