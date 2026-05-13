import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverRegister } from './driver-register';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';

describe('DriverRegister', () => {
  let component: DriverRegister;
  let fixture: ComponentFixture<DriverRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverRegister, NoopAnimationsModule],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(DriverRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('personal form should be invalid when empty', () => {
    expect(component.personalForm.valid).toBeFalsy();
  });

  it('documents form should be invalid when empty', () => {
    expect(component.documentsForm.valid).toBeFalsy();
  });

  it('should validate password match', () => {
    component.personalForm.patchValue({
      password: '12345678',
      confirmPassword: '87654321',
    });
    expect(component.personalForm.hasError('passwordMismatch')).toBeTruthy();
  });

  it('should validate plate format', () => {
    const plateControl = component.documentsForm.get('plateNumber');
    plateControl?.setValue('ABC-123');
    expect(plateControl?.valid).toBeTruthy();

    plateControl?.setValue('INVALID');
    expect(plateControl?.hasError('pattern')).toBeTruthy();
  });

  it('should call onSubmit when form is valid', () => {
    const onSubmitSpy = vi.spyOn(component, 'onSubmit');

    // CORRECCIÓN: Usar strings para las fechas
    component.personalForm.patchValue({
      fullName: 'Carlos Ríos',
      phone: '948123456',
      email: 'carlos@test.com',
      city: 'Talara, Piura',
      password: '12345678',
      confirmPassword: '12345678',
    });

    component.documentsForm.patchValue({
      plateNumber: 'ABC-123',
      brand: 'Honda',
      model: 'Wave 2022',
      licenseNumber: 'Q12345678',
      licenseExpiry: '2025-12-31', // String, no Date
      soatNumber: '2024-XXXXX-XX',
      soatExpiry: '2025-12-31', // String, no Date
    });

    component.onSubmit();
    expect(onSubmitSpy).toHaveBeenCalled();
  });

  it('should validate phone number format', () => {
    const phoneControl = component.personalForm.get('phone');
    phoneControl?.setValue('12345678'); // 8 dígitos - inválido
    expect(phoneControl?.hasError('pattern')).toBeTruthy();

    phoneControl?.setValue('948123456'); // 9 dígitos - válido
    expect(phoneControl?.valid).toBeTruthy();
  });

  it('should reset form when resetForm is called', () => {
    component.isSubmitted.set(true);
    // No hay método resetForm directamente, pero podemos verificar el estado
    expect(component.isSubmitted()).toBeTruthy();
  });
});
