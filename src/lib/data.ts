
export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  status: 'Active' | 'Inactive';
  avatarUrl: string;
  jobTitle: string;
  latitude?: number;
  longitude?: number;
  lastSeen?: string;
  officeId?: string;
  hireDate?: string; // Added hireDate
}

export interface ActivityLog {
  id: string;
  employeeId: string;
  employeeName: string;
  startTime?: string;
  endTime?: string;
  activityType: string;
  description?: string;
  location?: string;
}

export interface Office {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  headcount: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  dueDate?: string;
}

export const mockEmployees: Employee[] = [
  { id: 'emp001', name: 'Alice Wonderland', email: 'alice@example.com', department: 'Engineering', status: 'Active', avatarUrl: 'https://placehold.co/40x40.png', jobTitle: 'Software Engineer', latitude: 34.052235, longitude: -118.243683, lastSeen: '5m ago', officeId: 'off001', hireDate: '2021-03-15' },
  { id: 'emp002', name: 'Bob The Builder', email: 'bob@example.com', department: 'Construction', status: 'Active', avatarUrl: 'https://placehold.co/40x40.png', jobTitle: 'Lead Architect', latitude: 34.055130, longitude: -118.245890, lastSeen: '15m ago', officeId: 'off002', hireDate: '2020-07-20' },
  { id: 'emp003', name: 'Charlie Brown', email: 'charlie@example.com', department: 'Animation', status: 'Inactive', avatarUrl: 'https://placehold.co/40x40.png', jobTitle: 'Character Designer', latitude: 34.050000, longitude: -118.230000, lastSeen: '2h ago', hireDate: '2019-01-10' },
  { id: 'emp004', name: 'Diana Prince', email: 'diana@example.com', department: 'Justice League', status: 'Active', avatarUrl: 'https://placehold.co/40x40.png', jobTitle: 'Ambassador', latitude: 34.056000, longitude: -118.250000, lastSeen: 'Online', officeId: 'off001', hireDate: '2017-06-02' },
  { id: 'emp005', name: 'Edward Scissorhands', email: 'edward@example.com', department: 'Landscaping', status: 'Active', avatarUrl: 'https://placehold.co/40x40.png', jobTitle: 'Topiary Artist', latitude: 34.048000, longitude: -118.240000, lastSeen: '30m ago', officeId: 'off003', hireDate: '2022-11-05' },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: 'log001', employeeId: 'emp001', employeeName: 'Alice Wonderland', startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), activityType: 'Checked In', location: 'Main Office' },
  { id: 'log002', employeeId: 'emp002', employeeName: 'Bob The Builder', startTime: new Date(Date.now() - 7.5 * 60 * 60 * 1000).toISOString(), activityType: 'Checked In', location: 'Client Site A' },
  { id: 'log003', employeeId: 'emp001', employeeName: 'Alice Wonderland', endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), activityType: 'Checked Out', location: 'Main Office' },
  { id: 'log004', employeeId: 'emp004', employeeName: 'Diana Prince', startTime: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), activityType: 'Checked In', location: 'Remote' },
  { id: 'log005', employeeId: 'emp005', employeeName: 'Edward Scissorhands', startTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), activityType: 'Checked In', location: 'Garden Project' },
  { id: 'log006', employeeId: 'emp002', employeeName: 'Bob The Builder', endTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), activityType: 'Checked Out', location: 'Client Site A' },
];

export const mockOffices: Office[] = [
  { id: 'off001', name: 'Headquarters', address: '123 Main St, Los Angeles, CA', latitude: 34.052235, longitude: -118.243683, headcount: 150 },
  { id: 'off002', name: 'Innovation Center', address: '456 Tech Park, San Francisco, CA', latitude: 37.774929, longitude: -122.419418, headcount: 75 },
  { id: 'off003', name: 'East Coast Hub', address: '789 Broadway, New York, NY', latitude: 40.712776, longitude: -74.005974, headcount: 100 },
];

export const mockAttendanceSummary = {
  totalEmployees: mockEmployees.length,
  activeToday: mockActivityLogs.filter(log => log.startTime && !log.endTime && new Date(log.startTime).toDateString() === new Date().toDateString()).length,
  checkedInToday: new Set(mockActivityLogs.filter(log => log.startTime && new Date(log.startTime).toDateString() === new Date().toDateString()).map(log => log.employeeId)).size,
  avgWorkHours: 7.5,
};

export const mockTasks: Task[] = [
    { id: 'task001', title: 'Finalize Q3 Report', description: 'Compile all data and write the executive summary.', isCompleted: false, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    { id: 'task002', title: 'Prepare Client Presentation', description: 'Create slides for Tuesday\'s meeting.', isCompleted: false, dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    { id: 'task003', title: 'Code Review - Payment Module', description: 'Check the latest changes on the feature/payment branch.', isCompleted: true, dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] },
    { id: 'task004', title: 'Contact Supplier X', description: 'Discuss new pricing terms.', isCompleted: false },
];
