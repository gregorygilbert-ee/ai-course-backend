import { v4 as uuidv4 } from 'uuid';
import { validateTaskTitle, UpdateTaskInput } from '../../domain/models/Task';
import { TaskRepository } from '../../ports/outbound/TaskRepository';

export class TaskNotFoundError extends Error {
  constructor(id: string) {
    super(`Task not found: ${id}`);
    this.name = 'TaskNotFoundError';
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

export interface CreateTaskInput {
  userId: string;
  title: string;
  description: string;
  dueDate?: Date;
}

export class CreateTask {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(input: CreateTaskInput) {
    validateTaskTitle(input.title);
    return this.taskRepository.save({ id: uuidv4(), ...input });
  }
}

// ── Get All ───────────────────────────────────────────────────────────────────

export class GetTasks {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(userId: string) {
    return this.taskRepository.findAllByUserId(userId);
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

export class UpdateTask {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string, userId: string, input: UpdateTaskInput) {
    if (input.title !== undefined) validateTaskTitle(input.title);
    const existing = await this.taskRepository.findByIdAndUserId(id, userId);
    if (!existing) throw new TaskNotFoundError(id);
    return this.taskRepository.update(id, userId, input);
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

export class DeleteTask {
  constructor(private readonly taskRepository: TaskRepository) {}

  async execute(id: string, userId: string) {
    const existing = await this.taskRepository.findByIdAndUserId(id, userId);
    if (!existing) throw new TaskNotFoundError(id);
    await this.taskRepository.delete(id, userId);
  }
}
