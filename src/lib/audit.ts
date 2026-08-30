import prisma from "./db";

interface AuditLogParams {
  adminId: string;
  action: string;
  targetUserId?: string;
  previousValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(params: AuditLogParams) {
  return prisma.auditLog.create({
    data: {
      adminId: params.adminId,
      action: params.action,
      targetUserId: params.targetUserId,
      previousValue: params.previousValue,
      newValue: params.newValue,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
    },
  });
}

export async function getAuditLogs(limit = 100) {
  return prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      admin: { select: { username: true } },
      targetUser: { select: { username: true } },
    },
  });
}
