
// src/services/task-service.ts
import type { Task } from '@/lib/data';
import { mockTasks } from '@/lib/data'; // Assuming tasks are part of mockData for now
// import { apiClient, parseJsonResponse, UnauthorizedError, HttpError } from './api-client';

/**
 * Fetches tasks for a specific employee.
 * MOCKED: This function currently returns mock data.
 * TODO: Replace with actual API call when backend endpoint is available.
 * @param employeeId The ID of the employee.
 */
export async function fetchTasksForEmployee(employeeId: string): Promise<Task[]> {
  console.log(`MOCK API CALL: GET /api/employees/${employeeId}/tasks (or similar)`);
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

  // For now, return all mock tasks, or filter if you want to simulate employee-specific tasks
  // e.g. return mockTasks.filter(task => task.assignedTo === employeeId) if tasks had an assignedTo field.
  // Since mockTasks don't have assignedTo, we return a subset for demo.
  if (employeeId === 'emp001' || employeeId === 'emp004') { // Alice and Diana get some tasks
    return Promise.resolve([...mockTasks.slice(0,3)]);
  }
  if (employeeId === 'emp002') { // Bob gets other tasks
    return Promise.resolve([mockTasks[1], mockTasks[3]]);
  }
  return Promise.resolve([]); // Other employees have no tasks for now
}

/**
 * Updates the status of a task.
 * MOCKED: This function currently simulates updating a task.
 * TODO: Replace with actual API call (e.g., PUT /api/tasks/{taskId}) when backend endpoint is available.
 * @param taskId The ID of the task.
 * @param isCompleted The new completion status of the task.
 */
export async function updateTaskStatus(taskId: string, isCompleted: boolean): Promise<void> {
  console.log(`MOCK API CALL: PUT /api/tasks/${taskId} with status: ${isCompleted}`);
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  
  // Simulate updating the mock data if desired (won't persist beyond session unless mockTasks is mutated globally)
  const taskIndex = mockTasks.findIndex(t => t.id === taskId);
  if (taskIndex > -1) {
    // This would mutate the global mockTasks array if it's not a copy.
    // For a real app, this update would happen on the server.
    // mockTasks[taskIndex].isCompleted = isCompleted;
    console.log(`Mock task ${taskId} status would be set to ${isCompleted} on the backend.`);
  } else {
    console.warn(`Mock task ${taskId} not found for status update.`);
  }
  
  return Promise.resolve();
}
