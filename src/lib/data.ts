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
  lastSeen?: string; // For location tracking map
}

export interface ActivityLog {
  id: string;
  employeeId: string;
  employeeName: string;
  checkInTime?: string; 
  checkOutTime?: string;
  activity: string; 
  location?: string; 
  date: string; 
}

export interface Office {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  headcount: number;
}

export const mockEmployees: Employee[] = [
  { id: 'emp001', name: 'Alice Wonderland', email: 'alice@example.com', department: 'Engineering', status: 'Active', avatarUrl: 'https://placehold.co/40x40.png', jobTitle: 'Software Engineer', latitude: 34.052235, longitude: -118.243683, lastSeen: '5m ago' },
  { id: 'emp002', name: 'Bob The Builder', email: 'bob@example.com', department: 'Construction', status: 'Active', avatarUrl: 'https://placehold.co/40x40.png', jobTitle: 'Lead Architect', latitude: 34.055130, longitude: -118.245890, lastSeen: '15m ago' },
  { id: 'emp003', name: 'Charlie Brown', email: 'charlie@example.com', department: 'Animation', status: 'Inactive', avatarUrl: 'https://placehold.co/40x40.png', jobTitle: 'Character Designer', latitude: 34.050000, longitude: -118.230000, lastSeen: '2h ago' },
  { id: 'emp004', name: 'Diana Prince', email: 'diana@example.com', department: 'Justice League', status: 'Active', avatarUrl: 'https://placehold.co/40x40.png', jobTitle: 'Ambassador', latitude: 34.056000, longitude: -118.250000, lastSeen: 'Online' },
  { id: 'emp005', name: 'Edward Scissorhands', email: 'edward@example.com', department: 'Landscaping', status: 'Active', avatarUrl: 'https://placehold.co/40x40.png', jobTitle: 'Topiary Artist', latitude: 34.048000, longitude: -118.240000, lastSeen: '30m ago' },
];

export const mockActivityLogs: ActivityLog[] = [
  { id: 'log001', employeeId: 'emp001', employeeName: 'Alice Wonderland', checkInTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), activity: 'Checked In', location: 'Main Office', date: new Date().toISOString() },
  { id: 'log002', employeeId: 'emp002', employeeName: 'Bob The Builder', checkInTime: new Date(Date.now() - 7.5 * 60 * 60 * 1000).toISOString(), activity: 'Checked In', location: 'Client Site A', date: new Date().toISOString() },
  { id: 'log003', employeeId: 'emp001', employeeName: 'Alice Wonderland', checkOutTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), activity: 'Checked Out', location: 'Main Office', date: new Date().toISOString() },
  { id: 'log004', employeeId: 'emp004', employeeName: 'Diana Prince', checkInTime: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(), activity: 'Checked In', location: 'Remote', date: new Date().toISOString() },
  { id: 'log005', employeeId: 'emp005', employeeName: 'Edward Scissorhands', checkInTime: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), activity: 'Checked In', location: 'Garden Project', date: new Date().toISOString() },
  { id: 'log006', employeeId: 'emp002', employeeName: 'Bob The Builder', checkOutTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(), activity: 'Checked Out', location: 'Client Site A', date: new Date().toISOString() },
];

export const mockOffices: Office[] = [
  { id: 'off001', name: 'Headquarters', address: '123 Main St, Los Angeles, CA', latitude: 34.052235, longitude: -118.243683, headcount: 150 },
  { id: 'off002', name: 'Innovation Center', address: '456 Tech Park, San Francisco, CA', latitude: 37.774929, longitude: -122.419418, headcount: 75 },
  { id: 'off003', name: 'East Coast Hub', address: '789 Broadway, New York, NY', latitude: 40.712776, longitude: -74.005974, headcount: 100 },
];

export const mockAttendanceSummary = {
  totalEmployees: mockEmployees.length,
  activeToday: mockActivityLogs.filter(log => log.checkInTime && !log.checkOutTime && new Date(log.date).toDateString() === new Date().toDateString()).length,
  checkedInToday: new Set(mockActivityLogs.filter(log => log.checkInTime && new Date(log.date).toDateString() === new Date().toDateString()).map(log => log.employeeId)).size,
  avgWorkHours: 7.5, // Mocked
};
