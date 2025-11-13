import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, Organization, Role, Task } from '../entities';
import { RoleType, TaskStatus, TaskPriority, TaskCategory } from '@workspace/data';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Task)
    private taskRepository: Repository<Task>
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    // Check if already seeded
    const existingRoles = await this.roleRepository.count();
    if (existingRoles > 0) {
      console.log('Database already seeded, skipping...');
      return;
    }

    console.log('Seeding database...');

    // Create roles
    const ownerRole = this.roleRepository.create({
      name: RoleType.OWNER,
      level: 3,
      description: 'Full system access',
    });
    await this.roleRepository.save(ownerRole);

    const adminRole = this.roleRepository.create({
      name: RoleType.ADMIN,
      level: 2,
      description: 'Can manage users and tasks within organization',
    });
    await this.roleRepository.save(adminRole);

    const viewerRole = this.roleRepository.create({
      name: RoleType.VIEWER,
      level: 1,
      description: 'Read-only access, can only modify own tasks',
    });
    await this.roleRepository.save(viewerRole);

    // Create organizations (2-level hierarchy)
    const rootOrg = this.organizationRepository.create({
      name: 'TurboVets Inc.',
    });
    await this.organizationRepository.save(rootOrg);

    const engineeringOrg = this.organizationRepository.create({
      name: 'Engineering Department',
      parentId: rootOrg.id,
    });
    await this.organizationRepository.save(engineeringOrg);

    const marketingOrg = this.organizationRepository.create({
      name: 'Marketing Department',
      parentId: rootOrg.id,
    });
    await this.organizationRepository.save(marketingOrg);

    // Create users
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const ownerUser = this.userRepository.create({
      email: 'owner@turbovets.com',
      password: hashedPassword,
      firstName: 'John',
      lastName: 'Owner',
      organizationId: rootOrg.id,
      roleId: ownerRole.id,
    });
    await this.userRepository.save(ownerUser);

    const adminUser = this.userRepository.create({
      email: 'admin@turbovets.com',
      password: hashedPassword,
      firstName: 'Jane',
      lastName: 'Admin',
      organizationId: engineeringOrg.id,
      roleId: adminRole.id,
    });
    await this.userRepository.save(adminUser);

    const viewerUser = this.userRepository.create({
      email: 'viewer@turbovets.com',
      password: hashedPassword,
      firstName: 'Bob',
      lastName: 'Viewer',
      organizationId: engineeringOrg.id,
      roleId: viewerRole.id,
    });
    await this.userRepository.save(viewerUser);

    const marketingUser = this.userRepository.create({
      email: 'marketing@turbovets.com',
      password: hashedPassword,
      firstName: 'Alice',
      lastName: 'Marketing',
      organizationId: marketingOrg.id,
      roleId: adminRole.id,
    });
    await this.userRepository.save(marketingUser);

    // Create sample tasks
    const tasks = [
      {
        title: 'Implement JWT Authentication',
        description: 'Set up JWT-based authentication for the API',
        status: TaskStatus.DONE,
        category: TaskCategory.WORK,
        priority: TaskPriority.HIGH,
        organizationId: engineeringOrg.id,
        createdById: ownerUser.id,
        assignedToId: adminUser.id,
        sortOrder: 1,
      },
      {
        title: 'Design Task Management UI',
        description: 'Create wireframes and mockups for the dashboard',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: TaskPriority.MEDIUM,
        organizationId: engineeringOrg.id,
        createdById: adminUser.id,
        assignedToId: viewerUser.id,
        sortOrder: 2,
      },
      {
        title: 'Write API Documentation',
        description: 'Document all API endpoints with examples',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: TaskPriority.LOW,
        organizationId: engineeringOrg.id,
        createdById: adminUser.id,
        sortOrder: 3,
      },
      {
        title: 'Launch Marketing Campaign',
        description: 'Coordinate social media posts for product launch',
        status: TaskStatus.IN_PROGRESS,
        category: TaskCategory.WORK,
        priority: TaskPriority.HIGH,
        organizationId: marketingOrg.id,
        createdById: marketingUser.id,
        sortOrder: 1,
      },
      {
        title: 'Update Team on Progress',
        description: 'Send weekly update email to stakeholders',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: TaskPriority.MEDIUM,
        organizationId: rootOrg.id,
        createdById: ownerUser.id,
        sortOrder: 1,
      },
    ];

    for (const taskData of tasks) {
      const task = this.taskRepository.create(taskData);
      await this.taskRepository.save(task);
    }

    console.log('Database seeded successfully!');
    console.log('\n=== Test Credentials ===');
    console.log('Owner: owner@turbovets.com / Password123!');
    console.log('Admin: admin@turbovets.com / Password123!');
    console.log('Viewer: viewer@turbovets.com / Password123!');
    console.log('========================\n');
  }
}