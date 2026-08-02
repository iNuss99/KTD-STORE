import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async log(performedByUserId: string, action: string, entity: string, entityId?: string, details?: any): Promise<AuditLog> {
    const auditLog = this.auditLogRepository.create({
      user_id: performedByUserId,
      action,
      entity,
      entity_id: entityId,
      details,
    });
    return this.auditLogRepository.save(auditLog);
  }

  @OnEvent('audit.log')
  async handleAuditLogEvent(payload: {
    performedByUserId: string;
    action: string;
    entity: string;
    entityId?: string;
    details?: any;
  }) {
    if (payload && payload.performedByUserId && payload.action && payload.entity) {
      await this.log(
        payload.performedByUserId,
        payload.action,
        payload.entity,
        payload.entityId,
        payload.details,
      );
    }
  }

  async getLogs(page = 1, limit = 20, action?: string, entity?: string) {
    const query = this.auditLogRepository
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.user', 'user')
      .orderBy('a.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (action) {
      query.andWhere('a.action ILIKE :action', { action: `%${action}%` });
    }

    if (entity) {
      query.andWhere('a.entity ILIKE :entity', { entity: `%${entity}%` });
    }

    const [logs, total] = await query.getManyAndCount();

    return {
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        entity: l.entity,
        entityId: l.entity_id,
        timestamp: l.timestamp,
        details: l.details,
        performedBy: {
          id: l.user?.id,
          fullName: l.user?.full_name || 'Hệ thống / N/A',
          email: l.user?.email,
          role: l.user?.role,
        },
      })),
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }
}
