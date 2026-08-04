const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();
const SEED_PASSWORD = 'Password123!';

function hashPassword(password) {
  return bcrypt.hashSync(password, 12);
}

function rankLabel(rank) {
  return rank
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

async function upsertSeedUser(input) {
  const passwordHash = hashPassword(SEED_PASSWORD);
  const departmentName = input.departmentName || null;
  const facultyName = input.facultyName || null;
  const currentRank = input.currentRank || null;
  const department = departmentName
    ? await prisma.department.findUnique({ where: { name: departmentName } })
    : null;
  const faculty = facultyName
    ? await prisma.faculty.findUnique({ where: { name: facultyName } })
    : null;

  return prisma.user.upsert({
    where: { email: input.email },
    update: {
      name: input.name,
      password: passwordHash,
      passwordHash,
      role: input.role,
      staffId: input.staffId,
      department: departmentName,
      departmentId: department ? department.id : null,
      facultyId: faculty ? faculty.id : null,
      currentRank,
      phone: input.phone,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      onboarded: true,
    },
    create: {
      name: input.name,
      email: input.email,
      password: passwordHash,
      passwordHash,
      role: input.role,
      staffId: input.staffId,
      department: departmentName,
      departmentId: department ? department.id : null,
      facultyId: faculty ? faculty.id : null,
      currentRank,
      phone: input.phone,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      isActive: true,
      onboarded: true,
    },
  });
}

async function main() {
  const facultyComputing = await prisma.faculty.upsert({
    where: { name: 'Faculty of Computing and Information Systems' },
    update: { description: 'Computing, software, information systems, and cyber security programmes.' },
    create: {
      name: 'Faculty of Computing and Information Systems',
      description: 'Computing, software, information systems, and cyber security programmes.',
    },
  });

  const facultyEngineering = await prisma.faculty.upsert({
    where: { name: 'Faculty of Engineering' },
    update: { description: 'Engineering and applied technology programmes.' },
    create: {
      name: 'Faculty of Engineering',
      description: 'Engineering and applied technology programmes.',
    },
  });

  const facultyBusiness = await prisma.faculty.upsert({
    where: { name: 'Faculty of Business' },
    update: { description: 'Business, management, and professional studies programmes.' },
    create: {
      name: 'Faculty of Business',
      description: 'Business, management, and professional studies programmes.',
    },
  });

  const departments = [
    ['Computer Science', facultyComputing.id],
    ['Software Engineering', facultyComputing.id],
    ['Information Technology', facultyComputing.id],
    ['Cyber Security', facultyEngineering.id],
    ['Business School', facultyBusiness.id],
  ];

  for (const [name, facultyId] of departments) {
    await prisma.department.upsert({
      where: { name },
      update: { facultyId },
      create: { name, facultyId },
    });
  }

  const systemAdmin = await upsertSeedUser({
    name: 'System Administrator',
    email: 'system.admin@live.gctu.edu.gh',
    role: 'SYSTEM_ADMIN',
    staffId: 'GCTU-SYS-001',
    departmentName: 'Information Technology',
    facultyName: 'Faculty of Computing and Information Systems',
    currentRank: 'SENIOR_LECTURER',
    phone: '+233 200 000 001',
  });


  await upsertSeedUser({
    name: 'Prof. Kwame Boateng',
    email: 'hod.dean@live.gctu.edu.gh',
    role: 'HOD_DEAN',
    staffId: 'GCTU-HOD-001',
    departmentName: 'Computer Science',
    facultyName: 'Faculty of Computing and Information Systems',
    currentRank: 'PROFESSOR',
    phone: '+233 200 000 003',
  });

  const hrAdmin = await upsertSeedUser({
    name: 'HR Administrator',
    email: 'hr.admin@live.gctu.edu.gh',
    role: 'HR_ADMIN',
    staffId: 'GCTU-HR-001',
    departmentName: null,
    facultyName: null,
    currentRank: null,
    phone: '+233 200 000 004',
  });

  await upsertSeedUser({
    name: 'Committee Reviewer',
    email: 'committee.reviewer@live.gctu.edu.gh',
    role: 'COMMITTEE_REVIEWER',
    staffId: 'GCTU-COM-001',
    departmentName: 'Software Engineering',
    facultyName: 'Faculty of Computing and Information Systems',
    currentRank: 'ASSOCIATE_PROFESSOR',
    phone: '+233 200 000 005',
  });


  const requiredDocumentCategories = [
    'TEACHING',
    'RESEARCH',
    'SERVICE',
    'QUALIFICATIONS',
    'PUBLICATIONS',
    'PROFESSIONAL_DEVELOPMENT',
  ];

  const criteria = [
    {
      currentRank: 'LECTURER',
      targetRank: 'SENIOR_LECTURER',
      minimumYearsInCurrentRank: 4,
      minimumPerformanceCategory: 'GOOD',
      minimumTotalScore: 55,
      publicationRequirement: 'Evidence of peer-reviewed publications or accepted scholarly outputs.',
      professionalDevelopmentRequirement: 'Evidence of relevant workshops, certifications, or academic development.',
    },
    {
      currentRank: 'SENIOR_LECTURER',
      targetRank: 'ASSOCIATE_PROFESSOR',
      minimumYearsInCurrentRank: 5,
      minimumPerformanceCategory: 'VERY_GOOD',
      minimumTotalScore: 65,
      publicationRequirement: 'Strong publication record with discipline-relevant research impact.',
      professionalDevelopmentRequirement: 'Evidence of continuous professional and academic development.',
    },
    {
      currentRank: 'ASSOCIATE_PROFESSOR',
      targetRank: 'PROFESSOR',
      minimumYearsInCurrentRank: 5,
      minimumPerformanceCategory: 'EXCELLENT',
      minimumTotalScore: 70,
      publicationRequirement: 'Sustained high-quality publications, leadership, and visible scholarly contribution.',
      professionalDevelopmentRequirement: 'Evidence of academic leadership, mentorship, and professional contribution.',
    },
  ];

  for (const item of criteria) {
    await prisma.promotionCriteria.upsert({
      where: {
        currentRank_targetRank: {
          currentRank: item.currentRank,
          targetRank: item.targetRank,
        },
      },
      update: {
        minimumYearsInCurrentRank: item.minimumYearsInCurrentRank,
        requiredDocumentCategories,
        requiredTeachingEvidence: 1,
        requiredResearchPublicationEvidence: 1,
        requiredServiceEvidence: 1,
        minimumPerformanceCategory: item.minimumPerformanceCategory,
        scoringEnabled: true,
        minimumTotalScore: item.minimumTotalScore,
        publicationRequirement: item.publicationRequirement,
        professionalDevelopmentRequirement: item.professionalDevelopmentRequirement,
        optionalReviewerNotes: `${rankLabel(item.currentRank)} to ${rankLabel(item.targetRank)} institutional criteria.`,
        isActive: true,
        updatedById: systemAdmin.id,
      },
      create: {
        currentRank: item.currentRank,
        targetRank: item.targetRank,
        minimumYearsInCurrentRank: item.minimumYearsInCurrentRank,
        requiredDocumentCategories,
        requiredTeachingEvidence: 1,
        requiredResearchPublicationEvidence: 1,
        requiredServiceEvidence: 1,
        minimumPerformanceCategory: item.minimumPerformanceCategory,
        scoringEnabled: true,
        minimumTotalScore: item.minimumTotalScore,
        publicationRequirement: item.publicationRequirement,
        professionalDevelopmentRequirement: item.professionalDevelopmentRequirement,
        optionalReviewerNotes: `${rankLabel(item.currentRank)} to ${rankLabel(item.targetRank)} institutional criteria.`,
        createdById: systemAdmin.id,
        updatedById: systemAdmin.id,
      },
    });
  }

  await prisma.systemSetting.upsert({
    where: { key: 'system.title' },
    update: { value: 'Digital Staff Promotion Support System for GCTU' },
    create: {
      key: 'system.title',
      value: 'Digital Staff Promotion Support System for GCTU',
      description: 'Formal system title displayed across administrative pages.',
    },
  });

  await prisma.systemSetting.upsert({
    where: { key: 'rank.levels' },
    update: {
      value: JSON.stringify([
        'Assistant Lecturer',
        'Lecturer',
        'Senior Lecturer',
        'Associate Professor',
        'Professor',
      ]),
    },
    create: {
      key: 'rank.levels',
      value: JSON.stringify([
        'Assistant Lecturer',
        'Lecturer',
        'Senior Lecturer',
        'Associate Professor',
        'Professor',
      ]),
      description: 'Configured academic rank levels for promotion workflows.',
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: systemAdmin.id,
      action: 'SEED_DATA_REFRESHED',
      entityType: 'System',
      description: 'Official faculties, departments, role accounts, criteria, and settings were seeded.',
    },
  });

  console.log('Seed data ready for GCTU Promotion System.');
  console.log(`Seed password for pre-created role accounts: ${SEED_PASSWORD}`);
  console.log('HOD/DEAN: hod.dean@live.gctu.edu.gh');
  console.log('HR ADMIN: hr.admin@live.gctu.edu.gh');
  console.log('COMMITTEE: committee.reviewer@live.gctu.edu.gh');
  console.log('SYSTEM ADMIN: system.admin@live.gctu.edu.gh');
  console.log('Lecturers should register through /register with an official @live.gctu.edu.gh email.');
  console.log(`Seeded HR admin id: ${hrAdmin.id}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
