// User Interfaces
export interface IUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    organizationId: string;
    roleId: string;
    role?: IRole;
    organization?: IOrganization;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface IUserWithoutPassword extends Omit<IUser, 'password'> {}
  
  // Organization Interfaces
  export interface IOrganization {
    id: string;
    name: string;
    parentId?: string;
    parent?: IOrganization;
    children?: IOrganization[];
    users?: IUser[];
    tasks?: ITask[];
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Role Interfaces
  export enum RoleType {
    OWNER = 'Owner',
    ADMIN = 'Admin',
    VIEWER = 'Viewer'
  }
  
  export interface IRole {
    id: string;
    name: RoleType;
    level: number; // Owner=3, Admin=2, Viewer=1
    description?: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Task Interfaces
  export enum TaskStatus {
    TODO = 'todo',
    IN_PROGRESS = 'in-progress',
    DONE = 'done'
  }
  
  export enum TaskPriority {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high'
  }
  
  export enum TaskCategory {
    WORK = 'Work',
    PERSONAL = 'Personal',
    SHOPPING = 'Shopping',
    HEALTH = 'Health',
    OTHER = 'Other'
  }
  
  export interface ITask {
    id: string;
    title: string;
    description?: string;
    status: TaskStatus;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate?: Date;
    organizationId: string;
    organization?: IOrganization;
    createdById: string;
    createdBy?: IUser;
    assignedToId?: string;
    assignedTo?: IUser;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Audit Log Interfaces
  export enum AuditAction {
    CREATE = 'CREATE',
    READ = 'READ',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    LOGIN = 'LOGIN',
    LOGOUT = 'LOGOUT'
  }
  
  export enum AuditResource {
    TASK = 'TASK',
    USER = 'USER',
    ORGANIZATION = 'ORGANIZATION',
    AUTH = 'AUTH'
  }
  
  export interface IAuditLog {
    id: string;
    userId: string;
    user?: IUser;
    action: AuditAction;
    resource: AuditResource;
    resourceId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Date;
  }
  
  // JWT Payload
  export interface IJwtPayload {
    sub: string; // userId
    email: string;
    roleId: string;
    roleName: RoleType;
    roleLevel: number;
    organizationId: string;
    iat?: number;
    exp?: number;
  }
  
  // Auth Response
  export interface IAuthResponse {
    access_token: string;
    user: IUserWithoutPassword;
  }
  
  // Request User (attached to request after JWT validation)
  export interface IRequestUser {
    userId: string;
    email: string;
    roleId: string;
    roleName: RoleType;
    roleLevel: number;
    organizationId: string;
  }