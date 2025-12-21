import { DeleteTasksDto } from '../dto';

export class DeleteTasksCommand {
  constructor(
    public readonly userId: string,
    public readonly dto: DeleteTasksDto,
  ) {}
}
