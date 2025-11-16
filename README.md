# Task Management System - Secure RBAC Implementation

A full-stack task management system built with NestJS, Angular, and TypeORM, featuring JWT authentication and comprehensive role-based access control (RBAC).

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Setup Instructions](#setup-instructions)
- [Data Model](#data-model)
- [Access Control Implementation](#access-control-implementation)
- [API Documentation](#api-documentation)
- [Testing](#testing)
- [Security Features](#security-features)
- [Future Improvements](#future-improvements)

## 🏗️ Architecture Overview

### Monorepo Structure

```
│   ├── api/                    # NestJS Backend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── auth/       # Authentication module
│   │   │   │   ├── users/      # User management
│   │   │   │   ├── tasks/      # Task CRUD operations
│   │   │   │   ├── audit/      # Audit logging
│   │   │   │   ├── organizations/
│   │   │   │   ├── roles/
│   │   │   │   └── entities/   # TypeORM entities
│   │   │   └── main.ts
│   │   └── project.json
│   └── dashboard/              # Angular Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── auth/       # Login component
│       │   │   ├── tasks/      # Task dashboard
│       │   │   ├── users/      # User management
│       │   │   └── core/       # Services, guards, interceptors
│       │   └── main.ts
│       └── project.json
│   ├── data/                   # Shared TypeScript interfaces
│   │   └── src/
│   │       ├── interfaces/
│   │       └── dtos/
│   └── auth/                   # Shared RBAC decorators
│       └── src/
│           ├── decorators/
│           └── guards/
```

### Technology Stack

**Backend:**
- NestJS - Modular Node.js framework
- TypeORM - ORM for database operations
- SQLite - Development database (easily swappable for PostgreSQL)
- Passport & JWT - Authentication strategy
- bcrypt - Password hashing

**Frontend:**
- Angular 17+ - Standalone components
- TailwindCSS - Utility-first styling
- RxJS - Reactive state management
- Angular CDK - Drag & drop functionality

**Shared:**
- NX - Monorepo management
- TypeScript - Type safety across stack

### Design Rationale

1. **NX Monorepo**: Enables code sharing between frontend and backend, ensures type safety, and simplifies dependency management.

2. **Shared Libraries**:
   - `libs/data`: Common interfaces and DTOs prevent duplication and ensure consistency
   - `libs/auth`: Reusable RBAC decorators and guards

3. **Standalone Angular Components**: Modern Angular approach, better tree-shaking, and easier lazy loading.

4. **JWT Authentication**: Stateless authentication suitable for scalable applications.

5. **Service Layer RBAC**: Authorization checks happen in service layer, not just guards, preventing privilege escalation.

## 🚀 Setup Instructions

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- NX CLI (optional but recommended)

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd yourname-uuid
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure environment variables:**

Create a `.env` file in the root directory:

```env
# JWT Configuration
JWT_SECRET=super-secret-jwt-key
JWT_EXPIRATION=1d

# Database Configuration
DB_TYPE=sqlite
DB_DATABASE=./data/taskmanagement.db

# Application
PORT=3000
NODE_ENV=development
```

4. **Run database migrations:**

The database will be auto-created on first run with TypeORM's `synchronize` option. Initial seed data includes:
- 3 Roles (Owner, Admin, Viewer)
- 3 Organizations (root + 2 children)
- 4 Test users
- 5 Sample tasks

### Running the Application

**Option 1: Run both apps concurrently**
```bash
npm run serve:all
# or
nx run-many --target=serve --projects=api,dashboard --parallel
```

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
nx serve api
# API runs on http://localhost:3000
```

Terminal 2 (Frontend):
```bash
nx serve dashboard
# Dashboard runs on http://localhost:4200
```

### Test Credentials

After first run, use these credentials to login:

| Email | Password | Role | Description |
|-------|----------|------|-------------|
| owner@turbovets.com | Password123! | Owner | Full system access |
| admin@turbovets.com | Password123! | Admin | Manage users and tasks in organization |
| viewer@turbovets.com | Password123! | Viewer | Read-only, can modify own tasks |
| marketing@turbovets.com | Password123! | Admin | Marketing department admin |

## 📊 Data Model

### Entity Relationship Diagram

```
┌─────────────────┐
│  Organizations  │
│─────────────────│
│ id (PK)         │
│ name            │
│ parentId (FK)   │◄────┐ Self-reference
│ createdAt       │     │ (2-level hierarchy)
│ updatedAt       │     │
└─────────────────┘     │
         │              │
         │              │
         ▼              │
┌─────────────────┐     │
│     Users       │     │
│─────────────────│     │
│ id (PK)         │     │
│ email (unique)  │     │
│ password (hash) │     │
│ firstName       │     │
│ lastName        │     │
│ organizationId  ├─────┘
│ roleId (FK)     ├─────┐
│ createdAt       │     │
│ updatedAt       │     │
└─────────────────┘     │
         │              │
         │              ▼
         │      ┌─────────────────┐
         │      │     Roles       │
         │      │─────────────────│
         │      │ id (PK)         │
         │      │ name (unique)   │
         │      │ level (int)     │
         │      │ description     │
         │      │ createdAt       │
         │      │ updatedAt       │
         │      └─────────────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────────┐ ┌─────────────────┐
│     Tasks       │ │   AuditLogs     │
│─────────────────│ │─────────────────│
│ id (PK)         │ │ id (PK)         │
│ title           │ │ userId (FK)     │
│ description     │ │ action          │
│ status          │ │ resource        │
│ category        │ │ resourceId      │
│ priority        │ │ details         │
│ dueDate         │ │ ipAddress       │
│ organizationId  │ │ userAgent       │
│ createdById (FK)│ │ timestamp       │
│ assignedToId    │ └─────────────────┘
│ sortOrder       │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
```

### Schema Details

**Roles** (3 levels of hierarchy)
- **Owner (Level 3)**: Full system access, can see all organizations and users
- **Admin (Level 2)**: Manage users and tasks within their organization and child organizations
- **Viewer (Level 1)**: Read-only access, can only modify their own tasks

**Organizations** (2-level hierarchy)
- Root organization (e.g., "TurboVets Inc.")
- Child organizations (e.g., "Engineering Department", "Marketing Department")
- Users belong to one organization
- Access cascades down the hierarchy (Admins can see child org data)

**Tasks**
- Belong to one organization
- Created by a user (createdById)
- Can be assigned to a user (assignedToId)
- Have status, priority, category, and due date

**Audit Logs**
- Track all significant actions (CREATE, UPDATE, DELETE, LOGIN)
- Include user, resource type, resource ID, and timestamp
- Store IP address and user agent for security

## 🔐 Access Control Implementation

### JWT Authentication Flow

1. **Login**: User submits credentials
2. **Validation**: Backend verifies email/password
3. **Token Generation**: JWT payload includes:
   ```typescript
   {
     sub: userId,
     email: userEmail,
     roleId: roleId,
     roleName: roleName,
     roleLevel: roleLevel,
     organizationId: organizationId
   }
   ```
4. **Token Storage**: Frontend stores JWT in localStorage
5. **Request Authentication**: HTTP interceptor attaches token to all requests
6. **Token Verification**: Backend validates JWT on each request

### RBAC Implementation

#### Guard Architecture

```typescript
// 1. JwtAuthGuard - Validates JWT token
@UseGuards(JwtAuthGuard)

// 2. RolesGuard - Checks role requirements
@UseGuards(RolesGuard)

// Combined usage:
@UseGuards(JwtAuthGuard, RolesGuard)
@MinRoleLevel(2) // Requires Admin or Owner
@Controller('users')
export class UsersController { }
```

#### Role-Based Decorators

```typescript
// Require specific roles
@Roles(RoleType.OWNER, RoleType.ADMIN)

// Require minimum role level
@MinRoleLevel(2) // Admin or Owner

// Mark route as public (no auth required)
@Public()

// Get current user in controller
getUserProfile(@CurrentUser() user: IRequestUser)
```

#### Service-Layer Authorization

RBAC is enforced at the service layer, not just in guards:

```typescript
// Example: TasksService.remove()
async remove(id: string, user: IRequestUser): Promise<void> {
  const task = await this.findTask(id);
  
  // Check organization access
  await this.checkTaskAccess(task, user);
  
  // Check role permissions
  if (user.roleLevel < 2 && task.createdById !== user.userId) {
    throw new ForbiddenException('Only Admins, Owners, or task creators can delete tasks');
  }
  
  await this.taskRepository.remove(task);
}
```

### Organization-Level Scoping

Data visibility is scoped based on user's organization:

1. **Owners**: See all organizations and all data
2. **Admins**: See their organization and child organizations
3. **Viewers**: See their organization and child organizations

```typescript
private async getAccessibleOrganizationIds(user: IRequestUser): Promise<string[]> {
  if (user.roleLevel === 3) {
    // Owners see everything
    const allOrgs = await this.organizationRepository.find();
    return allOrgs.map(org => org.id);
  }
  
  // Get user's org and recursively add children
  const userOrg = await this.organizationRepository.findOne({
    where: { id: user.organizationId },
    relations: ['children']
  });
  
  return this.getOrgHierarchyIds(userOrg);
}
```

### Permission Matrix

| Action | Owner | Admin | Viewer |
|--------|-------|-------|--------|
| View all tasks | ✅ All orgs | ✅ Own org + children | ✅ Own org + children |
| Create task | ✅ | ✅ | ✅ |
| Edit any task | ✅ | ✅ | ❌ (only own) |
| Delete any task | ✅ | ✅ | ❌ (only own) |
| Create user | ✅ | ✅ | ❌ |
| Delete user | ✅ | ✅ | ❌ |
| View audit logs | ✅ | ✅ | ❌ |

## 📡 API Documentation

Base URL: `http://localhost:3000/api`

### Authentication Endpoints

#### POST /auth/login
Login with credentials

**Request:**
```json
{
  "email": "admin@turbovets.com",
  "password": "Password123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@turbovets.com",
    "firstName": "Jane",
    "lastName": "Admin",
    "role": {
      "id": "uuid",
      "name": "Admin",
      "level": 2
    },
    "organization": {
      "id": "uuid",
      "name": "Engineering Department"
    }
  }
}
```

#### POST /auth/register
Register a new user (requires invitation/admin access in production)

**Request:**
```json
{
  "email": "newuser@turbovets.com",
  "password": "Password123!",
  "firstName": "New",
  "lastName": "User",
  "organizationId": "org-uuid",
  "roleId": "role-uuid"
}
```

#### GET /auth/me
Get current user profile

**Headers:**
```
Authorization: Bearer <token>
```

### Task Endpoints

#### GET /tasks
Get all accessible tasks

**Query Parameters:**
- `status`: Filter by status (todo, in-progress, done)
- `category`: Filter by category
- `priority`: Filter by priority (low, medium, high)
- `search`: Search in title/description
- `sortBy`: Sort field (createdAt, dueDate, priority, sortOrder)
- `sortOrder`: ASC or DESC

**Example:**
```bash
GET /api/tasks?status=in-progress&priority=high&sortBy=dueDate&sortOrder=ASC
```

#### POST /tasks
Create a new task

**Request:**
```json
{
  "title": "Implement authentication",
  "description": "Add JWT auth to API",
  "status": "todo",
  "category": "Work",
  "priority": "high",
  "assignedToId": "user-uuid",
  "dueDate": "2024-12-31T23:59:59Z"
}
```

#### PUT /tasks/:id
Update a task

**Request:**
```json
{
  "status": "in-progress",
  "priority": "medium"
}
```

#### DELETE /tasks/:id
Delete a task

### User Endpoints (Admin/Owner only)

#### GET /users
Get all users in accessible organizations

#### POST /users
Create a new user

**Request:**
```json
{
  "email": "newuser@turbovets.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "organizationId": "org-uuid",
  "roleId": "role-uuid"
}
```

#### PUT /users/:id
Update user information

#### DELETE /users/:id
Delete a user (cannot delete self or users with higher role level)

### Audit Endpoints

#### GET /audit-log
Get audit logs (Admin/Owner only)

Returns last 100 audit entries

#### GET /audit-log/my-logs
Get current user's audit logs

### Reference Data Endpoints

#### GET /roles
Get all available roles

#### GET /organizations
Get accessible organizations

## 🧪 Testing

### Running Tests

```bash
# Run all tests
nx run-many --target=test --all

# Run backend tests only
nx test api

# Run frontend tests only
nx test dashboard

# Run tests with coverage
nx test api --coverage
```

### Test Coverage

The implementation includes:

1. **Unit Tests**:
   - AuthService: Login, registration, token validation
   - TasksService: CRUD operations, RBAC checks
   - UsersService: User management with role hierarchy
   - Guards: JWT validation, role-based access

2. **Test Scenarios**:
   - ✅ Successful authentication
   - ✅ Invalid credentials rejection
   - ✅ Role-based access control
   - ✅ Organization scoping
   - ✅ Permission escalation prevention
   - ✅ Task visibility based on organization
   - ✅ Viewer can only modify own tasks
   - ✅ Admin/Owner can modify all tasks in scope

### Manual Testing Workflows

**Workflow 1: Login as different roles**
1. Login as Owner → See all tasks from all organizations
2. Login as Admin → See tasks from own org + children
3. Login as Viewer → See tasks but limited edit permissions

**Workflow 2: Task CRUD with different roles**
1. Login as Viewer
2. Create a task (✅ allowed)
3. Try to edit another user's task (❌ forbidden)
4. Edit own task (✅ allowed)
5. Try to delete another user's task (❌ forbidden)

**Workflow 3: User management**
1. Login as Admin
2. Navigate to Users page
3. Try to create Owner role user (❌ forbidden - can't create equal/higher role)
4. Create Viewer role user (✅ allowed)
5. Try to delete self (❌ forbidden)

**Workflow 4: Restricted access attempt**
1. Login as Viewer
2. Try to access /audit-log endpoint directly (❌ 403 Forbidden)
3. Try to access /users page (❌ redirect to dashboard)

## 🔒 Security Features

### Implemented

1. **JWT Authentication**
   - Tokens signed with secret key
   - Configurable expiration (default: 1 day)
   - Token verification on every request

2. **Password Security**
   - bcrypt hashing with salt rounds (10)
   - Passwords never returned in API responses
   - Minimum password requirements (enforced client-side)

3. **RBAC Enforcement**
   - Multi-layer: Guards + Service layer
   - Prevents privilege escalation
   - Role hierarchy respected (can't create higher role)

4. **Organization Scoping**
   - Data isolation between organizations
   - Hierarchical access (parent → children)
   - Query-level filtering

5. **Audit Logging**
   - All sensitive operations logged
   - Includes user, action, resource, timestamp
   - IP address and user agent tracking
   - Console output + database persistence

6. **Input Validation**
   - DTOs with class-validator
   - Type safety with TypeScript
   - SQL injection prevention via TypeORM parameterization

7. **Error Handling**
   - Generic error messages (don't leak info)
   - Proper HTTP status codes
   - Centralized exception filters

### Environment Protection

- Secrets in `.env` file (not committed)
- CORS configuration for allowed origins
- Rate limiting ready (can be added via throttler)

## 🚀 Future Improvements

### Security Enhancements

1. **JWT Refresh Tokens**
   - Implement refresh token rotation
   - Short-lived access tokens (15 min)
   - Long-lived refresh tokens (7 days)
   - Blacklist for revoked tokens

2. **Enhanced Password Security**
   - Password strength meter
   - Password history (prevent reuse)
   - Force password change on first login
   - 2FA/MFA support

3. **Advanced RBAC**
   - Fine-grained permissions (not just role levels)
   - Permission caching with Redis
   - Dynamic permission assignment
   - Resource-level permissions

4. **Security Headers**
   - Helmet.js for security headers
   - CSRF protection
   - Content Security Policy
   - Rate limiting per user/IP

5. **API Security**
   - API key authentication for service accounts
   - Request signing
   - IP whitelisting for sensitive operations

### Functional Enhancements

1. **Task Management**
   - Subtasks and task dependencies
   - Task comments and attachments
   - Task templates
   - Recurring tasks
   - Task notifications (email/push)
   - Activity timeline

2. **User Management**
   - User invitations via email
   - User profile pictures
   - User activity dashboard
   - Bulk user operations
   - User groups/teams

3. **Organization Features**
   - More than 2-level hierarchy
   - Organization settings
   - Custom fields per organization
   - Inter-organization collaboration

4. **Reporting & Analytics**
   - Task completion charts
   - User productivity metrics
   - Organization insights
   - Export to PDF/CSV
   - Custom dashboards

5. **UI/UX Improvements**
   - Dark mode
   - Keyboard shortcuts
   - Drag-and-drop improvements
   - Real-time updates (WebSocket)
   - Offline support (PWA)
   - Mobile-optimized views

### Technical Improvements

1. **Database**
   - Migrate to PostgreSQL for production
   - Proper migrations instead of synchronize
   - Database indexing optimization
   - Query performance monitoring

2. **Testing**
   - E2E tests with Playwright/Cypress
   - Integration tests
   - API contract testing
   - Load testing
   - Security testing (OWASP)

3. **DevOps**
   - Docker containerization
   - CI/CD pipeline
   - Environment management (dev/staging/prod)
   - Automated deployments
   - Health checks and monitoring

4. **Performance**
   - Redis caching layer
   - Query optimization
   - Pagination for large datasets
   - Lazy loading
   - Bundle size optimization

5. **Code Quality**
   - SonarQube integration
   - Automated code reviews
   - Dependency security scanning
   - Documentation generation (Compodoc)

### Scalability Considerations

1. **Horizontal Scaling**
   - Stateless API design
   - Load balancer ready
   - Session management with Redis
   - Distributed task queue

2. **Microservices**
   - Split into separate services (auth, tasks, notifications)
   - Event-driven architecture
   - Message queue (RabbitMQ/Kafka)
   - API Gateway

3. **Database Scaling**
   - Read replicas
   - Connection pooling
   - Database sharding
   - CQRS pattern

## 📝 Notes

### Time Allocation (8 hours)

- Setup & Architecture: 1 hour
- Backend Implementation: 3 hours
- Frontend Implementation: 2.5 hours
- Testing & Documentation: 1.5 hours

### Key Decisions

1. **SQLite vs PostgreSQL**: Chose SQLite for easy setup, but architecture supports PostgreSQL swap
2. **Standalone Components**: Used Angular's modern standalone API for better performance
3. **Service-Layer RBAC**: Chose service-layer checks over guard-only approach for security depth
4. **Monorepo**: NX provides excellent dev experience and code sharing
5. **JWT over Sessions**: Stateless auth better for scalability

### Known Limitations

1. No refresh token implementation (would add in production)
2. No email verification (would add for production)
3. No file upload support yet
4. Limited error messages (intentionally generic for security)
5. No real-time updates (would add WebSocket)

## 📞 Support

For questions or issues, please check:
- [NestJS Documentation](https://docs.nestjs.com/)
- [Angular Documentation](https://angular.io/docs)
- [TypeORM Documentation](https://typeorm.io/)
- [NX Documentation](https://nx.dev/)

---