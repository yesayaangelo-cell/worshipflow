import { Role, AdminProfile, Member, Event, Assignment, Song } from './types';

export const STORAGE_KEYS = {
  MEMBERS: 'wf_v10_members', 
  EVENTS: 'wf_v10_events',
  ASSIGNMENTS: 'wf_v10_assignments',
  SONGS: 'wf_v10_songs',
  PROFILE: 'wf_v10_profile',
  IS_LOGGED_IN: 'wf_v10_is_logged_in'
};

export const MEMBER_LIMIT = 20;
export const EVENT_LIMIT = 10;

export const STANDARD_ROLES: Role[] = [
  Role.WL,
  Role.Singer,
  Role.Keyboard,
  Role.Guitar,
  Role.Bass,
  Role.Drum,
  Role.Multimedia,
  Role.Soundman
];

export const DEFAULTS = {
  PROFILE: {
    churchName: 'Victory Worship Center',
    adminName: 'Chief Director',
    role: 'Music Director',
    password: 'admin123'
  } as AdminProfile,
  MEMBERS: [
    { id: 'm1', name: 'Andre Wijaya', roles: [Role.WL, Role.Guitar], phone: '08123456789', status: 'active', avatar: 'AW' },
    { id: 'm2', name: 'Sarah Putri', roles: [Role.Singer], phone: '08129876543', status: 'active', avatar: 'SP' },
    { id: 'm3', name: 'David Santoso', roles: [Role.Keyboard], phone: '08191234567', status: 'active', avatar: 'DS' },
    { id: 'm4', name: 'Budi Hartono', roles: [Role.Drum], phone: '08187654321', status: 'active', avatar: 'BH' },
  ] as Member[],
  EVENTS: [
    { id: 'e1', date: '2024-12-24', time: '18:00', name: 'Christmas Eve Service', category: 'Special Service' },
    { id: 'e2', date: '2024-12-25', time: '09:00', name: 'Christmas Celebration', category: 'Sunday Service' },
  ] as Event[],
  ASSIGNMENTS: [
    { id: 'a1', eventId: 'e1', role: Role.WL, memberId: 'm1' },
    { id: 'a2', eventId: 'e1', role: Role.Keyboard, memberId: 'm3' },
  ] as Assignment[],
  SONGS: [
    { id: 's1', eventId: 'e1', title: 'O Holy Night', key: 'G' },
    { id: 's2', eventId: 'e1', title: 'Great Are You Lord', key: 'A' },
  ] as Song[]
};