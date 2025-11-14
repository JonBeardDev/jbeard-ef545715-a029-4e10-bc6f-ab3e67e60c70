import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';

// Entities
import { User, Organization, Role, Task, AuditLog } from './entities';

// Auth
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtStrategy } from './auth/jwt.strategy';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

// Tasks
import { TasksController } from './tasks/tasks.controller';
import { TasksService } from './tasks/tasks.service';

// Users
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

// Audit
import { AuditService } from './audit/audit.service';
import { AuditController } from './audit/audit.controller';

// Organizations & Roles
import { OrganizationsController } from './organizations/organizations.controller';
import { RolesController } from './roles/roles.controller';

// Seed
import { SeedService } from './seed/seed.service';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbType = configService.get('DB_TYPE') || 'sqlite';
        const config: any = {
          type: dbType,
          entities: [User, Organization, Role, Task, AuditLog],
          synchronize: true,
          logging: false,
        };

        if (dbType === 'sqlite') {
          config.database = configService.get('DB_DATABASE') || './data/taskmanagement.db';
        } else if (dbType === 'postgres') {
          config.host = configService.get('DB_HOST');
          config.port = configService.get('DB_PORT');
          config.username = configService.get('DB_USERNAME');
          config.password = configService.get('DB_PASSWORD');
          config.database = configService.get('DB_DATABASE');
        }

        return config;
      },
    }),

    // TypeORM repositories
    TypeOrmModule.forFeature([User, Organization, Role, Task, AuditLog]),

    // Passport & JWT
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET') || 'your-super-secret-jwt-key',
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRATION') || '1d',
        },
      }),
    }),
  ],
  controllers: [
    AuthController,
    TasksController,
    UsersController,
    AuditController,
    OrganizationsController,
    RolesController,
  ],
  providers: [
    // Services
    AuthService,
    TasksService,
    UsersService,
    AuditService,
    SeedService,
    
    // Strategies
    JwtStrategy,
    
    // Global guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}