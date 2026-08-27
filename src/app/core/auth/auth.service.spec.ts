import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts unauthenticated when localStorage is empty', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('stores the token and user on successful login', () => {
    const mockResponse = { token: 'jwt-token', user: { id: 1, email: 'admin@example.com' } };

    service.login('admin@example.com', 'admin123').subscribe((res) => {
      expect(res).toEqual(mockResponse);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@example.com', password: 'admin123' });
    req.flush(mockResponse);

    expect(service.isAuthenticated()).toBeTrue();
    expect(service.token).toBe('jwt-token');
    expect(service.currentUser()).toEqual(mockResponse.user);
  });

  it('clears everything on logout', () => {
    localStorage.setItem('assembly_line_token', 'some-token');
    localStorage.setItem('assembly_line_user', JSON.stringify({ id: 1, email: 'a@b.com' }));
    service = TestBed.inject(AuthService);

    service.logout();

    expect(service.token).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.currentUser()).toBeNull();
  });

  it('rehydrates currentUser from localStorage on construction', () => {
    localStorage.setItem('assembly_line_user', JSON.stringify({ id: 5, email: 'stored@example.com' }));

    const freshService = TestBed.runInInjectionContext(() => new AuthService());

    expect(freshService.currentUser()).toEqual({ id: 5, email: 'stored@example.com' });
  });
});
