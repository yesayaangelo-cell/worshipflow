export enum Role {
  WL = 'WL',
  Singer = 'Singer',
  Keyboard = 'Keyboard',
  Guitar = 'Guitar',
  Bass = 'Bass',
  Drum = 'Drum',
  Multimedia = 'Multimedia',
  Soundman = 'Soundman'
}

export interface Member {
  id: string;
  name: string;
  phone: string;
  roles: Role[];
  status: 'active' | 'inactive';
  avatar: string;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  time: string;
  category: string;
}

export interface Assignment {
  id: string;
  eventId: string;
  role: Role;
  memberId: string;
}

export interface Song {
  id: string;
  eventId: string;
  title: string;
  key: string;
  bpm?: string;
  notes?: string;
}

export interface AdminProfile {
  churchName: string;
  adminName: string;
  role: string;
  password?: string;
}

export type AppTab = 'dashboard' | 'schedule' | 'team';