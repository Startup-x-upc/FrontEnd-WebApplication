import { computed, inject, Injectable, signal } from '@angular/core';
import { Driver } from '../domain/model/driver.entity';
import { DriverDocument } from '../domain/model/driver-document.entity';
import { VerificationReview } from '../domain/model/verification-review.entity';
import { DriverManagementApiService } from '../infrastructure/driver-management-api.service';

/**
 * @summary Application service for the Driver Management bounded context.
 * Coordinates driver profiles, documents and verification reviews.
 * @author Sebastian Andres Aiquipa Poma
 */
@Injectable({ providedIn: 'root' })
export class DriverManagementStore {
  private api = inject(DriverManagementApiService);

  private driverSignal = signal<Driver | null>(null);
  private documentsSignal = signal<DriverDocument[]>([]);
  private pendingVerificationsSignal = signal<VerificationReview[]>([]);
  private loadingSignal = signal<boolean>(false);
  private errorSignal = signal<string | null>(null);

  readonly driver = computed(() => this.driverSignal());
  readonly documents = computed(() => this.documentsSignal());
  readonly pendingVerifications = computed(() => this.pendingVerificationsSignal());
  readonly pendingVerificationCount = computed(() => this.pendingVerificationsSignal().length);
  readonly isLoading = computed(() => this.loadingSignal());
  readonly error = computed(() => this.errorSignal());

  loadDriverByAccountId(accountId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getDriverByAccountId(accountId).subscribe({
      next: (d) => {
        this.driverSignal.set(d);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo cargar el conductor.');
      },
    });
  }

  loadDriverDocuments(driverId: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getDriverDocuments(driverId).subscribe({
      next: (docs) => {
        this.documentsSignal.set(docs);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudieron cargar los documentos.');
      },
    });
  }

  loadPendingVerifications(): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.getPendingVerifications().subscribe({
      next: (reviews) => {
        this.pendingVerificationsSignal.set(reviews);
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudieron cargar las verificaciones pendientes.');
      },
    });
  }

  approveDriver(driverId: string, reviewerId: string, comments: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.approveDriver(driverId, reviewerId, comments).subscribe({
      next: (review) => {
        this.pendingVerificationsSignal.update((list) =>
          list.filter((r) => r.driverId !== driverId),
        );
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo aprobar al conductor.');
      },
    });
  }

  rejectDriver(driverId: string, reviewerId: string, comments: string): void {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    this.api.rejectDriver(driverId, reviewerId, comments).subscribe({
      next: (review) => {
        this.pendingVerificationsSignal.update((list) =>
          list.filter((r) => r.driverId !== driverId),
        );
        this.loadingSignal.set(false);
      },
      error: () => {
        this.loadingSignal.set(false);
        this.errorSignal.set('No se pudo rechazar al conductor.');
      },
    });
  }

  clearError(): void {
    this.errorSignal.set(null);
  }
}
