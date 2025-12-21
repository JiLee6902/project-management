import { CreateTaskDto } from '../dto';

export class CreateTaskCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: CreateTaskDto,
  ) {}
}
