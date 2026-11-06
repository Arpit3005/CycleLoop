import { prisma } from '../prisma.js';

interface AuditLogParams {
  actorId: string;
  actorType: 'ADMIN' | 'STUDENT' | 'SYSTEM';
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, any> | string;
}

export async function logAudit(params: AuditLogParams) {
  try {
    const metaString = typeof params.metadata === 'object' 
      ? JSON.stringify(params.metadata) 
      : params.metadata || null;

    await prisma.auditLog.create({
      data: {
        actorId: params.actorId,
        actorType: params.actorType,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        metadata: metaString
      }
    });
  } catch (err) {
    console.error('[AuditLog Error]', err);
  }
}
