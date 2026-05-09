import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { Driver } from '../domain/model/driver.entity';
import { DriverDocument } from '../domain/model/driver-document.entity';
import { VerificationReview } from '../domain/model/verification-review.entity';

/**
 * @summary TEMPORARY STUB. Returns hardcoded data while the real infrastructure
 * (responses, assemblers, HTTP gateway) is being built by the infrastructure team.
 * Replace this file when the real DriverManagementApiService lands.
 * @author Sebastian Andres Aiquipa Poma
 */
@Injectable({ providedIn: 'root' })
export class DriverManagementApiService {
  getDriverByAccountId(accountId: number): Observable<Driver> {
    const d = new Driver();
    d.id = 1;
    d.accountId = accountId;
    d.licenseNumber = 'Q12345678';
    d.soatNumber = 'S87654321';
    d.isAvailable = false;
    d.accessStatus = 'ACTIVE';
    return of(d).pipe(delay(200));
  }

  getDriverDocuments(driverId: number): Observable<DriverDocument[]> {
    const docs: DriverDocument[] = [];
    const license = new DriverDocument();
    license.id = 1;
    license.driverId = driverId;
    license.documentType = 'LICENSE';
    license.documentNumber = 'Q12345678';
    license.status = 'APPROVED';
    docs.push(license);
    return of(docs).pipe(delay(200));
  }

  getPendingVerifications(): Observable<VerificationReview[]> {
    return of([]).pipe(delay(200));
  }

  approveDriver(
    driverId: number,
    reviewerId: number,
    comments: string,
  ): Observable<VerificationReview> {
    const review = new VerificationReview();
    review.id = Date.now();
    review.driverId = driverId;
    review.reviewerId = reviewerId;
    review.approve(comments);
    return of(review).pipe(delay(200));
  }

  rejectDriver(
    driverId: number,
    reviewerId: number,
    comments: string,
  ): Observable<VerificationReview> {
    const review = new VerificationReview();
    review.id = Date.now();
    review.driverId = driverId;
    review.reviewerId = reviewerId;
    review.reject(comments);
    return of(review).pipe(delay(200));
  }
}
