import { Task, CreateTaskInput, UpdateTaskInput } from '../../domain/models/Task';

export interface TaskRepository {
  save(input: CreateTaskInput): Promise<Task>;
  findAllByUserId(userId: string): Promise<Task[]>;
  findByIdAndUserId(id: string, userId: string): Promise<Task | null>;
  update(id: string, userId: string, input: UpdateTaskInput): Promise<Task>;
  delete(id: string, userId: string): Promise<void>;
}
