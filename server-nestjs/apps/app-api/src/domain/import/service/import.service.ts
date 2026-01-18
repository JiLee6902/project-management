import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, Project, Label, WorkspaceMember, TaskStatus, TaskPriority } from '@app/entity/entities';
import {
  ImportConfigDto,
  ImportResultDto,
  ImportErrorDto,
  ImportPreviewDto,
  ColumnMappingDto,
  ImportSource,
  ImportEntity,
  TrelloImportDto,
} from '../dto';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(Label)
    private readonly labelRepository: Repository<Label>,
    @InjectRepository(WorkspaceMember)
    private readonly workspaceMemberRepository: Repository<WorkspaceMember>,
  ) {}

  async previewImport(
    file: Express.Multer.File,
    source: ImportSource,
  ): Promise<ImportPreviewDto> {
    const content = file.buffer.toString('utf-8');

    if (source === ImportSource.CSV) {
      return this.previewCSV(content);
    } else if (source === ImportSource.JSON) {
      return this.previewJSON(content);
    }

    throw new BadRequestException(`Unsupported import source: ${source}`);
  }

  private previewCSV(content: string): ImportPreviewDto {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length === 0) {
      throw new BadRequestException('Empty CSV file');
    }

    const headers = this.parseCSVLine(lines[0]);
    const sampleData: any[] = [];

    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      sampleData.push(row);
    }

    const suggestedMapping = this.suggestMapping(headers);

    return {
      headers,
      sampleData,
      suggestedMapping,
      totalRows: lines.length - 1,
    };
  }

  private previewJSON(content: string): ImportPreviewDto {
    let data: any[];
    try {
      const parsed = JSON.parse(content);
      data = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      throw new BadRequestException('Invalid JSON format');
    }

    if (data.length === 0) {
      throw new BadRequestException('Empty JSON data');
    }

    const headers = Object.keys(data[0]);
    const sampleData = data.slice(0, 5);
    const suggestedMapping = this.suggestMapping(headers);

    return {
      headers,
      sampleData,
      suggestedMapping,
      totalRows: data.length,
    };
  }

  private suggestMapping(headers: string[]): ColumnMappingDto[] {
    const mapping: ColumnMappingDto[] = [];
    const fieldMappings: Record<string, string[]> = {
      title: ['title', 'name', 'task', 'summary', 'subject'],
      description: ['description', 'desc', 'details', 'body', 'content'],
      status: ['status', 'state', 'stage'],
      priority: ['priority', 'importance', 'urgency'],
      dueDate: ['duedate', 'due_date', 'deadline', 'due'],
      assignee: ['assignee', 'assigned', 'owner', 'user', 'responsible'],
      labels: ['labels', 'tags', 'categories'],
      estimatedHours: ['estimated', 'estimate', 'hours', 'estimation'],
    };

    for (const header of headers) {
      const lowerHeader = header.toLowerCase().replace(/[^a-z0-9]/g, '');
      for (const [targetField, patterns] of Object.entries(fieldMappings)) {
        if (patterns.some((p) => lowerHeader.includes(p))) {
          mapping.push({
            sourceField: header,
            targetField,
          });
          break;
        }
      }
    }

    return mapping;
  }

  async importTasks(
    userId: string,
    file: Express.Multer.File,
    config: ImportConfigDto,
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const errors: ImportErrorDto[] = [];
    let importedCount = 0;
    let skippedCount = 0;
    let labelsCreated = 0;

    // Verify project access
    const project = await this.projectRepository.findOne({
      where: { id: config.projectId },
      relations: ['workspace'],
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const isMember = await this.workspaceMemberRepository.findOne({
      where: { workspaceId: project.workspaceId, userId },
    });

    if (!isMember) {
      throw new BadRequestException('You do not have access to this project');
    }

    const content = file.buffer.toString('utf-8');
    let rows: any[];

    if (config.source === ImportSource.CSV) {
      rows = this.parseCSV(content);
    } else if (config.source === ImportSource.JSON) {
      rows = JSON.parse(content);
      if (!Array.isArray(rows)) rows = [rows];
    } else {
      throw new BadRequestException(`Unsupported import source: ${config.source}`);
    }

    // Create mapping from config or use defaults
    const mapping = config.columnMapping?.length
      ? config.columnMapping
      : this.suggestMapping(Object.keys(rows[0] || {}));

    const labelCache = new Map<string, Label>();

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        const taskData = this.mapRowToTask(row, mapping);

        if (!taskData.title) {
          errors.push({
            row: i + 1,
            field: 'title',
            message: 'Title is required',
            data: row,
          });
          skippedCount++;
          continue;
        }

        // Check for duplicates
        if (config.skipDuplicates) {
          const existing = await this.taskRepository.findOne({
            where: { projectId: config.projectId, title: taskData.title },
          });
          if (existing) {
            skippedCount++;
            continue;
          }
        }

        // Handle labels - labels are per workspace, not per project
        const taskLabels: Label[] = [];
        if (config.createLabels && taskData.labels) {
          for (const labelName of taskData.labels) {
            let label = labelCache.get(labelName);
            if (!label) {
              const foundLabel = await this.labelRepository.findOne({
                where: { name: labelName, workspaceId: project.workspaceId },
              });
              if (foundLabel) {
                label = foundLabel;
              } else {
                label = this.labelRepository.create({
                  name: labelName,
                  workspaceId: project.workspaceId,
                  color: this.generateRandomColor(),
                });
                await this.labelRepository.save(label);
                labelsCreated++;
              }
              labelCache.set(labelName, label);
            }
            taskLabels.push(label);
          }
        }

        const task = this.taskRepository.create({
          title: taskData.title,
          description: taskData.description,
          status: taskData.status,
          priority: taskData.priority,
          dueDate: taskData.dueDate,
          projectId: config.projectId,
          assigneeId: config.assignToCurrentUser ? userId : undefined,
          createdBy: userId,
          labels: taskLabels,
        });

        await this.taskRepository.save(task);
        importedCount++;
      } catch (error: any) {
        errors.push({
          row: i + 1,
          message: error.message || 'Unknown error',
          data: rows[i],
        });
        skippedCount++;
      }
    }

    return {
      success: errors.length === 0,
      importedCount,
      skippedCount,
      errors: errors.slice(0, 100), // Limit errors to 100
      summary: {
        totalProcessed: rows.length,
        tasksCreated: importedCount,
        labelsCreated,
        projectsCreated: 0,
        duration: Date.now() - startTime,
      },
    };
  }

  async importFromTrello(
    userId: string,
    importData: TrelloImportDto,
  ): Promise<ImportResultDto> {
    const startTime = Date.now();
    const errors: ImportErrorDto[] = [];
    let importedCount = 0;
    let skippedCount = 0;
    let labelsCreated = 0;
    let projectsCreated = 0;

    const { workspaceId, boardData, importArchived } = importData;

    // Verify workspace access
    const isMember = await this.workspaceMemberRepository.findOne({
      where: { workspaceId, userId },
    });

    if (!isMember) {
      throw new BadRequestException('You do not have access to this workspace');
    }

    // Create project from board
    const project = this.projectRepository.create({
      name: boardData.name || 'Imported from Trello',
      description: boardData.desc || '',
      workspaceId,
      createdBy: userId,
    });
    await this.projectRepository.save(project);
    projectsCreated++;

    // Map Trello labels - labels are per workspace
    const labelCache = new Map<string, Label>();
    if (boardData.labels) {
      for (const trelloLabel of boardData.labels) {
        if (trelloLabel.name) {
          const label = this.labelRepository.create({
            name: trelloLabel.name,
            workspaceId,
            color: this.trelloColorToHex(trelloLabel.color),
          });
          await this.labelRepository.save(label);
          labelCache.set(trelloLabel.id, label);
          labelsCreated++;
        }
      }
    }

    // Map Trello lists to statuses
    const listStatusMap = new Map<string, TaskStatus>();
    if (boardData.lists) {
      for (const list of boardData.lists) {
        const status = this.mapTrelloListToStatus(list.name);
        listStatusMap.set(list.id, status);
      }
    }

    // Import cards as tasks
    if (boardData.cards) {
      for (let i = 0; i < boardData.cards.length; i++) {
        const card = boardData.cards[i];

        // Skip archived cards if not importing them
        if (card.closed && !importArchived) {
          skippedCount++;
          continue;
        }

        try {
          const taskLabels: Label[] = [];
          if (card.idLabels) {
            for (const labelId of card.idLabels) {
              const label = labelCache.get(labelId);
              if (label) taskLabels.push(label);
            }
          }

          const task = this.taskRepository.create({
            title: card.name,
            description: card.desc || '',
            status: listStatusMap.get(card.idList) || TaskStatus.TODO,
            projectId: project.id,
            createdBy: userId,
            dueDate: card.due ? new Date(card.due) : undefined,
            labels: taskLabels,
          });

          await this.taskRepository.save(task);
          importedCount++;
        } catch (error: any) {
          errors.push({
            row: i + 1,
            message: error.message || 'Failed to import card',
            data: { name: card.name },
          });
          skippedCount++;
        }
      }
    }

    return {
      success: errors.length === 0,
      importedCount,
      skippedCount,
      errors: errors.slice(0, 100),
      summary: {
        totalProcessed: boardData.cards?.length || 0,
        tasksCreated: importedCount,
        labelsCreated,
        projectsCreated,
        duration: Date.now() - startTime,
      },
    };
  }

  private parseCSV(content: string): any[] {
    const lines = content.split('\n').filter((line) => line.trim());
    if (lines.length < 2) return [];

    const headers = this.parseCSVLine(lines[0]);
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return rows;
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  private mapRowToTask(
    row: any,
    mapping: ColumnMappingDto[],
  ): any {
    const taskData: any = {
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    };

    for (const map of mapping) {
      const value = row[map.sourceField];
      if (value !== undefined && value !== '') {
        if (map.targetField === 'labels') {
          taskData.labels = value
            .split(/[,;]/)
            .map((l: string) => l.trim())
            .filter((l: string) => l);
        } else if (map.targetField === 'dueDate') {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            taskData.dueDate = date;
          }
        } else if (map.targetField === 'status') {
          taskData.status = this.normalizeStatus(value);
        } else if (map.targetField === 'priority') {
          taskData.priority = this.normalizePriority(value);
        } else {
          taskData[map.targetField] = value;
        }
      }
    }

    return taskData;
  }

  private normalizeStatus(value: string): TaskStatus {
    const lower = value.toLowerCase();
    if (lower.includes('done') || lower.includes('complete') || lower.includes('finished')) {
      return TaskStatus.DONE;
    }
    if (lower.includes('progress') || lower.includes('doing') || lower.includes('active')) {
      return TaskStatus.IN_PROGRESS;
    }
    return TaskStatus.TODO;
  }

  private normalizePriority(value: string): TaskPriority {
    const lower = value.toLowerCase();
    if (lower.includes('high') || lower.includes('urgent') || lower.includes('critical')) {
      return TaskPriority.HIGH;
    }
    if (lower.includes('low') || lower.includes('minor')) {
      return TaskPriority.LOW;
    }
    return TaskPriority.MEDIUM;
  }

  private mapTrelloListToStatus(listName: string): TaskStatus {
    const lower = listName.toLowerCase();
    if (lower.includes('done') || lower.includes('complete') || lower.includes('finished')) {
      return TaskStatus.DONE;
    }
    if (lower.includes('doing') || lower.includes('progress') || lower.includes('working')) {
      return TaskStatus.IN_PROGRESS;
    }
    return TaskStatus.TODO;
  }

  private trelloColorToHex(color: string): string {
    const colorMap: Record<string, string> = {
      green: '#61bd4f',
      yellow: '#f2d600',
      orange: '#ff9f1a',
      red: '#eb5a46',
      purple: '#c377e0',
      blue: '#0079bf',
      sky: '#00c2e0',
      lime: '#51e898',
      pink: '#ff78cb',
      black: '#344563',
    };
    return colorMap[color] || '#344563';
  }

  private generateRandomColor(): string {
    const colors = [
      '#61bd4f', '#f2d600', '#ff9f1a', '#eb5a46',
      '#c377e0', '#0079bf', '#00c2e0', '#51e898',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  getImportTemplate(entity: ImportEntity): string {
    if (entity === ImportEntity.TASKS) {
      return 'title,description,status,priority,dueDate,labels\n"Example Task","Description here","TODO","MEDIUM","2024-12-31","label1,label2"';
    }
    return '';
  }
}
