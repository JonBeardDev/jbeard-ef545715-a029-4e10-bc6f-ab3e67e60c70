import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';
import { ITask, IUser, TaskStatus, TaskCategory, TaskPriority, CreateTaskDto } from '@workspace/data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  tasks: ITask[] = [];
  filteredTasks: ITask[] = [];
  users: IUser[] = [];
  currentUser: IUser | null = null;
  loading = false;

  // Filter state
  filterStatus: TaskStatus | '' = '';
  filterCategory: TaskCategory | '' = '';
  filterPriority: TaskPriority | '' = '';
  searchQuery = '';

  // Modal state
  showTaskModal = false;
  showUserModal = false;
  editingTask: ITask | null = null;

  // New task form
  newTask: CreateTaskDto = {
    title: '',
    description: '',
    status: TaskStatus.TODO,
    category: TaskCategory.WORK,
    priority: TaskPriority.MEDIUM,
  };

  // Enums for templates
  TaskStatus = TaskStatus;
  TaskCategory = TaskCategory;
  TaskPriority = TaskPriority;

  // View modes
  groupBy: 'status' | 'category' | 'none' = 'status';

  constructor(
    public taskService: TaskService,
    public authService: AuthService,
    public userService: UserService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadTasks();
    this.loadUsers();
  }

  loadTasks(): void {
    this.loading = true;
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.tasks = tasks;
        this.applyFilters();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.tasks];

    if (this.filterStatus) {
      filtered = filtered.filter(t => t.status === this.filterStatus);
    }
    if (this.filterCategory) {
      filtered = filtered.filter(t => t.category === this.filterCategory);
    }
    if (this.filterPriority) {
      filtered = filtered.filter(t => t.priority === this.filterPriority);
    }
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query)
      );
    }

    this.filteredTasks = filtered;
  }

  getTasksByStatus(status: TaskStatus): ITask[] {
    return this.filteredTasks.filter(t => t.status === status);
  }

  getTasksByCategory(category: TaskCategory): ITask[] {
    return this.filteredTasks.filter(t => t.category === category);
  }

  onDrop(event: CdkDragDrop<ITask[]>, newStatus?: TaskStatus): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      if (newStatus && task.status !== newStatus) {
        this.updateTaskStatus(task, newStatus);
      }
    }
  }

  updateTaskStatus(task: ITask, newStatus: TaskStatus): void {
    this.taskService.updateTask(task.id, { status: newStatus }).subscribe({
      next: () => {
        this.loadTasks();
      }
    });
  }

  openTaskModal(task?: ITask): void {
    if (task) {
      this.editingTask = task;
      this.newTask = {
        title: task.title,
        description: task.description,
        status: task.status,
        category: task.category,
        priority: task.priority,
        assignedToId: task.assignedToId,
        dueDate: task.dueDate,
      };
    } else {
      this.editingTask = null;
      this.newTask = {
        title: '',
        description: '',
        status: TaskStatus.TODO,
        category: TaskCategory.WORK,
        priority: TaskPriority.MEDIUM,
      };
    }
    this.showTaskModal = true;
  }

  closeTaskModal(): void {
    this.showTaskModal = false;
    this.editingTask = null;
  }

  saveTask(): void {
    if (this.editingTask) {
      this.taskService.updateTask(this.editingTask.id, this.newTask).subscribe({
        next: () => {
          this.closeTaskModal();
          this.loadTasks();
        }
      });
    } else {
      this.taskService.createTask(this.newTask).subscribe({
        next: () => {
          this.closeTaskModal();
          this.loadTasks();
        }
      });
    }
  }

  deleteTask(task: ITask): void {
    if (confirm(`Are you sure you want to delete "${task.title}"?`)) {
      this.taskService.deleteTask(task.id).subscribe({
        next: () => {
          this.loadTasks();
        }
      });
    }
  }

  canEditTask(task: ITask): boolean {
    if (
        !this.currentUser || 
        !this.currentUser.role || 
        !this.currentUser.role.level
    ) return false;
    // Owners and Admins can edit all tasks
    if (this.currentUser.role.level >= 2) return true;
    // Viewers can only edit their own tasks
    return task.createdById === this.currentUser.id;
  }

  canDeleteTask(task: ITask): boolean {
    if (
        !this.currentUser ||
        !this.currentUser.role ||
        !this.currentUser.role.level
    ) return false;
    // Owners and Admins can delete all tasks
    if (this.currentUser.role.level >= 2) return true;
    // Viewers can only delete their own tasks
    return task.createdById === this.currentUser.id;
  }

  getPriorityColor(priority: TaskPriority): string {
    switch (priority) {
      case TaskPriority.HIGH: return 'bg-red-100 text-red-800';
      case TaskPriority.MEDIUM: return 'bg-yellow-100 text-yellow-800';
      case TaskPriority.LOW: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusColor(status: TaskStatus): string {
    switch (status) {
      case TaskStatus.TODO: return 'bg-gray-100 text-gray-800';
      case TaskStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case TaskStatus.DONE: return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  openUserModal(): void {
    this.showUserModal = true;
    this.router.navigate(['/users']);
  }

  logout(): void {
    this.authService.logout();
  }
}