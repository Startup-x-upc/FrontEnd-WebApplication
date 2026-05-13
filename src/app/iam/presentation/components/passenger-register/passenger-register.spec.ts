import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PassengerRegister } from './passenger-register';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PassengerRegister', () => {
  let component: PassengerRegister;
  let fixture: ComponentFixture<PassengerRegister>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerRegister, NoopAnimationsModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(PassengerRegister);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
