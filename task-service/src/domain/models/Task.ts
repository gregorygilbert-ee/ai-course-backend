export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate: Date | null;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  id: string;
  userId: string;
  title: string;
  description: string;
  dueDate?: Date;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: Date | null;
  isCompleted?: boolean;
}

export class TaskValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TaskValidationError';
  }
}

export function validateTaskTitle(title: string): void {
  if (!title || title.trim().length === 0) {
    throw new TaskValidationError('Task title cannot be empty');
  }
  if (title.length > 255) {
    throw new TaskValidationError('Task title cannot exceed 255 characters');
  }
}
