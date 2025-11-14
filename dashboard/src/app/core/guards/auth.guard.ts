import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (this.authService.isAuthenticated()) {
      // Check for role-based access if specified in route data
      const requiredLevel = route.data['minRoleLevel'];
      if (requiredLevel) {
        const user = this.authService.getCurrentUser();
        if (user && user.role && user.role.level >= requiredLevel) {
          return true;
        } else {
          this.router.navigate(['/dashboard']);
          return false;
        }
      }
      return true;
    }

    // Not logged in, redirect to login with return url
    this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }
}