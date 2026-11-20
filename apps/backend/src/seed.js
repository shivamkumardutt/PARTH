
import 'dotenv/config';

import { PrismaClient } from './generated/prisma/client.ts';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const roles = [
  { name: 'STUDENT', description: 'Student account' },
  { name: 'PARENT', description: 'Parent or guardian account' },
  { name: 'TEACHER', description: 'Teacher account' },
  { name: 'CREATOR', description: 'Educational content creator' },
  { name: 'ADMIN', description: 'Platform administrator' },
  { name: 'INSTITUTION_ADMIN', description: 'School or institution administrator' },
];

const educationBoards = [
  {
    name: 'Central Board of Secondary Education',
    code: 'CBSE',
  },
  {
    name: 'Council for the Indian School Certificate Examinations',
    code: 'ICSE',
  },
  {
    name: 'Bihar School Examination Board',
    code: 'BSEB',
  },
  {
    name: 'Uttar Pradesh Madhyamik Shiksha Parishad',
    code: 'UPMSP',
  },
  {
    name: 'Punjab School Education Board',
    code: 'PSEB',
  },
];


const educationLevels = [
  // Early Childhood Education
  {
    code: 'PLAYGROUP',
    name: 'Playgroup',
    category: 'EARLY_CHILDHOOD',
    sortOrder: 1,
  },
  {
    code: 'NURSERY',
    name: 'Nursery',
    category: 'EARLY_CHILDHOOD',
    sortOrder: 2,
  },
  {
    code: 'LKG',
    name: 'Lower Kindergarten (LKG)',
    category: 'EARLY_CHILDHOOD',
    sortOrder: 3,
  },
  {
    code: 'UKG',
    name: 'Upper Kindergarten (UKG)',
    category: 'EARLY_CHILDHOOD',
    sortOrder: 4,
  },

  // School Education
  {
    code: 'SCHOOL',
    name: 'School Education (Class 1–12)',
    category: 'SCHOOL',
    sortOrder: 5,
  },

  // Vocational Education
  {
    code: 'ITI',
    name: 'Industrial Training Institute (ITI)',
    category: 'VOCATIONAL',
    sortOrder: 6,
  },
  {
    code: 'DIPLOMA',
    name: 'Diploma / Polytechnic',
    category: 'VOCATIONAL',
    sortOrder: 7,
  },

  // Higher Education
  {
    code: 'UNDERGRADUATE',
    name: 'Undergraduate (UG)',
    category: 'HIGHER_EDUCATION',
    sortOrder: 8,
  },
  {
    code: 'POSTGRADUATE',
    name: 'Postgraduate (PG)',
    category: 'HIGHER_EDUCATION',
    sortOrder: 9,
  },
  {
    code: 'DOCTORAL',
    name: 'Doctoral / PhD',
    category: 'HIGHER_EDUCATION',
    sortOrder: 10,
  },
  {
    code: 'PROFESSIONAL',
    name: 'Professional Education',
    category: 'HIGHER_EDUCATION',
    sortOrder: 11,
  },
];


async function main() {
  // Seed system roles
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
  }

  console.log('System roles seeded successfully.');

  // Seed education boards and grades
  for (const boardData of educationBoards) {
    const board = await prisma.board.upsert({
      where: { code: boardData.code },
      update: {
        name: boardData.name,
        countryCode: 'IN',
        isActive: true,
      },
      create: {
        ...boardData,
        countryCode: 'IN',
        isActive: true,
      },
    });

    for (let level = 1; level <= 12; level++) {
      await prisma.grade.upsert({
        where: {
          boardId_level: {
            boardId: board.id,
            level,
          },
        },
        update: {
          name: `Class ${level}`,
        },
        create: {
          boardId: board.id,
          name: `Class ${level}`,
          level,
        },
      });
    }

    console.log(`Education data seeded: ${board.code}`);
  }
    
  // Seed PARTH education levels
  for (const level of educationLevels) {
    await prisma.educationLevel.upsert({
      where: { code: level.code },
      update: {
        name: level.name,
        category: level.category,
        sortOrder: level.sortOrder,
        countryCode: 'IN',
        isActive: true,
      },
      create: {
        ...level,
        countryCode: 'IN',
        isActive: true,
      },
    });
  }

  console.log('PARTH education levels seeded successfully.');

  const savedEducationLevels =
    await prisma.educationLevel.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });

  console.table(savedEducationLevels);


  const savedRoles = await prisma.role.findMany({
    orderBy: { name: 'asc' },
  });

  const savedBoards = await prisma.board.findMany({
    include: {
      grades: {
        orderBy: { level: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  });

  console.log('\nPARTH system roles:');
  console.table(savedRoles);

  console.log('\nPARTH education boards:');
  for (const board of savedBoards) {
    console.log(`${board.name} (${board.code}): ${board.grades.length} grades`);
  }
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
