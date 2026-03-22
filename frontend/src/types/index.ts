export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Category = 'Personal' | 'Work' | 'Health' | 'Study' | 'Finance' | 'Errands' | 'Habit' | 'Urgent';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin?: boolean;
  createdAt?: any;
  lastLogin?: any;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  completed: boolean;
  deleted: boolean;
  priority: Priority;
  category: Category;
  dueDate: string; // ISO date string YYYY-MM-DD
  dueTime: string | null; // HH:mm format
  createdAt: any;
  updatedAt: any;
  version: number;
  subtasksJson?: string;
  notes?: string;
  estimatedMins?: number;
}

export interface Habit extends Task {
  streak: number;
  lastCompleted: string | null;
}

export interface AppLog {
  id?: string;
  userId: string;
  type: 'INFO' | 'WARN' | 'ERROR';
  action: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: any;
}
