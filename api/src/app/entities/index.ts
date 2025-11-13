import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index
  } from 'typeorm';
  import {
    IUser,
    IOrganization,
    IRole,
    ITask,
    IAuditLog,
    RoleType,
    TaskStatus,
    TaskPriority,
    TaskCategory,
    AuditAction,
    AuditResource
  } from '@workspace/data';

  // Role Entity
@Entity('roles')
export class Role implements IRole {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  name: RoleType;

  @Column({ type: 'int' })
  level: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => User, user => user.role)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Organization Entity
@Entity('organizations')
export class Organization implements IOrganization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  parentId: string;

  @ManyToOne(() => Organization, org => org.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Organization;

  @OneToMany(() => Organization, org => org.parent)
  children: Organization[];

  @OneToMany(() => User, user => user.organization)
  users: User[];

  @OneToMany(() => Task, task => task.organization)
  tasks: Task[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// User Entity
@Entity('users')
@Index(['email'], { unique: true })
export class User implements IUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @Column({ type: 'varchar' })
  firstName: string;

  @Column({ type: 'varchar' })
  lastName: string;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, org => org.users)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'uuid' })
  roleId: string;

  @ManyToOne(() => Role, role => role.users)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @OneToMany(() => Task, task => task.createdBy)
  createdTasks: Task[];

  @OneToMany(() => Task, task => task.assignedTo)
  assignedTasks: Task[];

  @OneToMany(() => AuditLog, log => log.user)
  auditLogs: AuditLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// Task Entity
@Entity('tasks')
@Index(['organizationId'])
@Index(['createdById'])
@Index(['assignedToId'])
export class Task implements ITask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', default: TaskStatus.TODO })
  status: TaskStatus;

  @Column({ type: 'varchar' })
  category: TaskCategory;

  @Column({ type: 'varchar', default: TaskPriority.MEDIUM })
  priority: TaskPriority;

  @Column({ type: 'datetime', nullable: true })
  dueDate: Date;

  @Column({ type: 'uuid' })
  organizationId: string;

  @ManyToOne(() => Organization, org => org.tasks)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column({ type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, user => user.createdTasks)
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'uuid', nullable: true })
  assignedToId: string;

  @ManyToOne(() => User, user => user.assignedTasks, { nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User;

  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

// AuditLog Entity
@Entity('audit_logs')
@Index(['userId'])
@Index(['timestamp'])
@Index(['resource', 'resourceId'])
export class AuditLog implements IAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, user => user.auditLogs)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'varchar' })
  action: AuditAction;

  @Column({ type: 'varchar' })
  resource: AuditResource;

  @Column({ type: 'uuid', nullable: true })
  resourceId: string;

  @Column({ type: 'text', nullable: true })
  details: string;

  @Column({ type: 'varchar', nullable: true })
  ipAddress: string;

  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @Column({ type: 'datetime' })
  timestamp: Date;
}