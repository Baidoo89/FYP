import { Prisma } from '@prisma/client';

export const V2_FOUNDATION_NOT_READY = 'V2_FOUNDATION_NOT_READY';

export function isV2FoundationUnavailable(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && ['P2021', 'P2022'].includes(error.code);
}
