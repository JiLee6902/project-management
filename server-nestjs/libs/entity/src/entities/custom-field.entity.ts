import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from './project.entity';

export enum CustomFieldType {
  TEXT = 'text',
  NUMBER = 'number',
  DATE = 'date',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  CHECKBOX = 'checkbox',
  URL = 'url',
  EMAIL = 'email',
}

@Entity('custom_fields')
export class CustomField {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: CustomFieldType,
    default: CustomFieldType.TEXT,
  })
  type: CustomFieldType;

  @Column({ name: 'project_id' })
  @Index()
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @Column({ type: 'json', nullable: true })
  options?: string[]; // For select/multi_select types

  @Column({ type: 'boolean', default: false })
  required: boolean;

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({ name: 'created_by' })
  createdBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('task_custom_field_values')
export class TaskCustomFieldValue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'task_id' })
  @Index()
  taskId: string;

  @Column({ name: 'custom_field_id' })
  @Index()
  customFieldId: string;

  @ManyToOne(() => CustomField, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'custom_field_id' })
  customField: CustomField;

  @Column({ type: 'text', nullable: true })
  value: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
