import { Controller, Get } from '@nestjs/common';
import { Public } from '@workspace/auth';

@Controller()
export class AppController {
  @Public()
  @Get()
  getHealth() {
    return {
      status: 'ok',
      message: 'Task Management API is running',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth/login',
        tasks: '/api/tasks',
        users: '/api/users',
        roles: '/api/roles',
        organizations: '/api/organizations',
        audit: '/api/audit-log'
      }
    };
  }

  @Public()
  @Get('health')
  healthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString()
    };
  }
}