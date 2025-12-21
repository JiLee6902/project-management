import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomField, TaskCustomFieldValue, CustomFieldType } from '@app/entity/entities';

@Injectable()
export class CustomFieldService {
  constructor(
    @InjectRepository(CustomField)
    private readonly customFieldRepo: Repository<CustomField>,
    @InjectRepository(TaskCustomFieldValue)
    private readonly fieldValueRepo: Repository<TaskCustomFieldValue>,
  ) {}

  async getProjectFields(projectId: string) {
    const fields = await this.customFieldRepo.find({
      where: { projectId },
      order: { order: 'ASC' },
    });
    return { fields };
  }

  async createField(userId: string, data: {
    projectId: string;
    name: string;
    type: CustomFieldType;
    options?: string[];
    required?: boolean;
  }) {
    const maxOrder = await this.customFieldRepo
      .createQueryBuilder('cf')
      .select('MAX(cf.order)', 'max')
      .where('cf.projectId = :projectId', { projectId: data.projectId })
      .getRawOne();

    const field = this.customFieldRepo.create({
      ...data,
      order: (maxOrder?.max || 0) + 1,
      createdBy: userId,
    });

    await this.customFieldRepo.save(field);
    return { field, message: 'Custom field created successfully' };
  }

  async updateField(id: string, data: Partial<{
    name: string;
    options: string[];
    required: boolean;
    order: number;
  }>) {
    const field = await this.customFieldRepo.findOne({ where: { id } });
    if (!field) {
      throw new NotFoundException('Custom field not found');
    }

    Object.assign(field, data);
    await this.customFieldRepo.save(field);
    return { field, message: 'Custom field updated successfully' };
  }

  async deleteField(id: string) {
    const field = await this.customFieldRepo.findOne({ where: { id } });
    if (!field) {
      throw new NotFoundException('Custom field not found');
    }

    await this.fieldValueRepo.delete({ customFieldId: id });
    await this.customFieldRepo.delete(id);
    return { message: 'Custom field deleted successfully' };
  }

  async getTaskFieldValues(taskId: string) {
    const values = await this.fieldValueRepo.find({
      where: { taskId },
      relations: ['customField'],
    });
    return { values };
  }

  async setTaskFieldValue(taskId: string, customFieldId: string, value: string) {
    let fieldValue = await this.fieldValueRepo.findOne({
      where: { taskId, customFieldId },
    });

    if (fieldValue) {
      fieldValue.value = value;
    } else {
      fieldValue = this.fieldValueRepo.create({
        taskId,
        customFieldId,
        value,
      });
    }

    await this.fieldValueRepo.save(fieldValue);

    const saved = await this.fieldValueRepo.findOne({
      where: { id: fieldValue.id },
      relations: ['customField'],
    });

    return { value: saved, message: 'Field value saved successfully' };
  }

  async deleteTaskFieldValue(taskId: string, customFieldId: string) {
    await this.fieldValueRepo.delete({ taskId, customFieldId });
    return { message: 'Field value deleted successfully' };
  }
}
