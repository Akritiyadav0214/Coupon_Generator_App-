import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coffee,
  Info,
  Moon,
  Sparkles,
  Sun,
  UtensilsCrossed,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { menuService } from '../../services/menuService';
import { Card, EmptyState, Skeleton } from '../../components/common/Card';
import { Button } from '../../components/common/Controls';
import { extractErrorMessage, formatDate, getTodayISO } from '../../utils/formatters';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MEAL_META = {
  Breakfast: {
    icon: Coffee,
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    ring: 'border-amber-300 ring-1 ring-amber-500/20',
  },
  Lunch: {
    icon: Sun,
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    ring: 'border-emerald-300 ring-1 ring-emerald-500/20',
  },
  Snacks: {
    icon: UtensilsCrossed,
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
    ring: 'border-sky-300 ring-1 ring-sky-500/20',
  },
  Dinner: {
    icon: Moon,
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    ring: 'border-indigo-300 ring-1 ring-indigo-500/20',
  },
};

function shiftDateISO(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + deltaDays);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function getDateForWeekdayInCurrentCycle(baseISO, targetWeekday) {
  const [y, m, d] = baseISO.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const currentJsDay = dt.getDay(); // 0=Sun..6=Sat
  const currentMonIdx = currentJsDay === 0 ? 6 : currentJsDay - 1;
  const targetMonIdx = WEEKDAYS.indexOf(targetWeekday);
  if (targetMonIdx === -1) return baseISO;
  return shiftDateISO(baseISO, targetMonIdx - currentMonIdx);
}

function getActiveMealForToday() {
  const now = new Date();
  const hhmm = now.getHours() * 60 + now.getMinutes();
  if (hhmm < 10 * 60) return 'Breakfast';
  if (hhmm < 15 * 60) return 'Lunch';
  if (hhmm < 18 * 60 + 30) return 'Snacks';
  return 'Dinner';
}

export default function StudentMenu() {
  const todayISO = getTodayISO();
  const [selectedDate, setSelectedDate] = useState(todayISO);
  const [menuData, setMenuData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMenus = useCallback(async () => {
    try {
      const data = await menuService.getStudentMenu(selectedDate);
      setMenuData(data);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to fetch mess menu'));
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    Promise.resolve().then(fetchMenus);
  }, [fetchMenus]);

  const changeDate = (nextDate) => {
    if (!nextDate || nextDate === selectedDate) return;
    setLoading(true);
    setSelectedDate(nextDate);
  };

  const menus = menuData?.menus || [];
  const dayOfWeek = menuData?.dayOfWeek || '';
  const hostelInfo = menuData?.hostelInfo;
  const isViewingToday = selectedDate === todayISO;
  const highlightedMeal = useMemo(
    () => (isViewingToday ? getActiveMealForToday() : 'Lunch'),
    [isViewingToday]
  );

  const hasAnyPublished = menus.some((m) => m.isPublished !== false);

  return (
    <div className="space-y-6">
      {/* Header + Date Controls */}
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-[#064E3B] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-100">
              {hostelInfo?.hostelName || "ABES Boys' Hostel"}
            </span>
            {dayOfWeek && (
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-[#059669]">
                {dayOfWeek}
              </span>
            )}
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-slate-900">
            Weekly Hostel Mess Menu
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Showing menu for <strong className="text-slate-700">{formatDate(selectedDate)}</strong>
            {hostelInfo?.caterer && ` • ${hostelInfo.caterer}`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => changeDate(shiftDateISO(selectedDate, -1))}
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="relative flex items-center">
            <Calendar className="pointer-events-none absolute left-3 h-4 w-4 text-slate-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => changeDate(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-800 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => changeDate(shiftDateISO(selectedDate, 1))}
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isViewingToday && (
            <Button variant="primary" size="sm" onClick={() => changeDate(todayISO)}>
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Quick Monday–Sunday Weekday Switcher */}
      <Card padding="p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {WEEKDAYS.map((day) => {
            const targetDate = getDateForWeekdayInCurrentCycle(todayISO, day);
            const active = dayOfWeek === day;
            const isTodayWeekday = targetDate === todayISO;
            return (
              <button
                key={day}
                type="button"
                onClick={() => changeDate(targetDate)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-[#059669] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="sm:hidden">{day.slice(0, 3)}</span>
                <span className="hidden sm:inline">{day}</span>
                {isTodayWeekday && (
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      active ? 'bg-white' : 'bg-[#059669]'
                    }`}
                    title="Today"
                  />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Meal Cards */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : menus.length === 0 || !hasAnyPublished ? (
        <Card>
          <EmptyState
            icon={UtensilsCrossed}
            title={`No menu published for ${dayOfWeek || formatDate(selectedDate)}`}
            description="The mess administrator has not published meal details for this weekday yet."
            action={
              !isViewingToday ? (
                <Button variant="secondary" size="sm" onClick={() => changeDate(todayISO)}>
                  Back to Today&apos;s Menu
                </Button>
              ) : null
            }
          />
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {menus.map((menu) => {
            const meta = MEAL_META[menu.mealType] || MEAL_META.Lunch;
            const MealIcon = meta.icon;
            const isPublished = menu.isPublished !== false;
            const isHighlighted = isViewingToday && menu.mealType === highlightedMeal && isPublished;
            const isLunch = menu.mealType === 'Lunch';

            return (
              <Card
                key={menu._id || menu.mealType}
                className={`flex flex-col justify-between ${
                  isHighlighted ? meta.ring : !isPublished ? 'border-dashed bg-slate-50/70' : ''
                }`}
              >
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl border ${meta.badge}`}
                      >
                        <MealIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-display text-lg font-bold text-slate-900">
                            {menu.mealType}
                          </h2>
                          {isHighlighted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#064E3B] px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-100">
                              <Sparkles className="h-2.5 w-2.5" />
                              Today&apos;s Focus
                            </span>
                          )}
                          {isLunch && isPublished && (
                            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-800">
                              Coupon Meal
                            </span>
                          )}
                        </div>
                        {menu.description && (
                          <p className="mt-0.5 text-xs text-slate-500">{menu.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700">
                      <Clock className="h-3.5 w-3.5 text-[#059669]" />
                      {menu.startTime} – {menu.endTime}
                    </div>
                  </div>

                  {!isPublished ? (
                    <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-white/70 p-5 text-center">
                      <p className="text-sm font-semibold text-slate-700">
                        {menu.mealType} — OFF / Not Published
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {menu.description || 'This meal is closed or unpublished for this day.'}
                      </p>
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
                      {menu.items.map((item) => (
                        <div
                          key={item._id || item.name}
                          className="flex items-start justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-2.5 transition-colors hover:bg-white"
                        >
                          <div className="flex items-start gap-2">
                            <span
                              title={item.isVeg === false ? 'Non-Veg' : 'Vegetarian'}
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                item.isVeg === false ? 'border-red-600' : 'border-emerald-600'
                              }`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  item.isVeg === false ? 'bg-red-600' : 'bg-emerald-600'
                                }`}
                              />
                            </span>
                            <div>
                              <p className="text-xs font-semibold text-slate-900">{item.name}</p>
                              {item.description && (
                                <p className="mt-0.5 text-[11px] text-slate-500">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Hostel Mess Guidelines from Backend */}
      {hostelInfo?.notes?.length > 0 && (
        <Card padding="p-4" className="bg-slate-50/70">
          <div className="flex items-start gap-3">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#059669]" />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-800">
                Mess Committee Standards ({hostelInfo.hostelName})
              </p>
              <ul className="grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                {hostelInfo.notes.map((note) => (
                  <li key={note}>&bull; {note}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
