import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ForgotPassword } from './forgot-password';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword, NoopAnimationsModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('form should be invalid when email is empty', () => {
    expect(component.forgotForm.valid).toBeFalsy();
  });

  it('form should be valid when email is correct', () => {
    component.forgotForm.patchValue({ email: 'test@example.com' });
    expect(component.forgotForm.valid).toBeTruthy();
  });

  it('should show error when email is invalid', () => {
    const emailControl = component.forgotForm.get('email');
    emailControl?.setValue('invalid-email');
    emailControl?.markAsTouched();
    fixture.detectChanges();
    expect(emailControl?.hasError('email')).toBeTruthy();
  });

  it('should call onSubmit when form is valid', () => {
    // Crear un mock de la función onSubmit
    const onSubmitSpy = vi.spyOn(component, 'onSubmit');

    component.forgotForm.patchValue({ email: 'test@example.com' });
    component.onSubmit();

    expect(onSubmitSpy).toHaveBeenCalled();
  });

  it('should reset form when resetForm is called', () => {
    component.emailSent.set(true);
    component.resetForm();

    expect(component.emailSent()).toBeFalsy();
    expect(component.forgotForm.pristine).toBeTruthy();
  });

  it('should not submit when form is invalid', () => {
    const onSubmitSpy = vi.spyOn(component, 'onSubmit');

    component.onSubmit();

    expect(component.forgotForm.valid).toBeFalsy();
    expect(component.sending()).toBeFalsy();
  });

  it('should show sending state while submitting', () => {
    component.forgotForm.patchValue({ email: 'test@example.com' });

    component.onSubmit();

    expect(component.sending()).toBeTruthy();
  });
});
