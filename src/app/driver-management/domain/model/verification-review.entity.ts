import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class VerificationReview implements BaseEntity {
  id: number = 0;
  driverId: number = 0;
  reviewerId: number = 0;
  status: VerificationStatus = 'PENDING';
  comments: string = '';
  reviewedAt: string = '';

  getId(): number                                { return this.id; }
  setId(v: number): void                        { this.id = v; }
  getDriverId(): number                         { return this.driverId; }
  setDriverId(v: number): void                  { this.driverId = v; }
  getReviewerId(): number                       { return this.reviewerId; }
  setReviewerId(v: number): void                { this.reviewerId = v; }
  getStatus(): VerificationStatus               { return this.status; }
  setStatus(v: VerificationStatus): void        { this.status = v; }
  getComments(): string                         { return this.comments; }
  setComments(v: string): void                  { this.comments = v; }
  getReviewedAt(): string                       { return this.reviewedAt; }
  setReviewedAt(v: string): void                { this.reviewedAt = v; }

  approve(comments: string): void {
    this.status = 'APPROVED';
    this.comments = comments;
    this.reviewedAt = new Date().toISOString();
  }
  reject(comments: string): void {
    this.status = 'REJECTED';
    this.comments = comments;
    this.reviewedAt = new Date().toISOString();
  }
}
