import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Sprint, SprintStatus, Task, Project, WorkspaceMember, WorkspaceRole, TaskStatus } from '@app/entity/entities';
import { CreateSprintDto, UpdateSprintDto } from './dto';

@Injectable()
export class SprintService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepository: Repository<Sprint>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
  ) {}

  async getSprintsByProject(projectId: string) {
    const sprints = await this.sprintRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });

    // Get task counts for each sprint
    const sprintsWithStats = await Promise.all(
      sprints.map(async (sprint) => {
        const tasks = await this.taskRepository.find({
          where: { sprintId: sprint.id },
          select: ['id', 'status', 'storyPoints'],
        });

        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === TaskStatus.DONE).length;
        const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const completedPoints = tasks
          .filter(t => t.status === TaskStatus.DONE)
          .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

        return {
          ...sprint,
          totalTasks,
          completedTasks,
          totalPoints,
          completedPoints,
        };
      })
    );

    return { sprints: sprintsWithStats };
  }

  async getSprintById(id: string) {
    const sprint = await this.sprintRepository.findOne({ where: { id } });
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }
    return { sprint };
  }

  async getSprintTasks(sprintId: string) {
    const tasks = await this.taskRepository.find({
      where: { sprintId },
      relations: ['assignee', 'labels', 'subtasks'],
      order: { createdAt: 'DESC' },
    });
    return { tasks };
  }

  async getBurndownData(sprintId: string) {
    const sprint = await this.sprintRepository.findOne({ where: { id: sprintId } });
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const tasks = await this.taskRepository.find({
      where: { sprintId },
      select: ['id', 'status', 'storyPoints', 'updatedAt', 'createdAt'],
    });

    const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = tasks
      .filter(t => t.status === TaskStatus.DONE)
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    // Calculate ideal burndown line
    const startDate = sprint.startDate || sprint.createdAt;
    const endDate = sprint.endDate || new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

    const idealLine: { day: number; points: number }[] = [];
    for (let i = 0; i <= totalDays; i++) {
      idealLine.push({
        day: i,
        points: Math.round(totalPoints - (totalPoints / totalDays) * i),
      });
    }

    return {
      totalPoints,
      completedPoints,
      remainingPoints: totalPoints - completedPoints,
      idealLine,
      sprint,
    };
  }

  async createSprint(userId: string, dto: CreateSprintDto) {
    const project = await this.projectRepository.findOne({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = await this.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin && project.teamLead !== userId) {
      throw new ForbiddenException('Only workspace admin or team lead can create sprints');
    }

    const sprint = this.sprintRepository.create({
      name: dto.name,
      goal: dto.goal,
      projectId: dto.projectId,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    } as any);

    await this.sprintRepository.save(sprint);
    return { sprint, message: 'Sprint created successfully' };
  }

  async updateSprint(userId: string, id: string, dto: UpdateSprintDto) {
    const sprint = await this.sprintRepository.findOne({ where: { id } });
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    const project = await this.projectRepository.findOne({
      where: { id: sprint.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const isAdmin = await this.isWorkspaceAdmin(project.workspaceId, userId);
    if (!isAdmin && project.teamLead !== userId) {
      throw new ForbiddenException('Only workspace admin or team lead can update sprints');
    }

    await this.sprintRepository.update(id, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : sprint.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : sprint.endDate,
    });

    const updatedSprint = await this.sprintRepository.findOne({ where: { id } });
    return { sprint: updatedSprint, message: 'Sprint updated successfully' };
  }

  async startSprint(userId: string, id: string) {
    const sprint = await this.sprintRepository.findOne({ where: { id } });
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    if (sprint.status !== SprintStatus.PLANNING) {
      throw new BadRequestException('Sprint is not in planning status');
    }

    // Check for existing active sprint
    const activeSprint = await this.sprintRepository.findOne({
      where: { projectId: sprint.projectId, status: SprintStatus.ACTIVE },
    });
    if (activeSprint) {
      throw new BadRequestException('There is already an active sprint');
    }

    await this.sprintRepository.update(id, {
      status: SprintStatus.ACTIVE,
      startDate: new Date(),
    });

    const updatedSprint = await this.sprintRepository.findOne({ where: { id } });
    return { sprint: updatedSprint, message: 'Sprint started successfully' };
  }

  async completeSprint(userId: string, id: string) {
    const sprint = await this.sprintRepository.findOne({ where: { id } });
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    if (sprint.status !== SprintStatus.ACTIVE) {
      throw new BadRequestException('Sprint is not active');
    }

    await this.sprintRepository.update(id, {
      status: SprintStatus.COMPLETED,
      endDate: new Date(),
    });

    // Move incomplete tasks to backlog (set sprintId to null)
    await this.taskRepository.update(
      { sprintId: id, status: In([TaskStatus.TODO, TaskStatus.IN_PROGRESS]) },
      { sprintId: undefined as any }
    );

    const updatedSprint = await this.sprintRepository.findOne({ where: { id } });
    return { sprint: updatedSprint, message: 'Sprint completed successfully' };
  }

  async addTasksToSprint(userId: string, sprintId: string, taskIds: string[]) {
    const sprint = await this.sprintRepository.findOne({ where: { id: sprintId } });
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    await this.taskRepository.update(
      { id: In(taskIds) },
      { sprintId }
    );

    const tasks = await this.taskRepository.find({
      where: { sprintId },
      relations: ['assignee', 'labels'],
    });

    return { tasks, message: 'Tasks added to sprint successfully' };
  }

  async removeTaskFromSprint(userId: string, sprintId: string, taskId: string) {
    await this.taskRepository.update(taskId, { sprintId: undefined as any });
    return { message: 'Task removed from sprint successfully' };
  }

  async deleteSprint(userId: string, id: string) {
    const sprint = await this.sprintRepository.findOne({ where: { id } });
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    // Move all tasks to backlog
    await this.taskRepository.update({ sprintId: id }, { sprintId: undefined as any });

    await this.sprintRepository.delete(id);
    return { message: 'Sprint deleted successfully' };
  }

  private async isWorkspaceAdmin(workspaceId: string, userId: string): Promise<boolean> {
    const member = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId, role: WorkspaceRole.ADMIN },
    });
    return !!member;
  }
}
