import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RoleSelector } from './role-selector';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RoleSelector', () => {
  let component: RoleSelector;
  let fixture: ComponentFixture<RoleSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RoleSelector, NoopAnimationsModule],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(RoleSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
