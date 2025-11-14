import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../core/services/user.service';
import { AuthService } from '../core/services/auth.service';
import { IUser, IRole, IOrganization, CreateUserDto, RoleType } from '@workspace/data';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div class="flex items-center justify-between">
            <h1 class="text-2xl font-bold text-gray-900">User Management</h1>
            <div class="flex gap-4">
              <button 
                (click)="openUserModal()"
                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                + Add User
              </button>
              <button 
                (click)="goBack()"
                class="text-gray-600 hover:text-gray-900 px-4 py-2">
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="bg-white rounded-lg shadow-sm overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Organization</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let user of users" class="hover:bg-gray-50">
                <td class="px-6 py-4 text-sm font-medium text-gray-900">
                  {{ user.firstName }} {{ user.lastName }}
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ user.email }}</td>
                <td class="px-6 py-4">
                  <span class="px-2 py-1 text-xs rounded-full"
                        [ngClass]="user.role.level === 3 ? 'bg-purple-100 text-purple-800' : 
                                   user.role.level === 2 ? 'bg-blue-100 text-blue-800' : 
                                   'bg-gray-100 text-gray-800'">
                    {{ user.role.name }}
                  </span>
                </td>
                <td class="px-6 py-4 text-sm text-gray-900">{{ user.organization.name }}</td>
                <td class="px-6 py-4 text-sm">
                  <button 
                    (click)="deleteUser(user)"
                    [disabled]="user.id === currentUser?.id"
                    class="text-red-600 hover:text-red-800 disabled:text-gray-400 disabled:cursor-not-allowed">
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Add User Modal -->
      <div *ngIf="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div class="bg-white rounded-lg max-w-md w-full p-6">
          <h2 class="text-2xl font-bold mb-4">Add New User</h2>
          <form (ngSubmit)="saveUser()">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  [(ngModel)]="newUser.email"
                  name="email"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  [(ngModel)]="newUser.password"
                  name="password"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                  <input
                    type="text"
                    [(ngModel)]="newUser.firstName"
                    name="firstName"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                  <input
                    type="text"
                    [(ngModel)]="newUser.lastName"
                    name="lastName"
                    required
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select 
                  [(ngModel)]="newUser.roleId"
                  name="roleId"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a role</option>
                  <option *ngFor="let role of roles" [value]="role.id">
                    {{ role.name }}
                  </option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Organization *</label>
                <select 
                  [(ngModel)]="newUser.organizationId"
                  name="organizationId"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Select an organization</option>
                  <option *ngFor="let org of organizations" [value]="org.id">
                    {{ org.name }}
                  </option>
                </select>
              </div>
              <div *ngIf="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {{ error }}
              </div>
            </div>
            <div class="flex justify-end gap-3 mt-6">
              <button
                type="button"
                (click)="closeModal()"
                class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="!isFormValid()"
                class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                Add User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `
})
export class UsersComponent implements OnInit {
  users: IUser[] = [];
  roles: IRole[] = [];
  organizations: IOrganization[] = [];
  currentUser: IUser | null = null;
  showModal = false;
  error = '';

  newUser: CreateUserDto = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleId: '',
    organizationId: ''
  };

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadUsers();
    this.loadRoles();
    this.loadOrganizations();
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      }
    });
  }

  loadRoles(): void {
    this.http.get<IRole[]>(`${environment.apiUrl}/roles`).subscribe({
      next: (roles) => {
        // Filter roles based on current user's role level
        if (this.currentUser?.role) {
          this.roles = roles.filter(r => r.level < this.currentUser!.role.level);
        } else {
          this.roles = roles;
        }
      }
    });
  }

  loadOrganizations(): void {
    this.http.get<IOrganization[]>(`${environment.apiUrl}/organizations`).subscribe({
      next: (orgs) => {
        this.organizations = orgs;
      }
    });
  }

  openUserModal(): void {
    this.newUser = {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleId: '',
      organizationId: this.currentUser?.organizationId || ''
    };
    this.error = '';
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  isFormValid(): boolean {
    return !!(
      this.newUser.email &&
      this.newUser.password &&
      this.newUser.firstName &&
      this.newUser.lastName &&
      this.newUser.roleId &&
      this.newUser.organizationId
    );
  }

  saveUser(): void {
    if (!this.isFormValid()) return;

    this.userService.createUser(this.newUser).subscribe({
      next: () => {
        this.closeModal();
        this.loadUsers();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to create user';
      }
    });
  }

  deleteUser(user: IUser): void {
    if (user.id === this.currentUser?.id) {
      alert('You cannot delete yourself');
      return;
    }

    if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) {
      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete user');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }
}