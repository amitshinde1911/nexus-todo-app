export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Category = 'Personal' | 'Work' | 'Health' | 'Study' | 'Finance' | 'Errands' | 'Habit' | 'Urgent';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'PAUSED' | 'COMPLETED';
export type RepeatInterval = 'NONE' | 'DAILY' | 'WEEKLY';

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
  
  // Execution Fields
  status: TaskStatus;
  estimatedMins?: number;
  actualMins: number;
  startTime?: string | null;
  endTime?: string | null;
  completedAt?: string | null;
  isTimerEnabled?: boolean;

  // Scheduling Fields
  scheduledAt?: string;
  repeat: RepeatInterval;

  // Auto Execution System
  isExecutionMode?: boolean;
  executionOrder?: number;
  isLocked?: boolean;

  // Recurring Template System
  isRecurring?: boolean;
  recurrenceType?: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  recurrenceDays?: number[]; // [0,1,2,3,4,5,6] -> Sun, Mon, Tue etc.
  lastGeneratedDate?: string;

  // Ritual Engine
  isRitual?: boolean;
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
