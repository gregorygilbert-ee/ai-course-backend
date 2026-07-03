import { Task, CreateTaskInput, UpdateTaskInput } from '../../domain/models/Task';
import { TaskRepository } from '../../ports/outbound/TaskRepository';

export class InMemoryTaskRepository implements TaskRepository {
  private tasks: Map<string, Task> = new Map();

  async save(input: CreateTaskInput): Promise<Task> {
    const now = new Date();
    const task: Task = {
      id: input.id,
      userId: input.userId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ?? null,
      isCompleted: false,
      createdAt: now,
      updatedAt: now,
    };
    this.tasks.set(task.id, task);
    return task;
  }

  async findAllByUserId(userId: string): Promise<Task[]> {
    return [...this.tasks.values()].filter((t) => t.userId === userId);
  }

  async findByIdAndUserId(id: string, userId: string): Promise<Task | null> {
    const task = this.tasks.get(id);
    return task?.userId === userId ? task : null;
  }

  async update(id: string, userId: string, input: UpdateTaskInput): Promise<Task> {
    const task = await this.findByIdAndUserId(id, userId);
    if (!task) throw new Error(`Task not found: ${id}`);
    const updated: Task = { ...task, ...input, updatedAt: new Date() };
    this.tasks.set(id, updated);
    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.findByIdAndUserId(id, userId);
    if (task) this.tasks.delete(id);
  }

  clear(): void {
    this.tasks.clear();
  }
}
