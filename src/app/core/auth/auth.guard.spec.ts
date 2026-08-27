import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: authServiceSpy }],
    });
    router = TestBed.inject(Router);
  });

  function runGuard(url: string) {
    return TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url } as never)
    );
  }

  it('allows navigation when authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);

    const result = runGuard('/products');

    expect(result).toBeTrue();
  });

  it('redirects to /login with returnUrl when not authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);

    const result = runGuard('/workstations') as UrlTree;

    expect(result instanceof UrlTree).toBeTrue();
    const serialized = router.serializeUrl(result);
    expect(serialized).toContain('/login');
    expect(result.queryParams['returnUrl']).toBe('/workstations');
  });
});
