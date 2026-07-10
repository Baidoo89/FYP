const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEMO_LECTURER_EMAIL = 'lecturer.demo@live.gctu.edu.gh';
const HR_EMAIL = 'hr.admin@gctu.edu.gh';
const HOD_EMAIL = 'hod.demo@gctu.edu.gh';
const COMMITTEE_EMAIL = 'committee.demo@gctu.edu.gh';
const SYSTEM_ADMIN_EMAIL = 'system.admin@gctu.edu.gh';

const sampleFiles = [
  {
    category: 'TEACHING',
    title: 'Teaching Portfolio and Student Evaluation Summary',
    fileName: 'b-493aeff07e84407aa34f848cc6a6bd78.pdf',
    fileSize: 34296,
  },
  {
    category: 'RESEARCH',
    title: 'Research Publications and Conference Evidence',
    fileName: 'clinton-awuah-s-cv-cb8631858da947059d6cc6fa15dc13a1.pdf',
    fileSize: 298248,
  },
  {
    category: 'SERVICE',
    title: 'University Service and Committee Participation Evidence',
    fileName: 'uml-diagrams-for-canteen-management-system-bf4e1a9a8d3740d29631ed54d1e68245.pdf',
    fileSize: 710141,
  },
  {
    category: 'QUALIFICATIONS',
    title: 'Academic Qualification Evidence',
    fileName: 'b-493aeff07e84407aa34f848cc6a6bd78.pdf',
    fileSize: 34296,
  },
  {
    category: 'PUBLICATIONS',
    title: 'Peer Reviewed Publication Evidence',
    fileName: 'clinton-awuah-s-cv-cb8631858da947059d6cc6fa15dc13a1.pdf',
    fileSize: 298248,
  },
  {
    category: 'PROFESSIONAL_DEVELOPMENT',
    title: 'Professional Development Certificates',
    fileName: 'uml-diagrams-for-canteen-management-system-bf4e1a9a8d3740d29631ed54d1e68245.pdf',
    fileSize: 710141,
  },
];

async function getRequiredUser(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`Required demo user missing: ${email}. Run npm run db:seed first.`);
  return user;
}

async function main() {
  const [lecturer, hrAdmin, hod, committee, systemAdmin] = await Promise.all([
    getRequiredUser(DEMO_LECTURER_EMAIL),
    getRequiredUser(HR_EMAIL),
    getRequiredUser(HOD_EMAIL),
    getRequiredUser(COMMITTEE_EMAIL),
    getRequiredUser(SYSTEM_ADMIN_EMAIL),
  ]);

  const previous = await prisma.promotionRequest.findMany({
    where: {
      lecturerId: lecturer.id,
      adminComment: { contains: 'DEMO_WORKFLOW' },
    },
    select: { id: true },
  });

  if (previous.length > 0) {
    await prisma.promotionRequest.deleteMany({
      where: { id: { in: previous.map((item) => item.id) } },
    });
  }

  const request = await prisma.promotionRequest.create({
    data: {
      lecturerId: lecturer.id,
      applicantId: lecturer.id,
      requestedById: lecturer.id,
      currentRank: 'LECTURER',
      targetRank: 'SENIOR_LECTURER',
      yearsInCurrentRank: 5,
      status: 'UNDER_COMMITTEE_REVIEW',
      eligibilityStatus: 'ELIGIBLE',
      eligibilityReason:
        'Verified evidence satisfies configured Lecturer to Senior Lecturer criteria. This is an eligibility recommendation only; final promotion decisions remain with university authorities.',
      totalScore: 72,
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 72),
      verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      adminComment: 'DEMO_WORKFLOW: HR verification completed and application forwarded to committee review.',
    },
  });

  for (const item of sampleFiles) {
    const document = await prisma.document.create({
      data: {
        requestId: request.id,
        promotionRequestId: request.id,
        uploadedById: lecturer.id,
        category: item.category,
        title: item.title,
        description: `Demo evidence for ${item.category.toLowerCase().replace(/_/g, ' ')}.`,
        fileUrl: `/api/uploads/${encodeURIComponent(item.fileName)}`,
        fileName: item.fileName,
        fileType: 'application/pdf',
        mimeType: 'application/pdf',
        fileSize: item.fileSize,
        status: 'VERIFIED',
        verificationStatus: 'VERIFIED',
        verifiedById: hrAdmin.id,
        verificationComment: 'Verified for supervisor demonstration.',
        verifiedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
    });

    await prisma.verification.create({
      data: {
        documentId: document.id,
        verifierId: hrAdmin.id,
        decision: 'VERIFIED',
        comment: 'Verified for supervisor demonstration.',
      },
    });
  }

  await prisma.score.createMany({
    data: [
      {
        promotionRequestId: request.id,
        category: 'TEACHING',
        score: 76,
        weight: 0.4,
        weightedScore: 30.4,
        performanceCategory: 'EXCELLENT',
        createdById: hrAdmin.id,
      },
      {
        promotionRequestId: request.id,
        category: 'RESEARCH',
        score: 70,
        weight: 0.4,
        weightedScore: 28,
        performanceCategory: 'EXCELLENT',
        createdById: hrAdmin.id,
      },
      {
        promotionRequestId: request.id,
        category: 'SERVICE',
        score: 68,
        weight: 0.2,
        weightedScore: 13.6,
        performanceCategory: 'VERY_GOOD',
        createdById: hrAdmin.id,
      },
    ],
  });

  await prisma.statusHistory.createMany({
    data: [
      {
        promotionRequestId: request.id,
        changedById: lecturer.id,
        oldStatus: 'DRAFT',
        newStatus: 'SUBMITTED',
        comment: 'Lecturer submitted demo promotion application.',
      },
      {
        promotionRequestId: request.id,
        changedById: hod.id,
        oldStatus: 'SUBMITTED',
        newStatus: 'UNDER_DEPARTMENT_REVIEW',
        comment: 'Demo application entered department review.',
      },
      {
        promotionRequestId: request.id,
        changedById: hod.id,
        oldStatus: 'UNDER_DEPARTMENT_REVIEW',
        newStatus: 'UNDER_HR_VERIFICATION',
        comment: 'Department reviewer forwarded demo application to HR.',
      },
      {
        promotionRequestId: request.id,
        changedById: hrAdmin.id,
        oldStatus: 'UNDER_HR_VERIFICATION',
        newStatus: 'UNDER_COMMITTEE_REVIEW',
        comment: 'HR verified evidence and forwarded demo application to committee.',
      },
    ],
  });

  await prisma.reviewComment.create({
    data: {
      promotionRequestId: request.id,
      reviewerId: committee.id,
      comment:
        'Demo committee note: evidence is complete and eligibility recommendation is ready for committee deliberation.',
      recommendation: 'REQUIRES_FURTHER_REVIEW',
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: lecturer.id,
        promotionRequestId: request.id,
        title: 'Demo application under committee review',
        message: 'Your demo promotion application has been verified and forwarded to committee review.',
        type: 'INFO',
      },
      {
        userId: committee.id,
        promotionRequestId: request.id,
        title: 'Demo application ready for review',
        message: 'A verified demo promotion application is ready for committee recommendation.',
        type: 'INFO',
      },
      {
        userId: hrAdmin.id,
        promotionRequestId: request.id,
        title: 'Demo workflow prepared',
        message: 'A populated demo promotion request is ready for HR and supervisor review.',
        type: 'SUCCESS',
      },
    ],
  });

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: systemAdmin.id,
        requestId: request.id,
        action: 'DEMO_WORKFLOW_SEEDED',
        entityType: 'PromotionRequest',
        entityId: String(request.id),
        description: 'Supervisor demo workflow data was seeded.',
      },
      {
        actorId: hrAdmin.id,
        requestId: request.id,
        action: 'ELIGIBILITY_CALCULATED',
        entityType: 'PromotionRequest',
        entityId: String(request.id),
        description: 'Demo eligibility recommendation calculated from verified evidence.',
        metadata: {
          eligibilityStatus: 'ELIGIBLE',
          totalScore: 72,
        },
      },
    ],
  });

  console.log('Demo workflow seeded successfully.');
  console.log(`Promotion request ID: ${request.id}`);
  console.log('Open HR queue: /hr/requests');
  console.log('Open committee review: /committee/review');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
