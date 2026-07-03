import { PrismaClient } from '@prisma/client';
import { Task, CreateTaskInput, UpdateTaskInput } from '../../domain/models/Task';
import { TaskRepository } from '../../ports/outbound/TaskRepository';

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(input: CreateTaskInput): Promise<Task> {
    return this.prisma.task.create({
      data: {
        id: input.id,
        userId: input.userId,
        title: input.title,
        description: input.description,
        dueDate: input.dueDate ?? null,
      },
    });
  }

  async findAllByUserId(userId: string): Promise<Task[]> {
    return this.prisma.task.findMany({ where: { userId } });
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Task | null> {
    return this.prisma.task.findFirst({ where: { id, userId } });
  }

  async update(id: string, userId: string, input: UpdateTaskInput): Promise<Task> {
    const { count } = await this.prisma.task.updateMany({
      where: { id, userId },
      data: input,
    });
    if (count === 0) throw new Error(`Task not found: ${id}`);
    return this.prisma.task.findUniqueOrThrow({ where: { id } });
  }

  async delete(id: string, userId: string): Promise<void> {
    await this.prisma.task.deleteMany({ where: { id, userId } });
  }
}
