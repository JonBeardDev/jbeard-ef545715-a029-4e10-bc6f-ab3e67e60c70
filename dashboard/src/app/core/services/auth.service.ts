import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { IAuthResponse, IUser, LoginDto, RegisterDto } from '@workspace/data';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    // Load token and user from localStorage on init
    this.loadStoredAuth();
  }

  private loadStoredAuth(): void {
    const token = localStorage.getItem('access_token');
    const userStr = localStorage.getItem('current_user');

    if (token && userStr) {
      this.tokenSubject.next(token);
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: LoginDto): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${environment.apiUrl}/auth/login`, credentials).pipe(
      tap(response => {
        this.setAuth(response);
      })
    );
  }

  register(data: RegisterDto): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`${environment.apiUrl}/auth/register`, data).pipe(
      tap(response => {
        this.setAuth(response);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('current_user');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getMe(): Observable<IUser> {
    return this.http.get<IUser>(`${environment.apiUrl}/auth/me`).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        localStorage.setItem('current_user', JSON.stringify(user));
      })
    );
  }

  private setAuth(response: IAuthResponse): void {
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('current_user', JSON.stringify(response.user));
    this.tokenSubject.next(response.access_token);
    this.currentUserSubject.next(response.user);
  }

  getToken(): string | null {
    return this.tokenSubject.value || localStorage.getItem('access_token');
  }

  getCurrentUser(): IUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  hasMinRoleLevel(level: number): boolean {
    const user = this.getCurrentUser();
    return user?.role ? user.role.level >= level : false;
  }

  isOwner(): boolean {
    return this.hasMinRoleLevel(3);
  }

  isAdmin(): boolean {
    return this.hasMinRoleLevel(2);
  }

  isViewer(): boolean {
    const user = this.getCurrentUser();
    return user?.role?.level === 1;
  }
}