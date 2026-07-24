import { Role, type Prisma, type PrismaClient } from '@prisma/client';
import type { AuthRole } from './auth';

type DbClient = PrismaClient | Prisma.TransactionClient;

type ReviewerRecord = {
  id: number;
  name: string;
  email: string;
  department: string | null;
  departmentId: number | null;
  facultyId: number | null;
  departmentRef: { id: number; name: string; facultyId: number | null } | null;
  faculty: { id: number; name: string } | null;
};

export type DepartmentReviewScope = {
  where: Prisma.PromotionRequestWhereInput;
  reviewer: ReviewerRecord | null;
  hasScope: boolean;
  scopeKind: 'institution' | 'department' | 'faculty' | 'unassigned';
  scopeLabel: string;
  scopeDetail: string;
};

function clean(value?: string | null) {
  return String(value || '').trim();
}

function uniqueText(values: Array<string | null | undefined>) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    const next = clean(value);
    const key = next.toLowerCase();
    if (next && !seen.has(key)) {
      seen.add(key);
      result.push(next);
    }
  }

  return result;
}

function userDepartmentNameFilters(names: string[]): Prisma.UserWhereInput[] {
  return names.flatMap((name) => [
    { department: { equals: name, mode: 'insensitive' } },
    { departmentRef: { is: { name: { equals: name, mode: 'insensitive' } } } },
  ]);
}

function userFacultyNameFilters(names: string[]): Prisma.UserWhereInput[] {
  return names.flatMap((name) => [
    { faculty: { is: { name: { equals: name, mode: 'insensitive' } } } },
    { departmentRef: { is: { faculty: { is: { name: { equals: name, mode: 'insensitive' } } } } } },
  ]);
}

function reviewerSelect() {
  return {
    id: true,
    name: true,
    email: true,
    department: true,
    departmentId: true,
    facultyId: true,
    departmentRef: { select: { id: true, name: true, facultyId: true } },
    faculty: { select: { id: true, name: true } },
  } satisfies Prisma.UserSelect;
}

export async function getDepartmentReviewScope(
  client: DbClient,
  input: {
    userId?: number | null;
    role?: AuthRole | null;
    sessionDepartment?: string | null;
  }
): Promise<DepartmentReviewScope> {
  if (input.role !== 'HOD_DEAN') {
    return {
      where: {},
      reviewer: null,
      hasScope: true,
      scopeKind: 'institution',
      scopeLabel: 'Institution-wide view',
      scopeDetail: 'System administrators can see all promotion records.',
    };
  }

  const reviewer = input.userId
    ? await client.user.findUnique({
        where: { id: input.userId },
        select: reviewerSelect(),
      })
    : null;

  const departmentNames = uniqueText([
    reviewer?.departmentRef?.name,
    reviewer?.department,
    input.sessionDepartment,
  ]);
  const facultyNames = uniqueText([reviewer?.faculty?.name]);
  const lecturerFilters: Prisma.UserWhereInput[] = [];

  if (reviewer?.departmentId) {
    lecturerFilters.push({ departmentId: reviewer.departmentId });
  }

  lecturerFilters.push(...userDepartmentNameFilters(departmentNames));

  if (lecturerFilters.length > 0) {
    return {
      where: { lecturer: { OR: lecturerFilters } },
      reviewer,
      hasScope: true,
      scopeKind: 'department',
      scopeLabel: reviewer?.departmentRef?.name || reviewer?.department || input.sessionDepartment || 'Department scope',
      scopeDetail: 'Department-scoped review workspace',
    };
  }

  const facultyFilters: Prisma.UserWhereInput[] = [];
  if (reviewer?.facultyId) {
    facultyFilters.push({ facultyId: reviewer.facultyId });
    facultyFilters.push({ departmentRef: { is: { facultyId: reviewer.facultyId } } });
  }

  facultyFilters.push(...userFacultyNameFilters(facultyNames));

  if (facultyFilters.length > 0) {
    return {
      where: { lecturer: { OR: facultyFilters } },
      reviewer,
      hasScope: true,
      scopeKind: 'faculty',
      scopeLabel: reviewer?.faculty?.name || 'Faculty scope',
      scopeDetail: 'Faculty-wide Dean review workspace',
    };
  }

  return {
    where: { lecturerId: -1 },
    reviewer,
    hasScope: false,
    scopeKind: 'unassigned',
    scopeLabel: 'No department assigned',
    scopeDetail: 'Assign this account to a department or faculty to activate review scope.',
  };
}

export async function canAccessDepartmentPromotionRequest(
  client: DbClient,
  input: {
    userId: number;
    role: AuthRole;
    sessionDepartment?: string | null;
    requestId: number;
  }
) {
  if (input.role !== 'HOD_DEAN') {
    return true;
  }

  const scope = await getDepartmentReviewScope(client, input);
  if (!scope.hasScope) {
    return false;
  }

  const count = await client.promotionRequest.count({
    where: {
      id: input.requestId,
      ...scope.where,
    },
  });

  return count > 0;
}

export async function findDepartmentReviewRecipientIds(
  client: DbClient,
  input: {
    promotionRequestId: number;
    excludeUserId?: number | null;
  }
) {
  const promotionRequest = await client.promotionRequest.findUnique({
    where: { id: input.promotionRequestId },
    select: {
      lecturer: {
        select: {
          department: true,
          departmentId: true,
          facultyId: true,
          departmentRef: { select: { id: true, name: true, facultyId: true } },
          faculty: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!promotionRequest) {
    return [];
  }

  const lecturer = promotionRequest.lecturer;
  const departmentNames = uniqueText([lecturer.departmentRef?.name, lecturer.department]);
  const facultyId = lecturer.facultyId || lecturer.departmentRef?.facultyId || null;
  const facultyNames = uniqueText([lecturer.faculty?.name]);
  const departmentReviewerFilters: Prisma.UserWhereInput[] = [];

  if (lecturer.departmentId) {
    departmentReviewerFilters.push({ departmentId: lecturer.departmentId });
  }

  departmentReviewerFilters.push(...userDepartmentNameFilters(departmentNames));

  const facultyReviewerFilters: Prisma.UserWhereInput[] = [];
  if (facultyId) {
    facultyReviewerFilters.push({
      AND: [
        { facultyId },
        { departmentId: null },
        { department: null },
      ],
    });
  }

  for (const name of facultyNames) {
    facultyReviewerFilters.push({
      AND: [
        { faculty: { is: { name: { equals: name, mode: 'insensitive' } } } },
        { departmentId: null },
        { department: null },
      ],
    });
  }

  const reviewerWhere: Prisma.UserWhereInput = {
    role: Role.HOD_DEAN,
    isActive: true,
    id: input.excludeUserId ? { not: input.excludeUserId } : undefined,
    OR: [...departmentReviewerFilters, ...facultyReviewerFilters],
  };

  const [scopedReviewers, systemAdmins] = await Promise.all([
    departmentReviewerFilters.length || facultyReviewerFilters.length
      ? client.user.findMany({ where: reviewerWhere, select: { id: true } })
      : Promise.resolve([]),
    client.user.findMany({
      where: {
        role: Role.SYSTEM_ADMIN,
        isActive: true,
        id: input.excludeUserId ? { not: input.excludeUserId } : undefined,
      },
      select: { id: true },
    }),
  ]);

  const fallbackReviewers = scopedReviewers.length
    ? []
    : await client.user.findMany({
        where: {
          role: Role.HOD_DEAN,
          isActive: true,
          id: input.excludeUserId ? { not: input.excludeUserId } : undefined,
        },
        select: { id: true },
      });

  return [...new Set([...scopedReviewers, ...fallbackReviewers, ...systemAdmins].map((user) => user.id))];
}
