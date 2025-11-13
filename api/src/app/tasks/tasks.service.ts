import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, Like } from 'typeorm';
import { Task, Organization } from '../entities';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto, IRequestUser, ITask } from '@workspace/data';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    private auditService: AuditService
  ) {}

  async create(createTaskDto: CreateTaskDto, user: IRequestUser): Promise<ITask> {
    // Create task in user's organization
    const task = this.taskRepository.create({
      ...createTaskDto,
      organizationId: user.organizationId,
      createdById: user.userId,
      sortOrder: createTaskDto.sortOrder || 0,
    });

    const savedTask = await this.taskRepository.save(task);

    // Audit log
    await this.auditService.logTaskCreate(
      user.userId,
      savedTask.id,
      `Created task: ${savedTask.title}`
    );

    return this.taskRepository.findOne({
      where: { id: savedTask.id },
      relations: ['createdBy', 'assignedTo', 'organization'],
    });
  }

  async findAll(user: IRequestUser, filters?: TaskFilterDto): Promise<ITask[]> {
    // Get accessible organization IDs based on user's role and org hierarchy
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);

    const where: FindOptionsWhere<Task> = {
      organizationId: accessibleOrgIds.length === 1 ? accessibleOrgIds[0] : undefined,
    };

    // Apply filters
    if (filters) {
      if (filters.status) where['status'] = filters.status;
      if (filters.category) where['category'] = filters.category;
      if (filters.priority) where['priority'] = filters.priority;
      if (filters.assignedToId) where['assignedToId'] = filters.assignedToId;
      if (filters.createdById) where['createdById'] = filters.createdById;
    }

    let query = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.createdBy', 'createdBy')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.organization', 'organization');

    // Filter by accessible organizations
    if (accessibleOrgIds.length > 0) {
      query = query.where('task.organizationId IN (:...orgIds)', { orgIds: accessibleOrgIds });
    }

    // Apply additional filters
    if (filters?.status) {
      query = query.andWhere('task.status = :status', { status: filters.status });
    }
    if (filters?.category) {
      query = query.andWhere('task.category = :category', { category: filters.category });
    }
    if (filters?.priority) {
      query = query.andWhere('task.priority = :priority', { priority: filters.priority });
    }
    if (filters?.assignedToId) {
      query = query.andWhere('task.assignedToId = :assignedToId', { assignedToId: filters.assignedToId });
    }
    if (filters?.createdById) {
      query = query.andWhere('task.createdById = :createdById', { createdById: filters.createdById });
    }
    if (filters?.search) {
      query = query.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Sorting
    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'DESC';
    query = query.orderBy(`task.${sortBy}`, sortOrder);

    const tasks = await query.getMany();

    // Audit log
    await this.auditService.logTaskRead(user.userId, null, `Retrieved ${tasks.length} tasks`);

    return tasks;
  }

  async findOne(id: string, user: IRequestUser): Promise<ITask> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to this task
    await this.checkTaskAccess(task, user);

    // Audit log
    await this.auditService.logTaskRead(user.userId, task.id, `Viewed task: ${task.title}`);

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto, user: IRequestUser): Promise<ITask> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['createdBy', 'assignedTo', 'organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to this task
    await this.checkTaskAccess(task, user);

    // Check if user can modify (Viewers cannot modify)
    if (user.roleLevel < 2 && task.createdById !== user.userId) {
      throw new ForbiddenException('Viewers can only modify their own tasks');
    }

    // Update task
    Object.assign(task, updateTaskDto);
    const updatedTask = await this.taskRepository.save(task);

    // Audit log
    await this.auditService.logTaskUpdate(
      user.userId,
      task.id,
      `Updated task: ${task.title}`
    );

    return this.taskRepository.findOne({
      where: { id: updatedTask.id },
      relations: ['createdBy', 'assignedTo', 'organization'],
    });
  }

  async remove(id: string, user: IRequestUser): Promise<void> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['organization'],
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    // Check if user has access to this task
    await this.checkTaskAccess(task, user);

    // Only Admins and Owners can delete tasks, or the creator
    if (user.roleLevel < 2 && task.createdById !== user.userId) {
      throw new ForbiddenException('Only Admins, Owners, or task creators can delete tasks');
    }

    await this.taskRepository.remove(task);

    // Audit log
    await this.auditService.logTaskDelete(
      user.userId,
      id,
      `Deleted task: ${task.title}`
    );
  }

  private async checkTaskAccess(task: Task, user: IRequestUser): Promise<void> {
    const accessibleOrgIds = await this.getAccessibleOrganizationIds(user);

    if (!accessibleOrgIds.includes(task.organizationId)) {
      throw new ForbiddenException('You do not have access to this task');
    }
  }

  private async getAccessibleOrganizationIds(user: IRequestUser): Promise<string[]> {
    // Owners can see all organizations
    if (user.roleLevel === 3) {
      const allOrgs = await this.organizationRepository.find();
      return allOrgs.map(org => org.id);
    }

    // Admins and Viewers see their own org and child orgs
    const userOrg = await this.organizationRepository.findOne({
      where: { id: user.organizationId },
      relations: ['children'],
    });

    if (!userOrg) {
      return [user.organizationId];
    }

    const orgIds = [userOrg.id];

    // Add child organizations recursively
    const addChildOrgs = async (org: Organization) => {
      if (org.children && org.children.length > 0) {
        for (const child of org.children) {
          orgIds.push(child.id);
          const childWithChildren = await this.organizationRepository.findOne({
            where: { id: child.id },
            relations: ['children'],
          });
          if (childWithChildren) {
            await addChildOrgs(childWithChildren);
          }
        }
      }
    };

    await addChildOrgs(userOrg);

    return orgIds;
  }
}