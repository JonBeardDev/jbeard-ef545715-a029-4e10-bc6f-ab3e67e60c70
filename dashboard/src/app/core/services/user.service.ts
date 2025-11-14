import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { IUser, CreateUserDto, UpdateUserDto } from '@workspace/data';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private usersSubject = new BehaviorSubject<IUser[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {}

  getUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${environment.apiUrl}/users`).pipe(
      tap(users => this.usersSubject.next(users))
    );
  }

  getUser(id: string): Observable<IUser> {
    return this.http.get<IUser>(`${environment.apiUrl}/users/${id}`);
  }

  createUser(user: CreateUserDto): Observable<IUser> {
    return this.http.post<IUser>(`${environment.apiUrl}/users`, user).pipe(
      tap(newUser => {
        const current = this.usersSubject.value;
        this.usersSubject.next([...current, newUser]);
      })
    );
  }

  updateUser(id: string, user: UpdateUserDto): Observable<IUser> {
    return this.http.put<IUser>(`${environment.apiUrl}/users/${id}`, user).pipe(
      tap(updatedUser => {
        const current = this.usersSubject.value;
        const index = current.findIndex(u => u.id === id);
        if (index !== -1) {
          current[index] = updatedUser;
          this.usersSubject.next([...current]);
        }
      })
    );
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/users/${id}`).pipe(
      tap(() => {
        const current = this.usersSubject.value;
        this.usersSubject.next(current.filter(u => u.id !== id));
      })
    );
  }
}