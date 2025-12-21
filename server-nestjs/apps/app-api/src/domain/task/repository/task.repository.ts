import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, Project, ProjectMember, User, WorkspaceMember, WorkspaceRole, Label, Subtask } from '@app/entity/entities';

@Injectable()
export class TaskRepository {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
    @InjectRepository(Subtask)
    private readonly subtaskRepository: Repository<Subtask>,
  ) {}

  async findById(id: string): Promise<Task | null> {
    return this.taskRepository.findOne({
      where: { id },
      relations: ['project', 'assignee', 'comments', 'labels', 'subtasks'],
    });
  }

  async findByProject(projectId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { projectId },
      relations: ['assignee', 'labels', 'subtasks'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByIds(ids: string[]): Promise<Task[]> {
    return this.taskRepository.find({
      where: { id: In(ids) },
    });
  }

  async create(data: Partial<Task>): Promise<Task> {
    const task = this.taskRepository.create(data);
    return this.taskRepository.save(task);
  }

  async update(id: string, data: Partial<Task>): Promise<void> {
    await this.taskRepository.update(id, data);
  }

  async deleteMany(ids: string[]): Promise<void> {
    await this.taskRepository.softDelete({ id: In(ids) });
  }

  async findProject(projectId: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['workspace'],
    });
  }

  async findProjectMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    return this.memberRepository.findOne({ where: { projectId, userId } });
  }

  async findWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return this.workspaceMemberRepository.findOne({ where: { workspaceId, userId } });
  }

  async isWorkspaceAdmin(workspaceId: string, userId: string): Promise<boolean> {
    const member = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId, role: WorkspaceRole.ADMIN },
    });
    return !!member;
  }

  async findUser(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async findDueTasks(date: Date): Promise<Task[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.project', 'project')
      .where('task.dueDate >= :startOfDay', { startOfDay })
      .andWhere('task.dueDate <= :endOfDay', { endOfDay })
      .andWhere('task.status != :status', { status: 'DONE' })
      .andWhere('task.assigneeId IS NOT NULL')
      .getMany();
  }

  // Label management
  async findLabelsByIds(ids: string[]): Promise<Label[]> {
    if (!ids || ids.length === 0) return [];
    return this.labelRepository.find({
      where: { id: In(ids) },
    });
  }

  async setLabels(taskId: string, labelIds: string[]): Promise<Task | null> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['labels'],
    });

    if (!task) return null;

    if (!labelIds || labelIds.length === 0) {
      task.labels = [];
    } else {
      const labels = await this.findLabelsByIds(labelIds);
      task.labels = labels;
    }

    return this.taskRepository.save(task);
  }

  async addLabels(taskId: string, labelIds: string[]): Promise<Task | null> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['labels'],
    });

    if (!task) return null;

    const existingIds = task.labels.map(l => l.id);
    const newIds = labelIds.filter(id => !existingIds.includes(id));

    if (newIds.length > 0) {
      const newLabels = await this.findLabelsByIds(newIds);
      task.labels = [...task.labels, ...newLabels];
      return this.taskRepository.save(task);
    }

    return task;
  }

  async removeLabels(taskId: string, labelIds: string[]): Promise<Task | null> {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
      relations: ['labels'],
    });

    if (!task) return null;

    task.labels = task.labels.filter(l => !labelIds.includes(l.id));
    return this.taskRepository.save(task);
  }

  // Subtask methods
  async createSubtask(data: Partial<Subtask>): Promise<Subtask> {
    // Get max position for the task
    const maxPosition = await this.subtaskRepository
      .createQueryBuilder('subtask')
      .where('subtask.taskId = :taskId', { taskId: data.taskId })
      .select('MAX(subtask.position)', 'max')
      .getRawOne();

    const subtask = this.subtaskRepository.create({
      ...data,
      position: (maxPosition?.max ?? -1) + 1,
    });
    return this.subtaskRepository.save(subtask);
  }

  async findSubtasksByTask(taskId: string): Promise<Subtask[]> {
    return this.subtaskRepository.find({
      where: { taskId },
      order: { position: 'ASC' },
    });
  }

  async findSubtaskById(id: string): Promise<Subtask | null> {
    return this.subtaskRepository.findOne({ where: { id } });
  }

  async updateSubtask(id: string, data: Partial<Subtask>): Promise<Subtask | null> {
    await this.subtaskRepository.update(id, data);
    return this.findSubtaskById(id);
  }

  async deleteSubtask(id: string): Promise<void> {
    await this.subtaskRepository.delete(id);
  }

  async reorderSubtasks(subtaskIds: string[]): Promise<void> {
    const updates = subtaskIds.map((id, index) =>
      this.subtaskRepository.update(id, { position: index })
    );
    await Promise.all(updates);
  }

  async toggleSubtaskCompleted(id: string): Promise<Subtask | null> {
    const subtask = await this.findSubtaskById(id);
    if (!subtask) return null;

    await this.subtaskRepository.update(id, { completed: !subtask.completed });
    return this.findSubtaskById(id);
  }
}
