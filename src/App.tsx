import { SignedIn, SignedOut, SignInButton, UserButton, useUser, useAuth } from "@clerk/clerk-react";
import { useState, useEffect, FormEvent } from "react";
import axios from "axios";
import { Plus, Calendar, Trash2, Wallet, Users, ArrowDownCircle, X, Pencil } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface Expense {
  id?: string;
  name: string;
  amount: number;
}

interface Player {
  id?: string;
  name: string;
  contribution_amount: number;
  has_paid: boolean;
}

interface Session {
  id: string;
  date: string;
  initial_cash: number;
  shuttlecocks_remaining: number;
  expenses: Expense[];
  players: Player[];
  user_id: string;
  user_name?: string;
  user_email?: string;
}

// Helper to format number with thousands separator (.)
const formatCurrency = (val: number | string) => {
  if (val === undefined || val === null || val === "") return "";
  const num = typeof val === "string" ? parseInt(val.replace(/\./g, ""), 10) : val;
  if (isNaN(num)) return "";
  return num.toLocaleString("id-ID");
};

// Helper to parse formatted string back to number
const parseCurrency = (val: string) => {
  const num = parseInt(val.replace(/\./g, ""), 10);
  return isNaN(num) ? 0 : num;
};

function App() {
  const { isLoaded } = useUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setFetching(true);
    try {
      const res = await axios.get(`${API_URL}/sessions`);
      // Sort sessions by date descending (newest first)
      const sortedSessions = res.data.sort((a: Session, b: Session) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setSessions(sortedSessions);
    } catch (err) {
      console.error("Gagal mengambil sesi:", err);
    } finally {
      setFetching(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <div className="glass-card">
          <p>Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  if (fetching && sessions.length === 0) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <div className="glass-card">
          <p>Memuat data laporan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <h1 style={{ color: 'var(--primary)', marginBottom: 0 }}>Badminton Tracker</h1>
          <p style={{ color: 'var(--text-muted)' }}>Pelaporan Bulutangkis Mingguan</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <SignedOut>
            <SignInButton mode="modal">
              <button className="btn btn-primary">Login untuk Mengedit</button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
        </div>
      </header>

      <Dashboard sessions={sessions} onRefresh={fetchSessions} />
    </div>
  );
}

function Dashboard({ sessions, onRefresh }: { sessions: Session[], onRefresh: () => void }) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const { getToken } = useAuth();
  const { user } = useUser();

  const latestSession = sessions[0];
  const latestBalance = latestSession ? (
    latestSession.initial_cash - 
    latestSession.expenses.reduce((a, c) => a + c.amount, 0) + 
    latestSession.players.reduce((a, c) => a + (c.has_paid ? c.contribution_amount : 0), 0)
  ) : 0;

  const averagePlayers = sessions.length > 0 
    ? (sessions.reduce((acc, s) => acc + s.players.length, 0) / sessions.length).toFixed(1)
    : 0;

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus laporan ini?")) return;
    try {
      const token = await getToken();
      await axios.delete(`${API_URL}/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRefresh();
    } catch (err) {
      console.error("Gagal menghapus:", err);
      alert("Gagal menghapus laporan");
    }
  };

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setIsAdding(true);
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingSession(null);
  };

  return (
    <div>
      {!isAdding && (
        <div className="grid" style={{ marginBottom: '3rem', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.2)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--primary)' }}>
              <Wallet size={24} />
            </div>
            <div>
              <p className="stat-label">Saldo Terkini</p>
              <p className="stat-value">Rp {latestBalance.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.2)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--accent)' }}>
              <Users size={24} />
            </div>
            <div>
              <p className="stat-label">Rata-rata Kehadiran</p>
              <p className="stat-value">{averagePlayers} Pemain/Sesi</p>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '0.75rem', borderRadius: '0.75rem', color: 'var(--danger)' }}>
              <Calendar size={24} />
            </div>
            <div>
              <p className="stat-label">Total Sesi</p>
              <p className="stat-value">{sessions.length} Sesi</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>{isAdding ? (editingSession ? 'Edit Laporan' : 'Buat Laporan Baru') : 'Riwayat Sesi'}</h2>
        {!isAdding && user && (
          <button className="btn btn-primary" onClick={() => setIsAdding(true)}>
            <Plus size={20} /> Laporan Baru
          </button>
        )}
      </div>

      {isAdding ? (
        <NewSessionForm
          initialData={editingSession || undefined}
          onCancel={handleCancelForm}
          onSaved={() => { handleCancelForm(); onRefresh(); }}
        />
      ) : (
        <div className="grid">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={() => handleDelete(session.id)}
              onEdit={() => handleEdit(session)}
            />
          ))}
          {sessions.length === 0 && (
            <div className="glass-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
              <p>Belum ada laporan. {user ? 'Buat laporan pertama Anda!' : 'Silakan login untuk membuat laporan.'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SessionCard({ session, onDelete, onEdit }: { session: Session, onDelete: () => void, onEdit: () => void }) {
  const { user } = useUser();
  const expensesTotal = session.expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const incomeTotal = session.players.reduce((acc, curr) => acc + (curr.has_paid ? curr.contribution_amount : 0), 0);
  const sisa = session.initial_cash - expensesTotal;
  const kasAkhir = sisa + incomeTotal;
  const isOwner = user?.id === session.user_id;

  // Format date: "Kamis, 12 Maret 2026"
  const formattedDate = new Date(session.date).toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="glass-card" style={{ padding: '1.5rem', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
          <Calendar size={16} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formattedDate}</span>
        </div>
        {isOwner && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={onEdit}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              title="Edit Sesi"
            >
              <Pencil size={18} />
            </button>
            <button
              onClick={onDelete}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem' }}
              title="Hapus Sesi"
            >
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </div>

      {(session.user_name || session.user_email) && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>
            Oleh: {session.user_name}
          </span>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <StatRow label="Uang Kas Awal" value={`Rp ${session.initial_cash.toLocaleString()}`} />
        <StatRow label="Total Pengeluaran" value={`Rp ${expensesTotal.toLocaleString()}`} color="var(--danger)" />
        <StatRow label="Sisa Kas" value={`Rp ${sisa.toLocaleString()}`} />
        <StatRow label="Total Iuran" value={`Rp ${incomeTotal.toLocaleString()}`} color="var(--accent)" />
        <hr style={{ opacity: 0.1, margin: '0.5rem 0' }} />
        <StatRow label="Saldo Akhir" value={`Rp ${kasAkhir.toLocaleString()}`} weight="700" size="1.25rem" />
      </div>

      <div style={{ marginTop: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.875rem', fontWeight: 600 }}>Pemain ({session.players.length})</p>
          {session.shuttlecocks_remaining !== null && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Sisa Kok: {session.shuttlecocks_remaining}</span>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {session.players.map((p) => (
            <span key={p.id} className={`badge ${p.has_paid ? 'badge-paid' : 'badge-unpaid'}`} title={p.has_paid ? 'Sudah Bayar' : 'Belum Bayar'}>
              {p.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatRowProps {
  label: string;
  value: string;
  color?: string;
  weight?: string;
  size?: string;
}

function StatRow({ label, value, color, weight, size }: StatRowProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="stat-label">{label}</span>
      <span style={{ color: color || 'white', fontWeight: weight || 600, fontSize: size || '1rem' }}>{value}</span>
    </div>
  );
}

function NewSessionForm({ initialData, onCancel, onSaved }: { initialData?: Session, onCancel: () => void, onSaved: () => void }) {
  const { getToken } = useAuth();
  const { user } = useUser();
  const [date, setDate] = useState(initialData ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]);
  const [cash, setCash] = useState(initialData ? initialData.initial_cash : 0);
  const [shuttlecocks, setShuttlecocks] = useState(initialData ? initialData.shuttlecocks_remaining : 8);
  const [expenseList, setExpenseList] = useState<Omit<Expense, 'id'>[]>(initialData ? initialData.expenses : []);
  const [playerList, setPlayerList] = useState<Omit<Player, 'id'>[]>(initialData ? initialData.players : []);
  const [submitting, setSubmitting] = useState(false);

  // Temp form fields
  const [newExpName, setNewExpName] = useState("");
  const [newExpAmount, setNewExpAmount] = useState(0);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerAmount, setNewPlayerAmount] = useState(20000);
  const [newPlayerPaid, setNewPlayerPaid] = useState(true);

  const addExpense = () => {
    if (newExpName && newExpAmount > 0) {
      setExpenseList([...expenseList, { name: newExpName, amount: newExpAmount }]);
      setNewExpName("");
      setNewExpAmount(0);
    }
  };

  const removeExpense = (index: number) => {
    setExpenseList(expenseList.filter((_, i) => i !== index));
  };

  const addPlayer = () => {
    if (newPlayerName) {
      setPlayerList([...playerList, {
        name: newPlayerName,
        contribution_amount: newPlayerAmount,
        has_paid: newPlayerPaid
      }]);
      setNewPlayerName("");
    }
  };

  const removePlayer = (index: number) => {
    setPlayerList(playerList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = await getToken();
      const payload = {
        date,
        initial_cash: cash,
        shuttlecocks_remaining: shuttlecocks,
        expenses: expenseList,
        players: playerList,
        user_name: user?.fullName || user?.username || user?.firstName,
        user_email: user?.primaryEmailAddress?.emailAddress
      };

      if (initialData) {
        await axios.put(`${API_URL}/sessions/${initialData.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/sessions`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      onSaved();
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      alert(`Gagal ${initialData ? 'memperbarui' : 'menyimpan'} laporan`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="glass-card">
      <form onSubmit={handleSubmit}>
        <div className="grid">
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Tanggal Sesi</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Saldo Awal Kas (Rp)</label>
            <input
              type="text"
              value={formatCurrency(cash)}
              onChange={(e) => setCash(parseCurrency(e.target.value))}
              required
              placeholder="Contoh: 50.000"
            />
          </div>
          <div>
            <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Sisa Kok (Biji)</label>
            <input type="number" value={shuttlecocks} onChange={(e) => setShuttlecocks(Number(e.target.value))} />
          </div>
        </div>

        <div className="grid" style={{ marginTop: '2rem' }}>
          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <ArrowDownCircle size={18} color="var(--danger)" /> Pengeluaran
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input type="text" placeholder="Nama barang (misal: Kok, Sewa Lapangan)" value={newExpName} onChange={(e) => setNewExpName(e.target.value)} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Nominal Rp"
                  value={formatCurrency(newExpAmount)}
                  onChange={(e) => setNewExpAmount(parseCurrency(e.target.value))}
                />
                <button type="button" className="btn btn-primary" onClick={addExpense} style={{ padding: '0 1rem' }}><Plus size={20} /></button>
              </div>
            </div>
            <ul style={{ listStyle: 'none' }}>
              {expenseList.map((exp, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{exp.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rp {exp.amount.toLocaleString()}</p>
                  </div>
                  <button type="button" onClick={() => removeExpense(i)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Users size={18} color="var(--accent)" /> Daftar Pemain
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <input type="text" placeholder="Nama Pemain" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Iuran Rp"
                  value={formatCurrency(newPlayerAmount)}
                  onChange={(e) => setNewPlayerAmount(parseCurrency(e.target.value))}
                />
                <button
                  type="button"
                  onClick={() => setNewPlayerPaid(!newPlayerPaid)}
                  className={`btn ${newPlayerPaid ? 'badge-paid' : 'badge-unpaid'}`}
                  style={{ whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                >
                  {newPlayerPaid ? 'Lunas' : 'Belum'}
                </button>
                <button type="button" className="btn btn-primary" onClick={addPlayer} style={{ padding: '0 1rem' }}><Plus size={20} /></button>
              </div>
            </div>
            <ul style={{ listStyle: 'none' }}>
              {playerList.map((p, i) => (
                <li key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem', marginBottom: '0.5rem' }}>
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Rp {p.contribution_amount.toLocaleString()} • {p.has_paid ? 'Lunas' : 'Belum Bayar'}</p>
                  </div>
                  <button type="button" onClick={() => removePlayer(i)} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '3rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn" style={{ background: '#334155' }} onClick={onCancel} disabled={submitting}>Batal</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Menyimpan...' : (initialData ? 'Update Laporan' : 'Simpan Laporan')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default App;
