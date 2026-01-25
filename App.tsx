import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Search, 
  Clock, 
  Mic2, 
  LogOut, 
  Plus, 
  X, 
  Trash2, 
  Edit3, 
  UserPlus, 
  ListMusic, 
  Lock, 
  PanelLeftClose, 
  PanelLeftOpen, 
  AlertTriangle, 
  Share2, 
  Check, 
  User, 
  Music, 
  Settings, 
  Church, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Menu, 
  ChevronRight, 
  MoreVertical, 
  StickyNote,
  Command
} from 'lucide-react';
import { STORAGE_KEYS, DEFAULTS, STANDARD_ROLES, MEMBER_LIMIT, EVENT_LIMIT } from './constants';
import { Member, Event, Assignment, Song, AppTab, Role, AdminProfile } from './types';

// --- CUSTOM HOOKS ---

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      setStoredValue((prev: T) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        return valueToStore;
      });
    } catch (error) {
      console.error(`Error saving localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
}

// --- COMPONENTS ---

const Toast = ({ message, show }: { message: string, show: boolean }) => (
  <div className={`fixed bottom-28 md:bottom-10 left-1/2 -translate-x-1/2 md:translate-x-0 md:right-10 z-[100] transition-all duration-500 transform ${show ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
    <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-700/50 backdrop-blur-xl">
      <div className="bg-emerald-500/20 text-emerald-400 p-1.5 rounded-lg shrink-0">
        <Check size={18} strokeWidth={3} />
      </div>
      <span className="font-bold text-sm tracking-tight whitespace-nowrap">{message}</span>
    </div>
  </div>
);

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children?: React.ReactNode }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity animate-in fade-in duration-300" onClick={onClose} />
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 border border-slate-200/50 flex flex-col max-h-[92vh] sm:max-h-[90vh] relative z-10">
        <div className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
          <h3 className="font-black text-slate-900 text-xl tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-500 transition-all p-2 hover:bg-red-50 rounded-full">
            <X size={24} />
          </button>
        </div>
        <div className="p-8 overflow-y-auto bg-white pb-16 sm:pb-8">{children}</div>
      </div>
    </div>
  );
};

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }: { isOpen: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
      <div className="bg-white rounded-[2.5rem] shadow-2xl max-sm:max-w-xs w-full max-w-sm p-8 animate-in zoom-in-95 duration-200 relative z-10">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-[1.5rem] flex items-center justify-center mb-6">
            <AlertTriangle size={32} />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 leading-relaxed mb-8">{message}</p>
          <div className="flex gap-3 w-full">
            <button onClick={onClose} className="flex-1 px-6 py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all">Batal</button>
            <button onClick={onConfirm} className="flex-1 px-6 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200">Hapus</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP CONTENT ---

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage(STORAGE_KEYS.IS_LOGGED_IN, false);
  const [profile, setProfile] = useLocalStorage<AdminProfile>(STORAGE_KEYS.PROFILE, DEFAULTS.PROFILE);
  const [members, setMembers] = useLocalStorage(STORAGE_KEYS.MEMBERS, DEFAULTS.MEMBERS);
  const [events, setEvents] = useLocalStorage(STORAGE_KEYS.EVENTS, DEFAULTS.EVENTS);
  const [assignments, setAssignments] = useLocalStorage(STORAGE_KEYS.ASSIGNMENTS, DEFAULTS.ASSIGNMENTS);
  const [eventSongs, setEventSongs] = useLocalStorage(STORAGE_KEYS.SONGS, DEFAULTS.SONGS);
  const [activeTab, setActiveTab] = useLocalStorage<AppTab>('wf_active_tab_persistent', 'dashboard');

  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [modalType, setModalType] = useState<string | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {} });
  const [toast, setToast] = useState({ show: false, message: '' });
  
  // Login State
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [formData, setFormData] = useState<any>({});
  const [newSong, setNewSong] = useState({ title: '', key: '' });
  
  // Global Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Esc to close modals/search
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setModalType(null);
      }
      // Alt + 1,2,3 for tabs
      if (e.altKey && e.key === '1') setActiveTab('dashboard');
      if (e.altKey && e.key === '2') setActiveTab('schedule');
      if (e.altKey && e.key === '3') setActiveTab('team');
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  // Sorted Events
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [events]);

  const selectedEvent = useMemo(() => {
    return events.find(e => e.id === selectedEventId);
  }, [events, selectedEventId]);

  const adminInitials = useMemo(() => {
    return profile.adminName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'AD';
  }, [profile.adminName]);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginPass === (profile.password || 'admin123')) {
      setIsLoggedIn(true);
      setLoginError(false);
      setLoginPass('');
    } else {
      setLoginError(true);
    }
  };

  const shareContent = async (title: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text });
        showToast("Sent to share menu");
      } catch (error) {
        if ((error as any).name !== 'AbortError') {
          copyToClipboard(text);
        }
      }
    } else {
      copyToClipboard(text);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied to clipboard!");
    });
  };

  const handleShareSchedule = (event: Event) => {
    const team = assignments.filter(a => a.eventId === event.id);
    const songs = eventSongs.filter(s => s.eventId === event.id);
    const dateStr = new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

    let text = `🗓️ *WORSHIP SCHEDULE*\n*${event.name}*\n📅 ${dateStr} • ⏰ ${event.time}\n\n🎵 *SETLIST:*\n`;
    songs.length > 0 ? songs.forEach((s, idx) => {
      text += `${idx + 1}. ${s.title} (${s.key})`;
      if (s.notes) text += `\n   📝 Note: ${s.notes}`;
      text += `\n`;
    }) : text += `(No songs set)\n`;
    text += `\n🎸 *TEAM:*\n`;
    team.length > 0 ? team.forEach(a => {
      const member = members.find(m => m.id === a.memberId);
      text += `• ${a.role}: ${member ? member.name : '-'}\n`;
    }) : text += `(Team not assigned)\n`;

    shareContent(`Worship Schedule - ${event.name}`, text);
  };

  const handleShareAllSchedules = () => {
    if (events.length === 0) {
      showToast("No events to share");
      return;
    }

    let text = `🗓️ *ALL WORSHIP SCHEDULES*\n============================\n\n`;
    sortedEvents.forEach((event, index) => {
      const team = assignments.filter(a => a.eventId === event.id);
      const songs = eventSongs.filter(s => s.eventId === event.id);
      const dateStr = new Date(event.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

      text += `*${event.name}*\n📅 ${dateStr} • ⏰ ${event.time}\n\n`;
      text += `🎵 *SETLIST:*\n`;
      songs.length > 0 ? songs.forEach((s, idx) => {
        text += `${idx + 1}. ${s.title} (${s.key})`;
        if (s.notes) text += `\n   📝 Note: ${s.notes}`;
        text += `\n`;
      }) : text += `(No songs set)\n`;
      text += `\n🎸 *TEAM:*\n`;
      team.length > 0 ? team.forEach(a => {
        const member = members.find(m => m.id === a.memberId);
        text += `• ${a.role}: ${member ? member.name : '-'}\n`;
      }) : text += `(Team not assigned)\n`;
      
      if (index < sortedEvents.length - 1) {
        text += `\n----------------------------\n\n`;
      }
    });

    shareContent("All Worship Schedules", text);
  };

  const handleAddSong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSong.title || !newSong.key || !selectedEventId) return;
    setEventSongs(prev => [...prev, { 
      id: `s${Date.now()}`, 
      eventId: selectedEventId, 
      title: newSong.title, 
      key: newSong.key,
      notes: '' 
    }]);
    setNewSong({ title: '', key: '' });
    showToast("Song added");
  };

  const handleUpdateSongNotes = (songId: string, notes: string) => {
    setEventSongs(prev => prev.map(s => s.id === songId ? { ...s, notes } : s));
  };

  const handleAssignMember = (role: Role, memberId: string) => {
    if (!selectedEventId) return;
    setAssignments(prev => {
      const filtered = prev.filter(a => !(a.eventId === selectedEventId && a.role === role));
      if (!memberId) return filtered;
      return [...filtered, { id: `a${Date.now()}`, eventId: selectedEventId, role, memberId }];
    });
    showToast(`Role updated`);
  };

  const handleEventSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.date) return;
    
    if (events.length >= EVENT_LIMIT) {
      setModalType(null);
      showToast(`Batas maksimal ${EVENT_LIMIT} jadwal tercapai!`);
      return;
    }

    const newEvent = { ...formData, id: `e${Date.now()}` };
    setEvents(prev => [...prev, newEvent]);
    setModalType(null);
    showToast("Event created successfully");
  };

  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (members.length >= MEMBER_LIMIT) {
      setModalType(null);
      showToast(`Batas maksimal ${MEMBER_LIMIT} orang telah tercapai!`);
      return;
    }

    const initials = formData.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    const newMember: Member = { 
      id: `m${Date.now()}`,
      name: formData.name,
      phone: formData.phone || '-',
      roles: formData.roles || [],
      status: 'active',
      avatar: initials || '??'
    };
    setMembers(prev => [...prev, newMember]);
    setModalType(null);
    showToast("Member added successfully");
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(formData);
    setModalType(null);
    showToast("Profile settings updated");
  };

  const filteredMembers = useMemo(() => {
    if (!searchQuery) return [];
    return members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [members, searchQuery]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return [];
    return events.filter(e => e.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [events, searchQuery]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 sm:p-4">
        <div className="bg-white p-10 sm:p-14 rounded-[3rem] shadow-2xl border border-slate-100 w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          <div className="flex justify-center mb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-200"><Mic2 size={40} /></div>
          </div>
          <h2 className="text-3xl font-black text-center text-slate-900 mb-2">WorshipFlow</h2>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Access Key</label>
              <div className="relative group">
                <Lock className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${loginError ? 'text-red-400' : 'text-slate-300 group-focus-within:text-indigo-500'}`} size={20} />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className={`w-full pl-14 pr-14 py-5 bg-slate-50 border rounded-2xl outline-none transition-all font-black text-xl tracking-widest ${loginError ? 'border-red-300 focus:ring-4 focus:ring-red-50 text-red-600' : 'border-slate-100 focus:ring-4 focus:ring-indigo-50 text-slate-900 focus:border-indigo-200'}`}
                  value={loginPass}
                  onChange={(e) => { setLoginPass(e.target.value); if(loginError) setLoginError(false); }}
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {loginError && <p className="text-[10px] font-black text-red-500 px-1 text-center font-bold">Invalid administrator key.</p>}
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-black py-5 rounded-2xl shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95 group">
              <KeyRound size={20} className="group-hover:rotate-12 transition-transform" /> Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      <Toast message={toast.message} show={toast.show} />
      <ConfirmModal 
        isOpen={confirmState.isOpen} 
        onClose={() => setConfirmState(p => ({...p, isOpen: false}))} 
        onConfirm={() => { confirmState.onConfirm(); setConfirmState(p => ({...p, isOpen: false})); }} 
        title={confirmState.title} message={confirmState.message} 
      />

      {/* Global Search Modal */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center p-4 sm:pt-20">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsSearchOpen(false)} />
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative z-10 border border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center gap-4">
              <Search className="text-slate-400" size={24} />
              <input 
                autoFocus
                type="text" 
                placeholder="Search songs, members, or events... (Press Esc to close)" 
                className="flex-1 bg-transparent border-none outline-none text-xl font-bold text-slate-900 placeholder:text-slate-300"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-400 uppercase">
                <Command size={10} /> K
              </div>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-6">
              {searchQuery ? (
                <>
                  {filteredMembers.length > 0 && (
                    <div>
                      <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Members</h4>
                      <div className="space-y-1">
                        {filteredMembers.map(m => (
                          <button key={m.id} onClick={() => { setActiveTab('team'); setIsSearchOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 flex items-center gap-3 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-black">{m.avatar}</div>
                            <span className="font-bold text-slate-700">{m.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredEvents.length > 0 && (
                    <div>
                      <h4 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Events</h4>
                      <div className="space-y-1">
                        {filteredEvents.map(e => (
                          <button key={e.id} onClick={() => { setActiveTab('schedule'); setIsSearchOpen(false); }} className="w-full text-left px-4 py-3 rounded-xl hover:bg-slate-50 flex items-center gap-3 transition-colors">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><Calendar size={14} /></div>
                            <span className="font-bold text-slate-700">{e.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {filteredMembers.length === 0 && filteredEvents.length === 0 && (
                    <div className="p-10 text-center">
                      <p className="text-slate-400 font-bold italic">No results found for "{searchQuery}"</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="p-10 text-center">
                  <p className="text-slate-300 font-bold text-sm">Start typing to search...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={!!modalType} onClose={() => { setModalType(null); }} title={
        modalType === 'add_event' ? 'New Service' : 
        modalType === 'manage_songs' ? 'Event Setlist' : 
        modalType === 'add_member' ? 'Add Worship Team Member' :
        modalType === 'edit_profile' ? 'Dashboard Settings' :
        modalType === 'assign_team' ? `Assign: ${selectedEvent?.name}` : 'Details'
      }>
        {modalType === 'add_event' && (
          <form onSubmit={handleEventSubmit} className="space-y-6">
            {events.length >= EVENT_LIMIT && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 mb-2">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-700">Limit tercapai! Hapus jadwal lama.</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Event Name</label>
              <input disabled={events.length >= EVENT_LIMIT} required type="text" placeholder="e.g. Sunday Celebration" className="w-full px-6 py-4 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold disabled:opacity-50" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Date</label>
                <input disabled={events.length >= EVENT_LIMIT} required type="date" className="w-full px-6 py-4 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold disabled:opacity-50" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Time</label>
                <input disabled={events.length >= EVENT_LIMIT} required type="time" className="w-full px-6 py-4 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold disabled:opacity-50" value={formData.time || ''} onChange={e => setFormData({...formData, time: e.target.value})} />
              </div>
            </div>
            <button disabled={events.length >= EVENT_LIMIT} type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-2xl transition-all disabled:bg-slate-300">Create Schedule</button>
          </form>
        )}

        {modalType === 'add_member' && (
          <form onSubmit={handleMemberSubmit} className="space-y-6">
            {members.length >= MEMBER_LIMIT && (
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 mb-2">
                <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-amber-700">Limit tercapai! Hapus anggota lama.</p>
              </div>
            )}
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Full Name</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                <input disabled={members.length >= MEMBER_LIMIT} required type="text" placeholder="John Doe" className="w-full pl-14 pr-6 py-4 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold disabled:opacity-50" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Primary Roles</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {STANDARD_ROLES.map(role => (
                  <button disabled={members.length >= MEMBER_LIMIT} key={role} type="button" onClick={() => {
                    const current = formData.roles || [];
                    setFormData({...formData, roles: current.includes(role) ? current.filter((r: Role) => r !== role) : [...current, role]});
                  }} className={`px-4 py-3 rounded-xl text-[10px] font-black transition-all border uppercase tracking-wider disabled:opacity-50 ${formData.roles?.includes(role) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-200'}`}>{role}</button>
                ))}
              </div>
            </div>
            <button disabled={members.length >= MEMBER_LIMIT} type="submit" className="w-full bg-indigo-600 text-white font-black py-5 rounded-2xl shadow-xl transition-all disabled:bg-slate-300">Add To Worship Team</button>
          </form>
        )}

        {modalType === 'edit_profile' && (
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Church Name</label>
                <div className="relative">
                  <Church className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input required type="text" className="w-full pl-14 pr-6 py-4 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold" value={formData.churchName || ''} onChange={e => setFormData({...formData, churchName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Admin Name</label>
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input required type="text" className="w-full pl-14 pr-6 py-4 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold" value={formData.adminName || ''} onChange={e => setFormData({...formData, adminName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Dashboard Access Key</label>
                <div className="relative">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input required type="text" placeholder="Change password..." className="w-full pl-14 pr-6 py-4 bg-slate-50 text-slate-900 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-bold" value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
                </div>
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl flex items-center justify-center gap-2">
              <Check size={20} /> Apply Changes
            </button>
            <button type="button" onClick={() => setIsLoggedIn(false)} className="w-full bg-red-50 text-red-600 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 border border-red-100 mt-4">
              <LogOut size={20} /> Lock Session
            </button>
          </form>
        )}

        {modalType === 'assign_team' && (
          <div className="space-y-6">
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
              {STANDARD_ROLES.map(role => {
                const currentAssignment = assignments.find(a => a.eventId === selectedEventId && a.role === role);
                const assignedMemberIds = assignments.filter(a => a.eventId === selectedEventId).map(a => a.memberId);
                return (
                  <div key={role} className="flex items-center justify-between p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{role}</p>
                      <p className="font-bold text-slate-900 text-sm truncate leading-tight">
                        {currentAssignment ? members.find(m => m.id === currentAssignment.memberId)?.name : <span className="text-slate-300">Vacant</span>}
                      </p>
                    </div>
                    <select className="bg-white text-slate-900 border border-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-black outline-none focus:ring-4 focus:ring-indigo-100 max-w-[140px]" value={currentAssignment?.memberId || ''} onChange={(e) => handleAssignMember(role, e.target.value)}>
                      <option value="">- Assign -</option>
                      {members.filter(m => !assignedMemberIds.includes(m.id) || m.id === currentAssignment?.memberId).map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setModalType(null)} className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl">Close & Save</button>
          </div>
        )}

        {modalType === 'manage_songs' && (
          <div className="space-y-8">
            {/* Manual Add Section */}
            <form onSubmit={handleAddSong} className="bg-indigo-50/30 p-6 rounded-[2rem] flex flex-row gap-3 border border-indigo-100/50 items-end">
              <div className="flex-[3]">
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-1">Song Title</label>
                <input required type="text" placeholder="Title..." className="w-full px-5 py-4 bg-white text-slate-900 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-100" value={newSong.title} onChange={e => setNewSong({...newSong, title: e.target.value})} />
              </div>
              <div className="flex-1">
                <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-1">Key</label>
                <input required type="text" placeholder="Key" className="w-full px-3 py-4 bg-white text-slate-900 border border-slate-100 rounded-xl text-sm text-center uppercase font-black outline-none focus:ring-4 focus:ring-indigo-100" value={newSong.key} onChange={e => setNewSong({...newSong, key: e.target.value})} />
              </div>
              <button type="submit" className="bg-indigo-600 text-white p-4 rounded-xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95"><Plus size={20} /></button>
            </form>

            {/* Current Setlist List */}
            <div className="space-y-4">
              <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Current Setlist ({eventSongs.filter(s => s.eventId === selectedEventId).length})</h4>
              {eventSongs.filter(s => s.eventId === selectedEventId).map((s, idx) => (
                <div key={s.id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between p-5 border-b border-slate-50">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 shrink-0">{idx + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-sm leading-tight truncate">{s.title}</p>
                        <p className="text-[9px] text-indigo-600 font-black uppercase tracking-widest mt-1">Key of {s.key}</p>
                      </div>
                    </div>
                    <button onClick={() => setConfirmState({ isOpen: true, title: 'Hapus Lagu?', message: `Hapus "${s.title}"?`, onConfirm: () => setEventSongs(prev => prev.filter((item: any) => item.id !== s.id)) })} className="p-2.5 text-slate-200 hover:text-red-500 bg-slate-50 rounded-xl transition-colors shrink-0 ml-4"><Trash2 size={16} /></button>
                  </div>
                  <div className="p-4 bg-slate-50/50">
                    <input type="text" placeholder="Add notes..." className="w-full px-4 py-3 bg-white text-slate-600 border border-slate-100 rounded-[1.2rem] text-[11px] font-medium outline-none focus:ring-4 focus:ring-indigo-50" value={s.notes || ''} onChange={e => handleUpdateSongNotes(s.id, e.target.value)} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      <aside className={`fixed inset-y-0 left-0 z-[60] flex flex-col transition-all duration-300 ease-in-out bg-white overflow-hidden ${isSidebarOpen ? 'w-72 border-r border-slate-100' : 'w-0 lg:w-20 border-r border-slate-100'}`}>
        <div className={`px-6 py-8 flex items-center justify-between overflow-hidden shrink-0 ${!isSidebarOpen && 'lg:justify-center'}`}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 shrink-0"><Mic2 size={24} /></div>
            {isSidebarOpen && <div className="min-w-0 flex-1 animate-in fade-in slide-in-from-left-2"><h1 className="font-black text-lg text-slate-900 whitespace-nowrap">{profile.churchName}</h1><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">WorshipFlow AI</p></div>}
          </div>
        </div>
        <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto custom-scrollbar">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', key: '1' },
            { id: 'schedule', icon: Calendar, label: 'Schedules', key: '2' },
            { id: 'team', icon: Users, label: 'Worship Team', key: '3' },
          ].map(m => (
            <button key={m.id} onClick={() => { setActiveTab(m.id as AppTab); if(window.innerWidth < 1024) setIsSidebarOpen(false); }} className={`w-full flex items-center gap-4 p-4 rounded-3xl transition-all ${activeTab === m.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50 hover:text-indigo-600'} ${!isSidebarOpen && 'lg:justify-center'} relative group`}>
              <m.icon size={24} strokeWidth={2.5} className="shrink-0" />
              {isSidebarOpen && <span className="font-black text-sm whitespace-nowrap tracking-tight">{m.label}</span>}
              {!isSidebarOpen && isSidebarOpen !== undefined && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-900 text-white text-[10px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">{m.label}</div>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-50">
          <button onClick={() => setIsSearchOpen(true)} className={`w-full flex items-center gap-4 p-4 rounded-3xl text-slate-400 hover:bg-slate-50 hover:text-indigo-600 transition-all ${!isSidebarOpen && 'lg:justify-center'}`}>
            <Search size={24} strokeWidth={2.5} className="shrink-0" />
            {isSidebarOpen && <span className="font-black text-sm whitespace-nowrap tracking-tight italic">Search...</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-20 lg:h-24 bg-white/80 backdrop-blur-2xl border-b border-slate-50 flex items-center justify-between px-6 lg:px-12 shrink-0 z-40">
          <div className="flex items-center gap-5">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-3 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 transition-all flex items-center justify-center">
              {isSidebarOpen ? <PanelLeftClose size={22} /> : <Menu size={22} />}
            </button>
            <div>
              <h2 className="text-xl lg:text-3xl font-black text-slate-900 capitalize mb-1 lg:mb-2">{activeTab}</h2>
              <p className="text-[10px] lg:text-xs text-slate-400 font-bold uppercase tracking-widest leading-none">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSearchOpen(true)} className="hidden md:flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl text-slate-400 hover:bg-slate-200 transition-all border border-slate-200/50">
              <Search size={16} />
              <span className="text-[11px] font-black uppercase tracking-widest">Search (⌘K)</span>
            </button>
            <button onClick={() => { setFormData(profile); setModalType('edit_profile'); }} className="flex items-center gap-3 bg-slate-50 py-1.5 pl-1.5 pr-4 rounded-2xl border border-slate-100 transition-all active:scale-95">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">{adminInitials}</div>
              <p className="text-[10px] font-black text-slate-900 uppercase hidden sm:block">{profile.adminName}</p>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 lg:px-12 py-8 lg:py-12 pb-36 scroll-smooth">
          <div className="max-w-7xl mx-auto space-y-12">
            
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in">
                {[
                  { val: events.length, label: `Schedules (${events.length}/${EVENT_LIMIT})`, icon: Calendar, color: 'bg-indigo-50 text-indigo-600' },
                  { val: members.length, label: `Worship Team (${members.length}/${MEMBER_LIMIT})`, icon: Users, color: 'bg-emerald-50 text-emerald-600' },
                  { val: eventSongs.length, label: 'Songs Total', icon: Music, color: 'bg-amber-50 text-amber-600' },
                ].map((stat, i) => (
                  <div key={i} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                    <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}><stat.icon size={24} strokeWidth={2.5} /></div>
                    <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{stat.val}</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'schedule' && (
              <section className="space-y-10 animate-in fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Service Schedule</h3>
                    <p className="text-slate-400 font-bold text-sm">Managing {sortedEvents.length} / {EVENT_LIMIT} events.</p>
                  </div>
                  <div className="flex gap-3 w-full sm:w-auto">
                    <button onClick={handleShareAllSchedules} className="flex-1 sm:flex-none bg-white py-4 px-6 rounded-2xl border border-slate-200 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all">Share All</button>
                    <button onClick={() => { setFormData({category: 'Sunday Service', date: new Date().toISOString().split('T')[0], time: '09:00'}); setModalType('add_event'); }} className="flex-1 sm:flex-none bg-indigo-600 py-4 px-8 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">+ New Event</button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-10">
                  {sortedEvents.map(ev => {
                    const eventTeam = assignments.filter(a => a.eventId === ev.id);
                    const eventSetlist = eventSongs.filter(s => s.eventId === ev.id);
                    const eventDate = new Date(ev.date);
                    return (
                      <div key={ev.id} className="bg-white rounded-[2.5rem] p-8 lg:p-10 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500">
                        <div className="flex justify-between items-start mb-8">
                          <div className="flex gap-4">
                            <div className="bg-slate-900 text-white px-4 py-5 rounded-2xl flex flex-col items-center justify-center shrink-0">
                              <span className="text-[9px] font-black uppercase tracking-widest leading-none opacity-60 mb-1">{eventDate.toLocaleString('default', { month: 'short' })}</span>
                              <span className="text-xl font-black leading-none">{eventDate.getDate()}</span>
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xl font-black text-slate-900 mb-2 truncate">{ev.name}</h4>
                              <div className="flex flex-wrap gap-2">
                                <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-lg"><Clock size={12}/> {ev.time}</span>
                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest">{ev.category}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => handleShareSchedule(ev)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Share2 size={18}/></button>
                            <button onClick={() => setConfirmState({ isOpen: true, title: 'Hapus Event?', message: 'Data event akan hilang permanen.', onConfirm: () => setEvents(prev => prev.filter((e: any) => e.id !== ev.id)) })} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-8">
                          <div className="space-y-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Setlist ({eventSetlist.length})</p>
                            <div className="space-y-1.5">
                              {eventSetlist.map(s => <p key={s.id} className="text-xs font-bold text-slate-700 truncate">{s.title} <span className="text-indigo-400">({s.key})</span></p>)}
                              {eventSetlist.length === 0 && <p className="text-[10px] italic text-slate-300">Empty setlist</p>}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Team ({eventTeam.length})</p>
                            <div className="flex flex-col gap-1">
                              {eventTeam.map((a, i) => (
                                <p key={i} className="text-[10px] font-bold text-slate-600 flex items-center gap-2">
                                  <span className="text-indigo-500 font-black uppercase text-[8px] w-16">{a.role}:</span>
                                  <span>{members.find(m => m.id === a.memberId)?.name || 'Vacant'}</span>
                                </p>
                              ))}
                              {eventTeam.length === 0 && <p className="text-[10px] italic text-slate-300">No team assigned</p>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-3">
                          <button onClick={() => { setSelectedEventId(ev.id); setModalType('manage_songs'); }} className="flex-1 bg-slate-100 py-4 rounded-2xl text-slate-600 font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2">
                            <Music size={14} /> Setlist
                          </button>
                          <button onClick={() => { setSelectedEventId(ev.id); setModalType('assign_team'); }} className="flex-1 bg-slate-900 py-4 rounded-2xl text-white font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2">
                            <UserPlus size={14} /> Assign
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {activeTab === 'team' && (
              <section className="space-y-10 animate-in fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div>
                    <h3 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">Worship Team</h3>
                    <p className="text-slate-400 font-bold text-sm">Organizing {members.length} / {MEMBER_LIMIT} members.</p>
                  </div>
                  <button onClick={() => { setFormData({roles: [], status: 'active'}); setModalType('add_member'); }} className="w-full sm:w-auto bg-indigo-600 py-4 px-10 rounded-2xl text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all">+ Add Member</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6 lg:gap-8">
                  {members.map(m => (
                    <div key={m.id} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-6 group hover:border-indigo-100 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-lg font-black text-indigo-600 border border-indigo-100">{m.avatar}</div>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-black text-slate-900 truncate text-lg leading-tight">{m.name}</h4>
                            <p className="text-[10px] text-slate-400 font-black mt-1 uppercase tracking-widest">{m.phone}</p>
                          </div>
                        </div>
                        <button onClick={() => setConfirmState({ isOpen: true, title: 'Hapus Member?', message: `Hapus ${m.name}?`, onConfirm: () => setMembers(prev => prev.filter((item: any) => item.id !== m.id)) })} className="p-2 text-slate-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.roles?.map(r => <span key={r} className="px-3 py-1 bg-slate-50 border border-slate-100 text-slate-500 text-[9px] font-black rounded-lg uppercase tracking-widest">{r}</span>)}
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${m.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{m.status}</span>
                        <div className="flex items-center text-slate-300 text-[9px] font-black uppercase tracking-widest gap-1 group-hover:text-indigo-500 transition-colors">Details <ChevronRight size={14} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; } 
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } 
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}