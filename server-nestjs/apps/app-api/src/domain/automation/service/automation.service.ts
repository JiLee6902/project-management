import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AutomationRule, AutomationTrigger, AutomationAction, Task } from '@app/entity/entities';

@Injectable()
export class AutomationService {
  constructor(
    @InjectRepository(AutomationRule)
    private readonly ruleRepo: Repository<AutomationRule>,
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
  ) {}

  async getProjectRules(projectId: string) {
    const rules = await this.ruleRepo.find({
      where: { projectId },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
    return { rules };
  }

  async createRule(userId: string, data: {
    name: string;
    description?: string;
    projectId: string;
    trigger: AutomationTrigger;
    triggerConditions?: any;
    action: AutomationAction;
    actionParams: any;
  }) {
    const rule = this.ruleRepo.create({
      ...data,
      createdBy: userId,
      isActive: true,
    });

    await this.ruleRepo.save(rule);
    return { rule, message: 'Automation rule created successfully' };
  }

  async updateRule(id: string, data: Partial<{
    name: string;
    description: string;
    triggerConditions: any;
    actionParams: any;
    isActive: boolean;
  }>) {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Automation rule not found');
    }

    Object.assign(rule, data);
    await this.ruleRepo.save(rule);
    return { rule, message: 'Automation rule updated successfully' };
  }

  async toggleRule(id: string) {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Automation rule not found');
    }

    rule.isActive = !rule.isActive;
    await this.ruleRepo.save(rule);
    return { rule, message: `Automation rule ${rule.isActive ? 'enabled' : 'disabled'}` };
  }

  async deleteRule(id: string) {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) {
      throw new NotFoundException('Automation rule not found');
    }

    await this.ruleRepo.delete(id);
    return { message: 'Automation rule deleted successfully' };
  }

  // Execute automation rules based on trigger
  async executeRules(projectId: string, trigger: AutomationTrigger, task: Task, context?: any) {
    const rules = await this.ruleRepo.find({
      where: { projectId, trigger, isActive: true },
    });

    const executedActions: any[] = [];

    for (const rule of rules) {
      if (this.matchesConditions(task, rule.triggerConditions, context)) {
        const result = await this.executeAction(task, rule.action, rule.actionParams);
        executedActions.push({ rule: rule.name, result });
      }
    }

    return executedActions;
  }

  private matchesConditions(task: Task, conditions: any, context?: any): boolean {
    if (!conditions) return true;

    if (conditions.status && task.status !== conditions.status) return false;
    if (conditions.priority && task.priority !== conditions.priority) return false;
    if (conditions.type && task.type !== conditions.type) return false;
    if (conditions.assigneeId && task.assigneeId !== conditions.assigneeId) return false;

    return true;
  }

  private async executeAction(task: Task, action: AutomationAction, params: any) {
    switch (action) {
      case AutomationAction.CHANGE_STATUS:
        if (params.status) {
          await this.taskRepo.update(task.id, { status: params.status });
          return { action: 'status_changed', newStatus: params.status };
        }
        break;

      case AutomationAction.CHANGE_PRIORITY:
        if (params.priority) {
          await this.taskRepo.update(task.id, { priority: params.priority });
          return { action: 'priority_changed', newPriority: params.priority };
        }
        break;

      case AutomationAction.ASSIGN_USER:
        if (params.userId) {
          await this.taskRepo.update(task.id, { assigneeId: params.userId });
          return { action: 'user_assigned', userId: params.userId };
        }
        break;

      case AutomationAction.MOVE_TO_SPRINT:
        if (params.sprintId) {
          await this.taskRepo.update(task.id, { sprintId: params.sprintId });
          return { action: 'moved_to_sprint', sprintId: params.sprintId };
        }
        break;

      default:
        return { action: 'unknown', executed: false };
    }

    return { action, executed: true };
  }
}
