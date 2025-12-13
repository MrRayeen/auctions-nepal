import { PrismaClient } from '@prisma/client';

// Declare a global variable to hold the Prisma client
// This is to avoid creating a new connection on every hot reload in development
declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;