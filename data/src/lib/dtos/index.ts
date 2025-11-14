import { TaskStatus, TaskPriority, TaskCategory, RoleType } from '../interfaces';

// Auth DTOs
export class LoginDto {
  email!: string;
  password!: string;
}

export class RegisterDto {
  email!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
  organizationId!: string;
  roleId!: string;
}

// User DTOs
export class CreateUserDto {
  email!: string;
  password!: string;
  firstName!: string;
  lastName!: string;
  organizationId!: string;
  roleId!: string;
}

export class UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
}

// Organization DTOs
export class CreateOrganizationDto {
  name!: string;
  parentId?: string;
}

export class UpdateOrganizationDto {
  name?: string;
  parentId?: string;
}

// Task DTOs
export class CreateTaskDto {
  title!: string;
  description?: string;
  status?: TaskStatus;
  category!: TaskCategory;
  priority!: TaskPriority;
  dueDate?: Date;
  assignedToId?: string;
  sortOrder?: number;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  dueDate?: Date;
  assignedToId?: string;
  sortOrder?: number;
}

export class TaskFilterDto {
  status?: TaskStatus;
  category?: TaskCategory;
  priority?: TaskPriority;
  assignedToId?: string;
  createdById?: string;
  search?: string;
  sortBy?: 'createdAt' | 'dueDate' | 'priority' | 'sortOrder';
  sortOrder?: 'ASC' | 'DESC';
}

// Response DTOs
export class ApiResponse<T> {
  success!: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class PaginatedResponse<T> {
  items!: T[];
  total!: number;
  page!: number;
  pageSize!: number;
  totalPages!: number;
}