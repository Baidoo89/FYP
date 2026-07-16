import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function positiveIntFromEnv(key: string, fallback: number) {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export const WORKFLOW_TRANSACTION_OPTIONS = {
  maxWait: positiveIntFromEnv('PRISMA_TRANSACTION_MAX_WAIT_MS', 15000),
  timeout: positiveIntFromEnv('PRISMA_TRANSACTION_TIMEOUT_MS', 60000),
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
