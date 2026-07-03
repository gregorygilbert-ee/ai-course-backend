import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTask, GetTasks, UpdateTask, DeleteTask, TaskNotFoundError } from '../../src/application/use-cases/TaskUseCases';
import { InMemoryTaskRepository } from '../../src/adapters/persistence/InMemoryTaskRepository';
import { TaskValidationError } from '../../src/domain/models/Task';

const USER_A = 'user-a-uuid';
const USER_B = 'user-b-uuid';

describe('Task use cases', () => {
  let repo: InMemoryTaskRepository;
  let createTask: CreateTask;
  let getTasks: GetTasks;
  let updateTask: UpdateTask;
  let deleteTask: DeleteTask;

  beforeEach(() => {
    repo = new InMemoryTaskRepository();
    createTask = new CreateTask(repo);
    getTasks = new GetTasks(repo);
    updateTask = new UpdateTask(repo);
    deleteTask = new DeleteTask(repo);
  });

  describe('CreateTask', () => {
    it('creates a task for a user', async () => {
      const task = await createTask.execute({ userId: USER_A, title: 'Buy milk', description: '' });
      expect(task.title).toBe('Buy milk');
      expect(task.userId).toBe(USER_A);
      expect(task.isCompleted).toBe(false);
    });

    it('throws on empty title', async () => {
      await expect(createTask.execute({ userId: USER_A, title: '', description: '' }))
        .rejects.toThrow(TaskValidationError);
    });
  });

  describe('GetTasks', () => {
    it('returns only tasks belonging to the user', async () => {
      await createTask.execute({ userId: USER_A, title: 'Task A', description: '' });
      await createTask.execute({ userId: USER_B, title: 'Task B', description: '' });
      const tasks = await getTasks.execute(USER_A);
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe('Task A');
    });
  });

  describe('UpdateTask', () => {
    it('updates title and completion status', async () => {
      const task = await createTask.execute({ userId: USER_A, title: 'Original', description: '' });
      const updated = await updateTask.execute(task.id, USER_A, { title: 'Updated', isCompleted: true });
      expect(updated.title).toBe('Updated');
      expect(updated.isCompleted).toBe(true);
    });

    it('throws TaskNotFoundError for another user\'s task', async () => {
      const task = await createTask.execute({ userId: USER_A, title: 'Secret', description: '' });
      await expect(updateTask.execute(task.id, USER_B, { title: 'Hijack' }))
        .rejects.toThrow(TaskNotFoundError);
    });
  });

  describe('DeleteTask', () => {
    it('deletes a task owned by the user', async () => {
      const task = await createTask.execute({ userId: USER_A, title: 'Delete me', description: '' });
      await deleteTask.execute(task.id, USER_A);
      const remaining = await getTasks.execute(USER_A);
      expect(remaining).toHaveLength(0);
    });

    it('throws TaskNotFoundError when deleting another user\'s task', async () => {
      const task = await createTask.execute({ userId: USER_A, title: 'Mine', description: '' });
      await expect(deleteTask.execute(task.id, USER_B)).rejects.toThrow(TaskNotFoundError);
    });
  });
});
