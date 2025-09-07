export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: string;
  schedule: string;
  room: string;
  color?: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  courseId: string;
  courseName: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
}

export interface Schedule {
  id: string;
  courseId: string;
  courseName: string;
  instructor: string;
  room: string;
  startTime: string;
  endTime: string;
  dayOfWeek: number; // 0-6, Sunday is 0
  color?: string;
}