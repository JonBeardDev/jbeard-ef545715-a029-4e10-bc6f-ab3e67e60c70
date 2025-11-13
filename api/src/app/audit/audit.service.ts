import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from '../entities';
import { AuditAction, AuditResource, IAuditLog } from '@workspace/data';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>
  ) {}

  async log(
    userId: string,
    action: AuditAction,
    resource: AuditResource,
    resourceId?: string,
    details?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuditLog> {
    const log = this.auditLogRepository.create({
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
      timestamp: new Date(),
    });

    const savedLog = await this.auditLogRepository.save(log);

    // Also log to console for development
    console.log(`[AUDIT] ${action} ${resource} by user ${userId}`, {
      resourceId,
      details,
      timestamp: savedLog.timestamp,
    });

    return savedLog;
  }

  async logLogin(userId: string, ipAddress?: string, userAgent?: string): Promise<AuditLog> {
    return this.log(userId, AuditAction.LOGIN, AuditResource.AUTH, userId, 'User logged in', ipAddress, userAgent);
  }

  async logTaskCreate(userId: string, taskId: string, details?: string): Promise<AuditLog> {
    return this.log(userId, AuditAction.CREATE, AuditResource.TASK, taskId, details);
  }

  async logTaskUpdate(userId: string, taskId: string, details?: string): Promise<AuditLog> {
    return this.log(userId, AuditAction.UPDATE, AuditResource.TASK, taskId, details);
  }

  async logTaskDelete(userId: string, taskId: string, details?: string): Promise<AuditLog> {
    return this.log(userId, AuditAction.DELETE, AuditResource.TASK, taskId, details);
  }

  async logTaskRead(userId: string, taskId?: string, details?: string): Promise<AuditLog> {
    return this.log(userId, AuditAction.READ, AuditResource.TASK, taskId, details);
  }

  async getLogs(userId: string, userRoleLevel: number): Promise<IAuditLog[]> {
    // Only Owner (level 3) and Admin (level 2) can view all logs
    if (userRoleLevel < 2) {
      return [];
    }

    return this.auditLogRepository.find({
      relations: ['user'],
      order: { timestamp: 'DESC' },
      take: 100, // Limit to last 100 logs
    });
  }

  async getUserLogs(userId: string): Promise<IAuditLog[]> {
    return this.auditLogRepository.find({
      where: { userId },
      relations: ['user'],
      order: { timestamp: 'DESC' },
      take: 50,
    });
  }
}