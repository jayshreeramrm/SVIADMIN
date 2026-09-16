export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  subject?: string;
  message: string;
  timestamp: any; // Firestore Timestamp
  status?: 'pending' | 'contacted';
}

export interface CareerApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  role: string;
  resumeUrl?: string;
  timestamp: any;
  status: 'pending' | 'reviewed' | 'interview' | 'offered' | 'rejected';
}

export interface InternshipApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  college: string;
  stream: string;
  year: string;
  duration: string;
  timestamp: any;
  status: 'pending' | 'reviewed' | 'interview' | 'offered' | 'rejected';
}

export interface PageVisitLog {
  id: string;
  path: string;
  timestamp: any;
  ip?: string;
  userAgent?: string;
}
