import { BaseEntity } from '../../../shared/domain/model/base-entity';

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export class VerificationReview implements BaseEntity {
  id: string = '';
  driverId: string = '';
  reviewerId: number = 0;
  status: VerificationStatus = 'PENDING';
  comments: string = '';
  reviewedAt: string = '';


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
