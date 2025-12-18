import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Task, Project, ProjectMember, User } from '@app/entity/entities';

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
  ) {}

  async findById(id: string): Promise<Task | null> {
    return this.taskRepository.findOne({
      where: { id },
      relations: ['project', 'assignee', 'comments'],
    });
  }

  async findByProject(projectId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { projectId },
      relations: ['assignee'],
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
}
