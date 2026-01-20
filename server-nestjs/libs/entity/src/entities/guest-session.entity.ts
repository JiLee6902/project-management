import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('guest_sessions')
export class GuestSession extends BaseEntity {
  @Column({ name: 'ip_address' })
  @Index()
  ipAddress: string;

  @Column({ name: 'device_fingerprint', nullable: true })
  @Index()
  deviceFingerprint: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'login_count', default: 1 })
  loginCount: number;
}
