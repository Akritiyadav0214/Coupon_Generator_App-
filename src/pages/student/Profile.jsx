import { useState } from 'react';
import { Lock, Save, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { couponService } from '../../services/couponService';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Controls';
import { extractErrorMessage, formatDate, getInitials } from '../../utils/formatters';

const DEPARTMENTS = [
  'Computer Science',
  'Information Technology',
  'Electronics',
  'Electrical Engineering',
  'Mechanical',
  'Civil Engineering',
  'Biotechnology',
  'Management Studies',
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || 'Computer Science',
    semester: String(user?.semester || 1),
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.name.trim().length < 2) {
      toast.error('Full name must be at least 2 characters.');
      return;
    }

    try {
      setSaving(true);
      const data = await couponService.updateProfile({
        name: form.name.trim(),
        email: form.email.trim(),
        department: form.department,
        semester: Number(form.semester),
      });
      updateUser(data.user);
      toast.success('Profile updated successfully');
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Student Profile</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your personal academic details. Student IDs are locked for verification integrity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Identity Summary Card */}
        <Card className="h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#064E3B] text-2xl font-bold text-white shadow-sm">
              {getInitials(user?.name)}
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>

            <div className="mt-4 w-full space-y-2.5 border-t border-slate-100 pt-4 text-left text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Student ID</span>
                <span className="font-mono-code inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-800">
                  <Lock className="h-3 w-3 text-slate-400" />
                  {user?.studentId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Department</span>
                <span className="font-medium text-slate-800">{user?.department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Semester</span>
                <span className="font-medium text-slate-800">Semester {user?.semester}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Member Since</span>
                <span className="font-medium text-slate-800">{formatDate(user?.createdAt)}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Edit Profile Form */}
        <Card className="lg:col-span-2">
          <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
            <UserCircle className="h-5 w-5 text-[#059669]" />
            <h2 className="font-display text-base font-semibold text-slate-900">
              Update Personal Information
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-900 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Student ID (Read-only)
                </label>
                <input
                  type="text"
                  disabled
                  value={user?.studentId || ''}
                  className="font-mono-code w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Semester</label>
                <select
                  value={form.semester}
                  onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((sem) => (
                    <option key={sem} value={sem}>
                      Semester {sem}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Department
                </label>
                <select
                  value={form.department}
                  onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {!DEPARTMENTS.includes(form.department) && (
                    <option value={form.department}>{form.department}</option>
                  )}
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" loading={saving}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
