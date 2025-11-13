import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser, MinRoleLevel } from '@workspace/auth';
import { IRequestUser } from '@workspace/data';

@Controller('audit-log')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @MinRoleLevel(2) // Only Admin and Owner can view all logs
  async getAllLogs(@CurrentUser() user: IRequestUser) {
    return this.auditService.getLogs(user.userId, user.roleLevel);
  }

  @Get('my-logs')
  async getMyLogs(@CurrentUser() user: IRequestUser) {
    return this.auditService.getUserLogs(user.userId);
  }
}