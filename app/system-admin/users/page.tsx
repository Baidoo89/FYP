'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { EmptyState, ErrorState, LoadingState } from '../../../components/enterprise-ui';

type Department = { id: number; name: string };
type Faculty = { id: number; name: string };

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
  staffId: string | null;
  department: string | null;
  departmentId: number | null;
  facultyId: number | null;
  currentRank: string | null;
  phone: string | null;
  emailVerified: boolean;
  onboarded: boolean;
  isActive: boolean;
  createdAt: string;
  departmentRef: Department | null;
  faculty: Faculty | null;
  _count: {
    lecturerRequests: number;
    notifications: number;
  };
};

type AccountSegment = 'all' | 'active' | 'inactive' | 'unverified' | 'not-onboarded';

function label(value?: string | null) {
  if (!value) return 'Not available';
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatDate(value?: string | null) {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return new Intl.DateTimeFormat('en-GH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function segmentMatches(user: UserRecord, segment: AccountSegment) {
  if (segment === 'active') return user.isActive;
  if (segment === 'inactive') return !user.isActive;
  if (segment === 'unverified') return !user.emailVerified;
  if (segment === 'not-onboarded') return !user.onboarded;
  return true;
}

function roleTone(role: string) {
  if (role === 'SYSTEM_ADMIN') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (role === 'HR_ADMIN') return 'border-teal-200 bg-teal-50 text-teal-800';
  if (role === 'HOD_DEAN') return 'border-sky-200 bg-sky-50 text-sky-800';
  if (role === 'COMMITTEE_REVIEWER') return 'border-indigo-200 bg-indigo-50 text-indigo-800';
  return 'border-gray-200 bg-gray-50 text-gray-700';
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [ranks, setRanks] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [segment, setSegment] = useState<AccountSegment>('all');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [form, setForm] = useState({
    role: '',
    isActive: true,
    departmentId: '',
    facultyId: '',
    currentRank: '',
    phone: '',
  });

  const selectedUser = users.find((user) => user.id === selectedId) || null;

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const query = search.trim().toLowerCase();
      const searchMatch = !query || [user.name, user.email, user.staffId || '', user.departmentRef?.name || user.department || '', user.faculty?.name || '']
        .some((value) => value.toLowerCase().includes(query));
      const roleMatch = !roleFilter || user.role === roleFilter;
      return searchMatch && roleMatch && segmentMatches(user, segment);
    });
  }, [users, search, roleFilter, segment]);

  const roleSummary = useMemo(() => {
    return roles.map((role) => ({ role, count: users.filter((user) => user.role === role).length }));
  }, [roles, users]);

  async function loadUsers(preferredId?: number | null) {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/system/users', { cache: 'no-store' });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to load users');
      }

      const loadedUsers = (payload.data.users || []) as UserRecord[];
      setUsers(loadedUsers);
      setDepartments(payload.data.departments || []);
      setFaculties(payload.data.faculties || []);
      setRoles(payload.data.roles || []);
      setRanks(payload.data.ranks || []);

      const next = loadedUsers.find((user) => user.id === preferredId) || loadedUsers[0] || null;
      if (next) selectUser(next);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load users');
    } finally {
      setLoading(false);
    }
  }

  function selectUser(user: UserRecord) {
    setSelectedId(user.id);
    setMessage('');
    setForm({
      role: user.role,
      isActive: user.isActive,
      departmentId: user.departmentId ? String(user.departmentId) : '',
      facultyId: user.facultyId ? String(user.facultyId) : '',
      currentRank: user.currentRank || '',
      phone: user.phone || '',
    });
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function saveUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedUser) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/system/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          ...form,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to update user');
      }
      setMessage(`${selectedUser.name}'s account was updated successfully.`);
      await loadUsers(selectedUser.id);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to update user');
    } finally {
      setSaving(false);
    }
  }

  if (loading && users.length === 0) return <LoadingState label="Loading user governance workspace..." />;
  if (error && users.length === 0) return <ErrorState message={error} />;

  const activeUsers = users.filter((user) => user.isActive).length;
  const inactiveUsers = users.length - activeUsers;
  const unverifiedUsers = users.filter((user) => !user.emailVerified).length;
  const notOnboardedUsers = users.filter((user) => !user.onboarded).length;

  return (
    <section className="space-y-6">
      <div className="pro-hero px-6 py-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="pro-eyebrow">System Administration</div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-950 sm:text-4xl">User and Role Management</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
              Govern staff access, role assignments, account activation, academic rank, and institutional structure mapping across every promotion portal.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="/system-admin/dashboard" className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50">Dashboard</a>
            <a href="/audit" className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-800">Audit Logs</a>
          </div>
        </div>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard code="USR" label="Total users" value={users.length} tone="teal" />
        <MetricCard code="ACT" label="Active" value={activeUsers} tone="green" />
        <MetricCard code="INA" label="Inactive" value={inactiveUsers} tone="rose" />
        <MetricCard code="VER" label="Unverified" value={unverifiedUsers} tone="amber" />
        <MetricCard code="ONB" label="Not onboarded" value={notOnboardedUsers} tone="blue" />
      </section>

      {message && <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-sm font-semibold text-teal-800">{message}</div>}
      {error && <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">{error}</div>}

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-6">
          <div className="pro-card p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[1fr_14rem_14rem_auto] lg:items-end">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Search</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} className="brand-input" placeholder="Name, email, staff ID, department" />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Role</span>
                <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)} className="brand-input">
                  <option value="">All roles</option>
                  {roles.map((role) => <option key={role} value={role}>{label(role)}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Segment</span>
                <select value={segment} onChange={(event) => setSegment(event.target.value as AccountSegment)} className="brand-input">
                  <option value="all">All accounts</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="unverified">Unverified email</option>
                  <option value="not-onboarded">Not onboarded</option>
                </select>
              </label>
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
                Showing {filteredUsers.length} of {users.length}
              </div>
            </div>
          </div>

          <div className="pro-card overflow-hidden">
            <div className="flex flex-col justify-between gap-3 border-b border-gray-200 p-5 sm:flex-row sm:items-end">
              <div>
                <h2 className="text-xl font-semibold text-gray-950">Accounts</h2>
                <p className="mt-1 text-sm text-gray-600">Select a user to update access, role, and institutional mapping.</p>
              </div>
              <span className="w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">{filteredUsers.length} records</span>
            </div>

            {filteredUsers.length === 0 ? (
              <div className="p-5"><EmptyState title="No matching accounts" description="Adjust the search, role, or segment filters." /></div>
            ) : (
              <div className="max-h-[72rem] divide-y divide-gray-100 overflow-y-auto">
                {filteredUsers.map((user) => (
                  <button key={user.id} type="button" onClick={() => selectUser(user)} className={`block w-full p-5 text-left transition hover:bg-gray-50 ${selectedId === user.id ? 'bg-teal-50/70' : ''}`}>
                    <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-start">
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-950">{user.name}</p>
                        <p className="mt-1 text-sm text-gray-600">{user.email}</p>
                        <p className="mt-1 text-xs text-gray-500">{user.staffId || 'No staff ID'} | {user.departmentRef?.name || user.department || 'No department'}</p>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${roleTone(user.role)}`}>{label(user.role)}</span>
                        <StateBadge label={user.isActive ? 'Active' : 'Inactive'} tone={user.isActive ? 'green' : 'rose'} />
                        <StateBadge label={user.emailVerified ? 'Verified' : 'Unverified'} tone={user.emailVerified ? 'green' : 'amber'} />
                        <StateBadge label={user.onboarded ? 'Onboarded' : 'Pending onboarding'} tone={user.onboarded ? 'teal' : 'blue'} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <form onSubmit={saveUser} className="pro-card p-5">
            <h2 className="text-xl font-semibold text-gray-950">Selected Account</h2>
            {!selectedUser ? (
              <EmptyState title="No account selected" description="Choose a user account to edit role and access settings." />
            ) : (
              <>
                <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="font-semibold text-gray-950">{selectedUser.name}</p>
                  <p className="mt-1 text-sm text-gray-600">{selectedUser.email}</p>
                  <p className="mt-1 text-xs text-gray-500">Joined {formatDate(selectedUser.createdAt)}</p>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InfoTile label="Applications" value={String(selectedUser._count.lecturerRequests)} />
                  <InfoTile label="Notifications" value={String(selectedUser._count.notifications)} />
                  <InfoTile label="Faculty" value={selectedUser.faculty?.name || 'Unassigned'} />
                  <InfoTile label="Rank" value={label(selectedUser.currentRank)} />
                </div>

                <div className="mt-5 space-y-4">
                  <Field label="Role">
                    <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })} className="brand-input">
                      {roles.map((role) => <option key={role} value={role}>{label(role)}</option>)}
                    </select>
                  </Field>
                  <Field label="Faculty">
                    <select value={form.facultyId} onChange={(event) => setForm({ ...form, facultyId: event.target.value })} className="brand-input">
                      <option value="">No faculty</option>
                      {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Department">
                    <select value={form.departmentId} onChange={(event) => setForm({ ...form, departmentId: event.target.value })} className="brand-input">
                      <option value="">No department</option>
                      {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Current rank">
                    <select value={form.currentRank} onChange={(event) => setForm({ ...form, currentRank: event.target.value })} className="brand-input">
                      <option value="">No rank</option>
                      {ranks.map((rank) => <option key={rank} value={rank}>{label(rank)}</option>)}
                    </select>
                  </Field>
                  <Field label="Phone">
                    <input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} className="brand-input" placeholder="+233 ..." />
                  </Field>
                  <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm font-semibold text-gray-800">
                    <span>Account active</span>
                    <input type="checkbox" checked={form.isActive} onChange={(event) => setForm({ ...form, isActive: event.target.checked })} />
                  </label>
                </div>

                <button type="submit" disabled={saving} className="mt-5 w-full rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300">
                  {saving ? 'Saving account...' : 'Save account changes'}
                </button>
              </>
            )}
          </form>

          <div className="pro-card p-5">
            <h2 className="text-lg font-semibold text-gray-950">Role Summary</h2>
            <div className="mt-4 grid gap-2">
              {roleSummary.map((item) => (
                <div key={item.role} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm">
                  <span className="font-semibold text-gray-700">{label(item.role)}</span>
                  <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${roleTone(item.role)}`}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

function MetricCard({ code, label, value, tone }: { code: string; label: string; value: number; tone: 'teal' | 'green' | 'rose' | 'amber' | 'blue' }) {
  const toneClass = tone === 'green'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
    : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-900'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-900'
        : tone === 'blue'
          ? 'border-sky-200 bg-sky-50 text-sky-900'
          : 'border-teal-200 bg-teal-50 text-teal-900';

  return (
    <div className="pro-tile p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-950">{value}</p>
        </div>
        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-black ${toneClass}`}>{code}</span>
      </div>
    </div>
  );
}

function StateBadge({ label, tone }: { label: string; tone: 'green' | 'rose' | 'amber' | 'teal' | 'blue' }) {
  const toneClass = tone === 'green'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : tone === 'rose'
      ? 'border-rose-200 bg-rose-50 text-rose-800'
      : tone === 'amber'
        ? 'border-amber-200 bg-amber-50 text-amber-800'
        : tone === 'blue'
          ? 'border-sky-200 bg-sky-50 text-sky-800'
          : 'border-teal-200 bg-teal-50 text-teal-800';

  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}>{label}</span>;
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-gray-950">{value}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-gray-800">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}
