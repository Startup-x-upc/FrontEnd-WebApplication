import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DriverDashboard } from './driver-dashboard';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DriverDashboard', () => {
  let component: DriverDashboard;
  let fixture: ComponentFixture<DriverDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DriverDashboard, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        provideHttpClient()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DriverDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
