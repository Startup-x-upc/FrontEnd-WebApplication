import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PassengerDashboard } from './passenger-dashboard';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('PassengerDashboard', () => {
  let component: PassengerDashboard;
  let fixture: ComponentFixture<PassengerDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PassengerDashboard, NoopAnimationsModule],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(PassengerDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
