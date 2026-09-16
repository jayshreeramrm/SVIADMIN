import React, { useState, useEffect } from 'react';
import { 
  auth, 
  db, 
  OperationType, 
  handleFirestoreError 
} from '../lib/firebase';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  updateDoc, 
  deleteDoc, 
  doc, 
  limit 
} from 'firebase/firestore';
import { 
  Lead, 
  CareerApplication, 
  InternshipApplication, 
  PageVisitLog 
} from '../types';
import { 
  LayoutDashboard, 
  Mail, 
  Briefcase, 
  GraduationCap, 
  Activity, 
  LogOut, 
  Download, 
  Search, 
  CheckCircle, 
  Trash2, 
  TrendingUp, 
  UserCheck, 
  ExternalLink,
  Lock,
  ArrowUpDown,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

// List of authorized administrator emails
const AUTHORIZED_ADMINS = [
  'rkmishraratnesh@gmail.com',
  'ratnesh2282@gmail.com',
  'info@statvioninfotech.in'
];

export default function Admin() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Dashboard Metrics & Data State
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'careers' | 'internships' | 'logs'>('overview');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [careers, setCareers] = useState<CareerApplication[]>([]);
  const [internships, setInternships] = useState<InternshipApplication[]>([]);
  const [visits, setVisits] = useState<PageVisitLog[]>([]);
  const [fetchingData, setFetchingData] = useState(false);
  
  // Filtering & Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Monitor Authentication State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        if (AUTHORIZED_ADMINS.includes(currentUser.email || '')) {
          setUser(currentUser);
          setAuthError(null);
        } else {
          setAuthError('Unauthorized: Your email does not have admin privileges.');
          signOut(auth);
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch all collections from Firestore on Login or Tab change
  const fetchAllData = async () => {
    if (!user) return;
    setFetchingData(true);
    try {
      // 1. Fetch Leads
      const leadsSnap = await getDocs(query(collection(db, 'leads'), orderBy('timestamp', 'desc')));
      const leadsList = leadsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      setLeads(leadsList);

      // 2. Fetch Careers
      const careersSnap = await getDocs(query(collection(db, 'career_applications'), orderBy('timestamp', 'desc')));
      const careersList = careersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CareerApplication));
      setCareers(careersList);

      // 3. Fetch Internships
      const internshipsSnap = await getDocs(query(collection(db, 'internship_applications'), orderBy('timestamp', 'desc')));
      const internshipsList = internshipsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as InternshipApplication));
      setInternships(internshipsList);

      // 4. Fetch Visitor Analytics Logs (Limit to last 500 for performance)
      const visitsSnap = await getDocs(query(collection(db, 'page_visits'), orderBy('timestamp', 'desc'), limit(500)));
      const visitsList = visitsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as PageVisitLog));
      setVisits(visitsList);

    } catch (err) {
      console.error('Error fetching database collections:', err);
    } finally {
      setFetchingData(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  // Google Provider Authentication Trigger
  const handleGoogleSignIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      const result = await signInWithPopup(auth, provider);
      const email = result.user.email || '';
      if (!AUTHORIZED_ADMINS.includes(email)) {
        setAuthError(`Access Denied: ${email} is not in the authorized administrator whitelist.`);
        await signOut(auth);
        setUser(null);
      } else {
        setUser(result.user);
        setAuthError(null);
      }
    } catch (err: any) {
      setAuthError(err.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    setLeads([]);
    setCareers([]);
    setInternships([]);
    setVisits([]);
  };

  // Helper: Format Firestore Timestamp safely
  const formatTimestamp = (ts: any) => {
    if (!ts) return 'N/A';
    if (typeof ts.toDate === 'function') {
      return ts.toDate().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    }
    if (ts.seconds) {
      return new Date(ts.seconds * 1000).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    }
    return new Date(ts).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  };

  // Actions: Update Lead Contacted Status
  const toggleLeadStatus = async (leadId: string, currentStatus?: string) => {
    try {
      const newStatus = currentStatus === 'contacted' ? 'pending' : 'contacted';
      const leadRef = doc(db, 'leads', leadId);
      await updateDoc(leadRef, { status: newStatus });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `leads/${leadId}`);
    }
  };

  // Actions: Update Career Application Status
  const updateCareerStatus = async (appId: string, newStatus: any) => {
    try {
      const appRef = doc(db, 'career_applications', appId);
      await updateDoc(appRef, { status: newStatus });
      setCareers(prev => prev.map(c => c.id === appId ? { ...c, status: newStatus } : c));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `career_applications/${appId}`);
    }
  };

  // Actions: Update Internship Application Status
  const updateInternshipStatus = async (appId: string, newStatus: any) => {
    try {
      const appRef = doc(db, 'internship_applications', appId);
      await updateDoc(appRef, { status: newStatus });
      setInternships(prev => prev.map(i => i.id === appId ? { ...i, status: newStatus } : i));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `internship_applications/${appId}`);
    }
  };

  // Actions: Delete records securely with confirmation
  const handleDeleteRecord = async (collectionName: string, id: string) => {
    if (!window.confirm('Are you absolutely sure you want to delete this response record? This action cannot be undone.')) {
      return;
    }
    try {
      await deleteDoc(doc(db, collectionName, id));
      if (collectionName === 'leads') {
        setLeads(prev => prev.filter(item => item.id !== id));
      } else if (collectionName === 'career_applications') {
        setCareers(prev => prev.filter(item => item.id !== id));
      } else if (collectionName === 'internship_applications') {
        setInternships(prev => prev.filter(item => item.id !== id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${collectionName}/${id}`);
    }
  };

  // Helper: Export current active table to CSV
  const exportToCSV = (type: 'leads' | 'careers' | 'internships') => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = '';

    if (type === 'leads') {
      headers = ['ID', 'Name', 'Email', 'Phone', 'Company', 'Subject', 'Message', 'Timestamp', 'Status'];
      rows = leads.map(l => [
        l.id,
        l.name,
        l.email,
        l.phone || '',
        l.company || '',
        l.subject || '',
        l.message.replace(/"/g, '""'),
        formatTimestamp(l.timestamp),
        l.status || 'pending'
      ]);
      filename = 'leads_export.csv';
    } else if (type === 'careers') {
      headers = ['ID', 'Name', 'Email', 'Phone', 'Experience', 'Role', 'Resume URL', 'Timestamp', 'Status'];
      rows = careers.map(c => [
        c.id,
        c.name,
        c.email,
        c.phone,
        c.experience,
        c.role,
        c.resumeUrl || '',
        formatTimestamp(c.timestamp),
        c.status
      ]);
      filename = 'careers_applications_export.csv';
    } else if (type === 'internships') {
      headers = ['ID', 'Name', 'Email', 'Phone', 'College', 'Stream', 'Year', 'Duration', 'Timestamp', 'Status'];
      rows = internships.map(i => [
        i.id,
        i.name,
        i.email,
        i.phone,
        i.college,
        i.stream,
        i.year,
        i.duration,
        formatTimestamp(i.timestamp),
        i.status
      ]);
      filename = 'internship_applications_export.csv';
    }

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map((val: any) => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compute analytics data for Recharts (aggregating page visits by day)
  const getVisitorChartData = () => {
    const visitsByDay: Record<string, number> = {};
    visits.forEach(v => {
      let dateStr = '';
      if (v.timestamp) {
        const d = typeof v.timestamp.toDate === 'function' ? v.timestamp.toDate() : new Date(v.timestamp.seconds * 1000 || v.timestamp);
        dateStr = d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        visitsByDay[dateStr] = (visitsByDay[dateStr] || 0) + 1;
      }
    });

    return Object.keys(visitsByDay).reverse().slice(0, 10).map(key => ({
      date: key,
      visits: visitsByDay[key]
    }));
  };

  // Filtering Logic
  const filteredLeads = leads.filter(l => 
    (l.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     l.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (l.message && l.message.toLowerCase().includes(searchTerm.toLowerCase()))) &&
    (statusFilter === 'all' ? true : (statusFilter === 'contacted' ? l.status === 'contacted' : !l.status || l.status === 'pending'))
  );

  const filteredCareers = careers.filter(c => 
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     c.role.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' ? true : c.status === statusFilter)
  );

  const filteredInternships = internships.filter(i => 
    (i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
     i.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     i.college.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (statusFilter === 'all' ? true : i.status === statusFilter)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="relative w-20 h-20 mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-slate-700 animate-pulse" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-sky-500 animate-spin" />
        </div>
        <p className="text-slate-400 font-medium tracking-wide">Authenticating Admin Workspace...</p>
      </div>
    );
  }

  // LOGIN PAGE
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Decorative Grid Lines */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
        
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400 mb-4 shadow-inner">
              <Lock className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Statvion Admin Portal</h1>
            <p className="text-slate-400 text-sm mt-2 max-w-xs">Access restricted to authorized technology administrators only.</p>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-lg text-center leading-relaxed">
              {authError}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 bg-slate-800 hover:bg-slate-750 active:scale-[0.98] transition-all border border-slate-700 rounded-xl text-sm font-semibold text-white shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.7 14.93 1 12 1 7.37 1 3.4 3.63 1.45 7.45l3.79 2.93c.94-2.81 3.56-5.34 6.76-5.34z"/>
              <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.51h6.46c-.29 1.48-1.14 2.73-2.42 3.57l3.74 2.9c2.19-2.02 3.71-5 3.71-8.62z"/>
              <path fill="#FBBC05" d="M5.24 14.38c-.24-.72-.38-1.5-.38-2.38s.14-1.66.38-2.38L1.45 6.69C.52 8.48 0 10.18 0 12s.52 3.52 1.45 5.31l3.79-2.93z"/>
              <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.74-2.9c-1.12.75-2.55 1.21-4.22 1.21-3.2 0-5.82-2.53-6.76-5.34L1.45 16.1c1.95 3.82 5.92 6.9 10.55 6.9z"/>
            </svg>
            Sign in with Google Admin
          </button>
        </div>
      </div>
    );
  }

  // ADMIN PORTAL LAYOUT
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center justify-center text-sky-400">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight leading-none">Statvion IT</h2>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mt-1">Admin Panel</span>
            </div>
          </div>
        </div>

        <nav className="flex-grow p-4 space-y-1.5">
          <button
            onClick={() => { setActiveTab('overview'); setSearchTerm(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-sky-500/10 border border-sky-500/25 text-sky-400' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" />
            Overview Dashboard
          </button>
          
          <button
            onClick={() => { setActiveTab('leads'); setSearchTerm(''); setStatusFilter('all'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'leads' ? 'bg-sky-500/10 border border-sky-500/25 text-sky-400' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}`}
          >
            <Mail className="w-4.5 h-4.5" />
            Contact Leads
            {leads.filter(l => !l.status || l.status === 'pending').length > 0 && (
              <span className="ml-auto bg-sky-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {leads.filter(l => !l.status || l.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('careers'); setSearchTerm(''); setStatusFilter('all'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'careers' ? 'bg-sky-500/10 border border-sky-500/25 text-sky-400' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}`}
          >
            <Briefcase className="w-4.5 h-4.5" />
            Career Candidates
            {careers.filter(c => c.status === 'pending').length > 0 && (
              <span className="ml-auto bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {careers.filter(c => c.status === 'pending').length}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab('internships'); setSearchTerm(''); setStatusFilter('all'); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'internships' ? 'bg-sky-500/10 border border-sky-500/25 text-sky-400' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}`}
          >
            <GraduationCap className="w-4.5 h-4.5" />
            Intern Applicants
          </button>

          <button
            onClick={() => { setActiveTab('logs'); setSearchTerm(''); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'logs' ? 'bg-sky-500/10 border border-sky-500/25 text-sky-400' : 'text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent'}`}
          >
            <Activity className="w-4.5 h-4.5" />
            Visitor Audit Logs
          </button>
        </nav>

        {/* LOGGED IN USER SECTION */}
        <div className="p-4 border-t border-slate-800 mt-auto">
          <div className="flex items-center gap-3 p-2 bg-slate-800/40 rounded-xl mb-3 overflow-hidden">
            <img 
              src={user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'} 
              alt={user.displayName || 'Admin'} 
              className="w-9 h-9 rounded-full border border-slate-700 shrink-0"
            />
            <div className="min-w-0 flex-grow">
              <span className="text-xs font-bold text-white block truncate leading-tight">{user.displayName}</span>
              <span className="text-[10px] text-slate-500 block truncate mt-0.5">{user.email}</span>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 text-rose-400 hover:text-rose-350 transition-all rounded-xl text-xs font-semibold"
          >
            <LogOut className="w-3.5 h-3.5" />
            Disconnect Admin
          </button>
        </div>
      </aside>

      {/* CORE WORKSPACE SCREEN */}
      <main className="flex-grow p-6 md:p-8 overflow-x-hidden">
        
        {/* HEADER BAR */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight capitalize">{activeTab} Manager</h1>
            <p className="text-slate-400 text-xs mt-1">Live synchronized cloud telemetry across all Statvion websites.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {fetchingData && (
              <span className="text-xs text-sky-400 bg-sky-500/10 border border-sky-500/20 py-1.5 px-3 rounded-lg flex items-center gap-2 font-medium">
                <span className="w-1.5 h-1.5 bg-sky-500 rounded-full animate-ping" />
                Syncing Database...
              </span>
            )}
            <button
              onClick={fetchAllData}
              disabled={fetchingData}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 active:scale-95 text-slate-300 rounded-lg text-xs font-semibold tracking-wide transition-all"
            >
              Force Sync
            </button>
          </div>
        </header>

        {/* METRICS DASHBOARD (TAB 1: OVERVIEW) */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Quick Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Leads</span>
                  <div className="p-2 bg-sky-500/10 rounded-lg text-sky-400">
                    <Mail className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{leads.length}</div>
                <div className="text-[10px] text-sky-400 font-semibold mt-2 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 inline" /> 
                  {leads.filter(l => l.status === 'contacted').length} processed successfully
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Careers Inbox</span>
                  <div className="p-2 bg-amber-500/10 rounded-lg text-amber-400">
                    <Briefcase className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{careers.length}</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-2">
                  <span className="text-amber-500 font-bold">{careers.filter(c => c.status === 'pending').length} pending</span> review
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Intern Registrations</span>
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{internships.length}</div>
                <div className="text-[10px] text-slate-400 font-semibold mt-2">
                  <span className="text-emerald-500 font-bold">{internships.filter(i => i.status === 'reviewed').length} reviewed</span> total
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Traffic (Page Visits)</span>
                  <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                    <Activity className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-white">{visits.length}</div>
                <div className="text-[10px] text-purple-400 font-semibold mt-2">
                  Live hit audit streams
                </div>
              </div>
            </div>

            {/* CHART VIEW */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sky-500" />
                Audited Page Visit Volume (Daily Aggregation)
              </h3>
              <div className="h-80 w-full">
                {visits.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={getVisitorChartData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                      <YAxis stroke="#94a3b8" fontSize={11} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#fff' }} />
                      <Legend />
                      <Line type="monotone" dataKey="visits" stroke="#0ea5e9" strokeWidth={3} activeDot={{ r: 8 }} name="Direct Hits" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-500 text-sm">No visitor logs found to render graph.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: LEADS CONTROLS */}
        {activeTab === 'leads' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            
            {/* Filters Bar */}
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search leads by name, email or message..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="contacted">Contacted</option>
                </select>
              </div>

              <button
                onClick={() => exportToCSV('leads')}
                className="flex items-center gap-2 py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold tracking-wide transition-all active:scale-95 shrink-0"
              >
                <Download className="w-4.5 h-4.5" />
                Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-4 px-6">Candidate</th>
                    <th className="py-4 px-6">Company / Subject</th>
                    <th className="py-4 px-6">Message</th>
                    <th className="py-4 px-6">Submitted At</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredLeads.length > 0 ? (
                    filteredLeads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-slate-800/20 transition-all">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white">{lead.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{lead.email}</div>
                          {lead.phone && <div className="text-[10px] text-slate-500 mt-0.5">{lead.phone}</div>}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-sky-400">{lead.company || 'N/A'}</div>
                          <div className="text-xs text-slate-400 mt-1 line-clamp-1">{lead.subject || 'No Subject'}</div>
                        </td>
                        <td className="py-4 px-6 max-w-xs">
                          <div className="text-xs text-slate-300 line-clamp-2 leading-relaxed" title={lead.message}>
                            {lead.message}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">
                          {formatTimestamp(lead.timestamp)}
                        </td>
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => toggleLeadStatus(lead.id, lead.status)}
                              className={`p-2 rounded-lg border transition-all ${lead.status === 'contacted' ? 'bg-sky-500/10 border-sky-500/20 text-sky-400 hover:bg-slate-800' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}
                              title={lead.status === 'contacted' ? 'Mark as Pending' : 'Mark as Contacted'}
                            >
                              <CheckCircle className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRecord('leads', lead.id)}
                              className="p-2 bg-slate-800 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                              title="Delete Record"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">No contact inquiries matches the current criteria.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CAREERS CONTROLS */}
        {activeTab === 'careers' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            
            {/* Filters Bar */}
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search candidate by name, email or target role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
                >
                  <option value="all">All Candidate Statuses</option>
                  <option value="pending">Pending Review</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="interview">Interview Scheduled</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <button
                onClick={() => exportToCSV('careers')}
                className="flex items-center gap-2 py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold tracking-wide transition-all active:scale-95 shrink-0"
              >
                <Download className="w-4.5 h-4.5" />
                Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-4 px-6">Candidate Details</th>
                    <th className="py-4 px-6">Target Role</th>
                    <th className="py-4 px-6">Experience level</th>
                    <th className="py-4 px-6">Resume Link</th>
                    <th className="py-4 px-6">Status Update</th>
                    <th className="py-4 px-6 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredCareers.length > 0 ? (
                    filteredCareers.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-slate-800/20 transition-all">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white">{candidate.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{candidate.email}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{candidate.phone}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-sky-400">{candidate.role}</div>
                          <div className="text-[10px] text-slate-500 mt-1">{formatTimestamp(candidate.timestamp)}</div>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-300">
                          {candidate.experience} Years
                        </td>
                        <td className="py-4 px-6">
                          {candidate.resumeUrl ? (
                            <a 
                              href={candidate.resumeUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sky-400 hover:text-sky-350 flex items-center gap-1.5 text-xs font-bold"
                            >
                              Open Resume <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          ) : (
                            <span className="text-slate-500 text-xs">No resume uploaded</span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={candidate.status}
                            onChange={(e) => updateCareerStatus(candidate.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
                          >
                            <option value="pending">⏳ Pending Review</option>
                            <option value="reviewed">📝 Reviewed</option>
                            <option value="interview">📅 Interview</option>
                            <option value="offered">🎉 Offered</option>
                            <option value="rejected">❌ Rejected</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteRecord('career_applications', candidate.id)}
                            className="p-2 bg-slate-800 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                            title="Delete Candidate Profile"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">No candidates found matching the query.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: INTERNSHIPS CONTROLS */}
        {activeTab === 'internships' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            
            {/* Filters Bar */}
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xl">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search by college, stream or name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-300 focus:outline-none focus:border-sky-500"
                >
                  <option value="all">All Internship Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="interview">Interview</option>
                  <option value="offered">Offered</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <button
                onClick={() => exportToCSV('internships')}
                className="flex items-center gap-2 py-2 px-4 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-semibold tracking-wide transition-all active:scale-95 shrink-0"
              >
                <Download className="w-4.5 h-4.5" />
                Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-4 px-6">Applicant Details</th>
                    <th className="py-4 px-6">College / Year</th>
                    <th className="py-4 px-6">Stream</th>
                    <th className="py-4 px-6">Duration</th>
                    <th className="py-4 px-6">Status Update</th>
                    <th className="py-4 px-6 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {filteredInternships.length > 0 ? (
                    filteredInternships.map((intern) => (
                      <tr key={intern.id} className="hover:bg-slate-800/20 transition-all">
                        <td className="py-4 px-6">
                          <div className="font-bold text-white">{intern.name}</div>
                          <div className="text-xs text-slate-400 mt-1">{intern.email}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">{intern.phone}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-semibold text-white">{intern.college}</div>
                          <div className="text-xs text-slate-400 mt-1">Year: {intern.year}</div>
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-300">
                          {intern.stream}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">
                          {intern.duration} Months
                          <div className="text-[9px] text-slate-500 mt-1">{formatTimestamp(intern.timestamp)}</div>
                        </td>
                        <td className="py-4 px-6">
                          <select
                            value={intern.status}
                            onChange={(e) => updateInternshipStatus(intern.id, e.target.value)}
                            className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-sky-500"
                          >
                            <option value="pending">⏳ Pending</option>
                            <option value="reviewed">📝 Reviewed</option>
                            <option value="interview">📅 Interview</option>
                            <option value="offered">🎉 Offered</option>
                            <option value="rejected">❌ Rejected</option>
                          </select>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteRecord('internship_applications', intern.id)}
                            className="p-2 bg-slate-800 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/20 text-slate-400 hover:text-rose-400 rounded-lg transition-all"
                            title="Delete Intern Profile"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 text-sm">No internship applicants found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: VISITOR LOGS AUDIT */}
        {activeTab === 'logs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            
            <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/20">
              <div>
                <h3 className="font-bold text-white leading-none">Security Access Logs</h3>
                <p className="text-[10px] text-slate-500 mt-1.5">Historical web analytics of page visit triggers.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/60 text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-800">
                    <th className="py-4 px-6">Logged IP</th>
                    <th className="py-4 px-6">Page / Target URL</th>
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">User Agent Metadata</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm font-mono text-slate-300">
                  {visits.length > 0 ? (
                    visits.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/10 transition-all">
                        <td className="py-4 px-6 text-xs text-sky-400">
                          {log.ip || 'Local / Node Client'}
                        </td>
                        <td className="py-4 px-6 font-bold text-xs">
                          {log.path}
                        </td>
                        <td className="py-4 px-6 text-xs text-slate-400 whitespace-nowrap">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="py-4 px-6 text-[10px] text-slate-500 max-w-xs truncate" title={log.userAgent}>
                          {log.userAgent || 'system_service'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-12 text-center text-slate-500 text-sm font-sans">No security access logs captured yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
