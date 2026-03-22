import Dexie from 'dexie';

export const db = new Dexie('ProTasksDB');

db.version(2).stores({
  tasks: 'id, title, completed, dueDate, version, deleted, rawInput, user_id, createdAt, priority, category, dueTime, recurring',
  sync_queue: '++id, action, payload, timestamp'
});
