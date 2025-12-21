import { UpdateTaskDto } from '../dto';

export class UpdateTaskCommand {
  constructor(
    public readonly userId: string,
    public readonly taskId: string,
    public readonly dto: UpdateTaskDto,
  ) {}
}
