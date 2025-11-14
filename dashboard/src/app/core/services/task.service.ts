import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ITask, CreateTaskDto, UpdateTaskDto, TaskFilterDto } from '@workspace/data';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private tasksSubject = new BehaviorSubject<ITask[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  getTasks(filters?: TaskFilterDto): Observable<ITask[]> {
    this.loadingSubject.next(true);
    
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        const value = (filters as any)[key];
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, value.toString());
        }
      });
    }

    return this.http.get<ITask[]>(`${environment.apiUrl}/tasks`, { params }).pipe(
      tap(tasks => {
        this.tasksSubject.next(tasks);
        this.loadingSubject.next(false);
      })
    );
  }

  getTask(id: string): Observable<ITask> {
    return this.http.get<ITask>(`${environment.apiUrl}/tasks/${id}`);
  }

  createTask(task: CreateTaskDto): Observable<ITask> {
    return this.http.post<ITask>(`${environment.apiUrl}/tasks`, task).pipe(
      tap(newTask => {
        const current = this.tasksSubject.value;
        this.tasksSubject.next([newTask, ...current]);
      })
    );
  }

  updateTask(id: string, task: UpdateTaskDto): Observable<ITask> {
    return this.http.put<ITask>(`${environment.apiUrl}/tasks/${id}`, task).pipe(
      tap(updatedTask => {
        const current = this.tasksSubject.value;
        const index = current.findIndex(t => t.id === id);
        if (index !== -1) {
          current[index] = updatedTask;
          this.tasksSubject.next([...current]);
        }
      })
    );
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/tasks/${id}`).pipe(
      tap(() => {
        const current = this.tasksSubject.value;
        this.tasksSubject.next(current.filter(t => t.id !== id));
      })
    );
  }

  // Helper method to update task sort order
  updateTaskSortOrder(taskId: string, newSortOrder: number): Observable<ITask> {
    return this.updateTask(taskId, { sortOrder: newSortOrder });
  }
}