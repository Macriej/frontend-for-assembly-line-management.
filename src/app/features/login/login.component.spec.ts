import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LoginComponent } from './login.component';
import { AuthService } from '../../core/auth/auth.service';

describe('LoginComponent', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  function setup(returnUrl: string | null = null) {
    TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(returnUrl ? { returnUrl } : {}) },
          },
        },
      ],
    });
    return TestBed.createComponent(LoginComponent);
  }

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login']);
    routerSpy = jasmine.createSpyObj('Router', ['navigateByUrl']);
  });

  it('marks the form invalid when fields are empty', () => {
    const fixture = setup();
    const component = fixture.componentInstance;

    expect(component.form.invalid).toBeTrue();
  });

  it('does not call AuthService.login when the form is invalid', () => {
    const fixture = setup();
    fixture.componentInstance.onSubmit();

    expect(authServiceSpy.login).not.toHaveBeenCalled();
  });

  it('logs in and navigates to /products by default on success', () => {
    authServiceSpy.login.and.returnValue(
      of({ token: 't', user: { id: 1, email: 'admin@example.com' } })
    );
    const fixture = setup();
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'admin@example.com', password: 'admin123' });
    component.onSubmit();

    expect(authServiceSpy.login).toHaveBeenCalledWith('admin@example.com', 'admin123');
    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/products');
  });

  it('navigates to returnUrl when present in the query params', () => {
    authServiceSpy.login.and.returnValue(
      of({ token: 't', user: { id: 1, email: 'admin@example.com' } })
    );
    const fixture = setup('/workstations');
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'admin@example.com', password: 'admin123' });
    component.onSubmit();

    expect(routerSpy.navigateByUrl).toHaveBeenCalledWith('/workstations');
  });

  it('shows an error message and stops loading when login fails', () => {
    authServiceSpy.login.and.returnValue(throwError(() => new Error('invalid')));
    const fixture = setup();
    const component = fixture.componentInstance;

    component.form.setValue({ email: 'admin@example.com', password: 'wrong' });
    component.onSubmit();

    expect(component.loading()).toBeFalse();
    expect(component.errorMessage()).toBe('Invalid email or password.');
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });
});
