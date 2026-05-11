import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

import { Driver } from '../domain/model/driver.entity';
import { DriverDocument } from '../domain/model/driver-document.entity';
import { VerificationReview } from '../domain/model/verification-review.entity';

import { DriverResponse } from './driver-response';
import { DriverAssembler } from './driver-assembler';

@Injectable({ providedIn: 'root' })
export class DriverManagementApiService {
  private readonly basePath = `${environment.apiBaseUrl}`;

  constructor(private readonly http: HttpClient) {}

  getDriverByAccountId(accountId: string): Observable<Driver> {
    return this.http.get<DriverResponse[]>(`${this.basePath}/drivers?accountId=${accountId}`)
      .pipe(map(responses => {
        if (responses.length > 0) return DriverAssembler.toEntity(responses[0]);
        // Fallback demo driver
        const fallback = new Driver();
        fallback.accountId = accountId;
        fallback.isAvailable = false;
        return fallback;
      }));
  }

  getDriverDocuments(driverId: string): Observable<DriverDocument[]> {
    return of([]); // Minimal implementation for sprint 2
  }

  getPendingVerifications(): Observable<VerificationReview[]> {
    return of([]); // Minimal implementation for sprint 2
  }

  approveDriver(
    driverId: string,
    reviewerId: string,
    comments: string,
  ): Observable<VerificationReview> {
    const review = new VerificationReview();
    review.id = Date.now().toString();
    review.driverId = driverId;
    review.reviewerId = reviewerId;
    review.approve(comments);
    return of(review);
  }

  rejectDriver(
    driverId: string,
    reviewerId: string,
    comments: string,
  ): Observable<VerificationReview> {
    const review = new VerificationReview();
    review.id = Date.now().toString();
    review.driverId = driverId;
    review.reviewerId = reviewerId;
    review.reject(comments);
    return of(review);
  }
}
