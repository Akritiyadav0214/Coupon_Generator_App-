import { useCallback, useEffect, useState } from 'react';
import { Search, Users, Eye, UserCheck, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '../../services/adminService';
import { useDebounce } from '../../hooks/useDebounce';
import { Card, EmptyState, Skeleton } from '../../components/common/Card';
import { Button, Modal, Pagination } from '../../components/common/Controls';
import StatusBadge from '../../components/common/StatusBadge';
import { extractErrorMessage, formatDate, formatDateTime } from '../../utils/formatters';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [department, setDepartment] = useState('ALL');
  const [semester, setSemester] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const [detailModal, setDetailModal] = useState({ open: false, loading: false, data: null });
  const [togglingId, setTogglingId] = useState(null);

  const fetchStudents = useCallback(async () => {
    try {
      const data = await adminService.getStudents({
        search: debouncedSearch || undefined,
        department,
        semester,
        page,
        limit: 10,
      });
      setStudents(data.students || []);
      setDepartments(data.departments || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to load students'));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, department, semester, page]);

  useEffect(() => {
    Promise.resolve().then(fetchStudents);
  }, [fetchStudents]);

  const handleOpenDetail = async (studentId) => {
    try {
      setDetailModal({ open: true, loading: true, data: null });
      const data = await adminService.getStudentDetail(studentId);
      setDetailModal({ open: true, loading: false, data });
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to fetch student details'));
      setDetailModal({ open: false, loading: false, data: null });
    }
  };

  const handleToggleStatus = async (student) => {
    try {
      setTogglingId(student._id);
      const nextActive = !student.isActive;
      await adminService.updateStudentStatus(student._id, nextActive);
      toast.success(`Account ${nextActive ? 'reactivated' : 'deactivated'}`);
      setStudents((prev) =>
        prev.map((s) => (s._id === student._id ? { ...s, isActive: nextActive } : s))
      );
      if (detailModal.data?.student?._id === student._id) {
        setDetailModal((prev) => ({
          ...prev,
          data: {
            ...prev.data,
            student: { ...prev.data.student, isActive: nextActive },
          },
        }));
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Unable to update account status'));
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Student Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Search registered students, inspect coupon activity, and manage account access.
        </p>
      </div>

      <Card padding="p-5">
        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <div className="relative md:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, student ID, or email..."
              className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm text-slate-900 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <select
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#059669] focus:outline-none"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={semester}
            onChange={(e) => {
              setSemester(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#059669] focus:outline-none"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
              <option key={s} value={s}>
                Semester {s}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No students matched"
            description="Try clearing your search query or department/semester filters."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <th className="py-3 pr-4">Student</th>
                    <th className="px-4 py-3">Student ID</th>
                    <th className="px-4 py-3">Department / Sem</th>
                    <th className="px-4 py-3">Coupons</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="py-3 pl-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((s) => (
                    <tr key={s._id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 pr-4">
                        <p className="text-xs font-semibold text-slate-900">{s.name}</p>
                        <p className="text-[11px] text-slate-500">{s.email}</p>
                      </td>
                      <td className="font-mono-code px-4 py-3.5 text-xs font-semibold text-slate-800">
                        {s.studentId}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {s.department} &bull; Sem {s.semester}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-700 tabular-nums">
                        <span className="font-semibold">{s.redeemedCoupons}</span> / {s.totalCoupons}{' '}
                        <span className="text-slate-400">redeemed</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge status={s.isActive ? 'ACTIVE_USER' : 'INACTIVE_USER'} />
                      </td>
                      <td className="py-3.5 pl-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpenDetail(s._id)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Details
                          </Button>
                          <Button
                            variant={s.isActive ? 'danger' : 'primary'}
                            size="sm"
                            loading={togglingId === s._id}
                            onClick={() => handleToggleStatus(s)}
                          >
                            {s.isActive ? (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                Activate
                              </>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              total={pagination.total}
              onPageChange={setPage}
            />
          </>
        )}
      </Card>

      <Modal
        open={detailModal.open}
        onClose={() => setDetailModal({ open: false, loading: false, data: null })}
        title={detailModal.data?.student?.name || 'Student Profile'}
        subtitle={detailModal.data?.student?.studentId}
        maxWidth="max-w-2xl"
      >
        {detailModal.loading ? (
          <div className="space-y-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-40" />
          </div>
        ) : detailModal.data ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-xs sm:grid-cols-3">
              <div>
                <p className="text-slate-400">Email</p>
                <p className="mt-0.5 font-medium text-slate-800">{detailModal.data.student.email}</p>
              </div>
              <div>
                <p className="text-slate-400">Department</p>
                <p className="mt-0.5 font-medium text-slate-800">
                  {detailModal.data.student.department}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Semester</p>
                <p className="mt-0.5 font-medium text-slate-800">
                  Semester {detailModal.data.student.semester}
                </p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Coupon History ({detailModal.data.coupons.length})
              </h4>
              {detailModal.data.coupons.length === 0 ? (
                <p className="text-xs text-slate-500">No coupons generated yet.</p>
              ) : (
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-slate-50 text-slate-500">
                      <tr>
                        <th className="px-3 py-2">Coupon ID</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Generated</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {detailModal.data.coupons.map((c) => (
                        <tr key={c._id}>
                          <td className="font-mono-code px-3 py-2 font-semibold text-slate-800">
                            {c.couponId}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{formatDate(c.couponDate)}</td>
                          <td className="px-3 py-2 text-slate-500">
                            {formatDateTime(c.generatedAt)}
                          </td>
                          <td className="px-3 py-2">
                            <StatusBadge status={c.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
