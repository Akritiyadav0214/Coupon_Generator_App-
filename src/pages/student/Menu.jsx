import { useCallback, useEffect, useState } from 'react';
import { Calendar, Clock, Coffee, Moon, Sun, UtensilsCrossed } from 'lucide-react';
import toast from 'react-hot-toast';
import { menuService } from '../../services/menuService';
import { Card, EmptyState, Skeleton } from '../../components/common/Card';
import { extractErrorMessage, formatDate, getTodayISO } from '../../utils/formatters';

const MEAL_META = {
  Breakfast: { icon: Coffee, badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  Lunch: { icon: Sun, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Snacks: { icon: UtensilsCrossed, badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  Dinner: { icon: Moon, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

export default function StudentMenu() {
  const [selectedDate, setSelectedDate] = useState(getTodayISO());
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMenus = useCallback(async () => {
    try {
      const data = await menuService.getStudentMenu(selectedDate);
      setMenus(data.menus || []);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to fetch mess menu'));
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    Promise.resolve().then(fetchMenus);
  }, [fetchMenus]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">Mess Menu</h1>
          <p className="mt-1 text-sm text-slate-500">
            Daily meal schedule and freshly prepared items for {formatDate(selectedDate)}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#059669] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : menus.length === 0 ? (
        <Card>
          <EmptyState
            icon={UtensilsCrossed}
            title={`No menu published for ${formatDate(selectedDate)}`}
            description="The mess administrator has not published meal details for this date yet."
          />
        </Card>
      ) : (
        <div className="grid gap-6">
          {menus.map((menu) => {
            const meta = MEAL_META[menu.mealType] || MEAL_META.Lunch;
            const MealIcon = meta.icon;
            const isLunch = menu.mealType === 'Lunch';

            return (
              <Card
                key={menu._id}
                className={isLunch ? 'border-emerald-300/80 ring-1 ring-emerald-500/10' : ''}
              >
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border ${meta.badge}`}
                    >
                      <MealIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-bold text-slate-900">
                          {menu.mealType}
                        </h2>
                        {isLunch && (
                          <span className="rounded-full bg-[#059669] px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                            Coupon Meal
                          </span>
                        )}
                      </div>
                      {menu.description && (
                        <p className="mt-0.5 text-xs text-slate-500">{menu.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-700">
                    <Clock className="h-3.5 w-3.5 text-[#059669]" />
                    {menu.startTime} – {menu.endTime}
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {menu.items.map((item) => (
                    <div
                      key={item._id || item.name}
                      className="flex flex-col justify-between rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5 transition-colors hover:bg-white"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            title={item.isVeg === false ? 'Non-Veg' : 'Vegetarian'}
                            className={`flex h-4 w-4 items-center justify-center rounded border ${
                              item.isVeg === false ? 'border-red-600' : 'border-emerald-600'
                            }`}
                          >
                            <span
                              className={`h-2 w-2 rounded-full ${
                                item.isVeg === false ? 'bg-red-600' : 'bg-emerald-600'
                              }`}
                            />
                          </span>
                          <h3 className="text-sm font-semibold text-slate-900">{item.name}</h3>
                        </div>
                      </div>
                      {item.description && (
                        <p className="mt-1.5 text-xs text-slate-500">{item.description}</p>
                      )}
                      <div className="mt-2.5">
                        <span className="inline-block rounded-md bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 ring-1 ring-slate-200">
                          {item.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
