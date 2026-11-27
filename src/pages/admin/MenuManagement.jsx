import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Plus,
  Trash2,
  UtensilsCrossed,
  Save,
  Pencil,
  Clock,
  Coffee,
  Sun,
  Moon,
  Eye,
  EyeOff,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { menuService } from '../../services/menuService';
import { Card, EmptyState, Skeleton } from '../../components/common/Card';
import { Button, Modal } from '../../components/common/Controls';
import { extractErrorMessage } from '../../utils/formatters';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
const ITEM_CATEGORIES = ['Main Course', 'Staples', 'Side Dish', 'Beverage', 'Dessert', 'Salad & Extras'];

const MEAL_ICON = {
  Breakfast: { icon: Coffee, badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  Lunch: { icon: Sun, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  Snacks: { icon: UtensilsCrossed, badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  Dinner: { icon: Moon, badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

const DEFAULT_MEAL_TIMES = {
  Breakfast: { startTime: '07:30', endTime: '09:30' },
  Lunch: { startTime: '12:30', endTime: '14:30' },
  Snacks: { startTime: '17:00', endTime: '18:00' },
  Dinner: { startTime: '19:30', endTime: '21:30' },
};

const EMPTY_ITEM = { name: '', category: 'Main Course', description: '', isVeg: true };

function getCurrentWeekdayName() {
  const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return names[new Date().getDay()];
}

export default function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getCurrentWeekdayName());
  const [togglingId, setTogglingId] = useState(null);

  const [editModal, setEditModal] = useState({
    open: false,
    slotId: null,
    dayOfWeek: 'Monday',
    mealType: 'Lunch',
    mealName: '',
    startTime: '12:30',
    endTime: '14:30',
    description: '',
    isPublished: true,
    items: [{ ...EMPTY_ITEM }],
  });
  const [saving, setSaving] = useState(false);

  const fetchWeeklyMenus = useCallback(async () => {
    try {
      const data = await menuService.getWeeklyMenus();
      setMenus(data.menus || []);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to fetch weekly hostel menu'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchWeeklyMenus);
  }, [fetchWeeklyMenus]);

  const slotMap = useMemo(() => {
    const map = new Map();
    menus.forEach((m) => {
      map.set(`${m.dayOfWeek}:${m.mealType}`, m);
    });
    return map;
  }, [menus]);

  const daysToDisplay = useMemo(
    () => (selectedDay === 'ALL' ? WEEKDAYS : [selectedDay]),
    [selectedDay]
  );

  const openEditor = (dayOfWeek, mealType, existingSlot) => {
    const defaults = DEFAULT_MEAL_TIMES[mealType] || DEFAULT_MEAL_TIMES.Lunch;
    if (existingSlot) {
      setEditModal({
        open: true,
        slotId: existingSlot._id,
        dayOfWeek,
        mealType,
        mealName: existingSlot.mealName || `${dayOfWeek} ${mealType}`,
        startTime: existingSlot.startTime || defaults.startTime,
        endTime: existingSlot.endTime || defaults.endTime,
        description: existingSlot.description || '',
        isPublished: existingSlot.isPublished !== false,
        items:
          existingSlot.items && existingSlot.items.length > 0
            ? existingSlot.items.map((it) => ({
                name: it.name,
                category: it.category || 'Main Course',
                description: it.description || '',
                isVeg: it.isVeg !== false,
              }))
            : [{ ...EMPTY_ITEM }],
      });
    } else {
      setEditModal({
        open: true,
        slotId: null,
        dayOfWeek,
        mealType,
        mealName: `${dayOfWeek} ${mealType}`,
        startTime: defaults.startTime,
        endTime: defaults.endTime,
        description: '',
        isPublished: true,
        items: [{ ...EMPTY_ITEM }],
      });
    }
  };

  const closeEditor = () => {
    setEditModal((prev) => ({ ...prev, open: false }));
  };

  const addItemRow = () => {
    setEditModal((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }],
    }));
  };

  const removeItemRow = (idx) => {
    setEditModal((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx, field, value) => {
    setEditModal((prev) => ({
      ...prev,
      items: prev.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    }));
  };

  const handleTogglePublish = async (slot) => {
    try {
      setTogglingId(slot._id);
      const nextPublished = !slot.isPublished;
      const res = await menuService.toggleWeeklyPublish(slot._id, nextPublished);
      setMenus((prev) => prev.map((m) => (m._id === slot._id ? res.data.menu : m)));
      toast.success(
        `${slot.dayOfWeek} ${slot.mealType} ${nextPublished ? 'published' : 'unpublished'}`
      );
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to update publish status'));
    } finally {
      setTogglingId(null);
    }
  };

  const handleSaveSlot = async (e) => {
    e.preventDefault();
    const cleanedItems = editModal.items
      .filter((it) => it.name.trim())
      .map((it) => ({
        name: it.name.trim(),
        category: it.category || 'Main Course',
        description: it.description.trim(),
        isVeg: it.isVeg !== false,
      }));

    if (editModal.isPublished && cleanedItems.length === 0) {
      toast.error('Published meals must contain at least one food item.');
      return;
    }

    const payload = {
      dayOfWeek: editModal.dayOfWeek,
      mealType: editModal.mealType,
      mealName: editModal.mealName.trim() || `${editModal.dayOfWeek} ${editModal.mealType}`,
      startTime: editModal.startTime,
      endTime: editModal.endTime,
      description: editModal.description.trim(),
      isPublished: editModal.isPublished,
      items: cleanedItems,
    };

    try {
      setSaving(true);
      if (editModal.slotId) {
        await menuService.updateWeeklyMenu(editModal.slotId, payload);
      } else {
        await menuService.upsertWeeklySlot(payload);
      }
      toast.success(`${editModal.dayOfWeek} ${editModal.mealType} menu saved`);
      closeEditor();
      await fetchWeeklyMenus();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Unable to save weekly menu'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Weekly Hostel Menu Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage ABES Boys&apos; Hostel recurring Monday-to-Sunday meals, timings, items, and
            publish status.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-[#064E3B]">
          <CalendarDays className="h-4 w-4 text-[#059669]" />
          Auto-repeats weekly
        </div>
      </div>

      {/* Weekday Tabs */}
      <Card padding="p-3">
        <div className="flex flex-wrap gap-1.5">
          {WEEKDAYS.map((day) => {
            const isToday = day === getCurrentWeekdayName();
            const isActive = selectedDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setSelectedDay(day)}
                className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-[#059669] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {day}
                {isToday && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Today
                  </span>
                )}
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSelectedDay('ALL')}
            className={`cursor-pointer rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
              selectedDay === 'ALL'
                ? 'bg-[#064E3B] text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Days (Mon–Sun)
          </button>
        </div>
      </Card>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-56" />
          ))}
        </div>
      ) : menus.length === 0 ? (
        <Card>
          <EmptyState
            icon={UtensilsCrossed}
            title="Weekly hostel menu not seeded yet"
            description="Run `npm run seed:weekly-menu` to populate the ABES Boys' Hostel schedule, or click any meal slot to configure manually."
          />
        </Card>
      ) : (
        <div className="space-y-8">
          {daysToDisplay.map((day) => (
            <section key={day} className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-slate-900">{day}</h2>
                  {day === getCurrentWeekdayName() && (
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                      Current Weekday
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">4 meal periods</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {MEAL_TYPES.map((mealType) => {
                  const slot = slotMap.get(`${day}:${mealType}`);
                  const meta = MEAL_ICON[mealType] || MEAL_ICON.Lunch;
                  const MealIcon = meta.icon;
                  const isPublished = slot ? slot.isPublished !== false : false;

                  return (
                    <Card
                      key={`${day}-${mealType}`}
                      padding="p-5"
                      className={
                        isPublished
                          ? 'transition-colors hover:border-slate-300'
                          : 'border-dashed bg-slate-50/70 opacity-85'
                      }
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg border ${meta.badge}`}
                          >
                            <MealIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-slate-900">
                                {slot?.mealName || `${day} ${mealType}`}
                              </h3>
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                                  isPublished
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                              >
                                {isPublished ? 'Published' : 'Unpublished / OFF'}
                              </span>
                            </div>
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                              <Clock className="h-3 w-3" />
                              {slot
                                ? `${slot.startTime} – ${slot.endTime}`
                                : `${DEFAULT_MEAL_TIMES[mealType].startTime} – ${DEFAULT_MEAL_TIMES[mealType].endTime}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {slot && (
                            <Button
                              variant="secondary"
                              size="sm"
                              loading={togglingId === slot._id}
                              onClick={() => handleTogglePublish(slot)}
                              title={isPublished ? 'Unpublish meal' : 'Publish meal'}
                            >
                              {isPublished ? (
                                <>
                                  <EyeOff className="h-3.5 w-3.5" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Eye className="h-3.5 w-3.5" />
                                  Publish
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => openEditor(day, mealType, slot)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Button>
                        </div>
                      </div>

                      {slot?.description && (
                        <p className="mt-2.5 text-xs text-slate-500">{slot.description}</p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {slot?.items?.length > 0 ? (
                          slot.items.map((item) => (
                            <span
                              key={item._id || item.name}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  item.isVeg === false ? 'bg-red-500' : 'bg-emerald-500'
                                }`}
                              />
                              {item.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs italic text-slate-400">
                            No items configured for this slot.
                          </span>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Edit Meal Modal */}
      <Modal
        open={editModal.open}
        onClose={closeEditor}
        title={`Edit ${editModal.dayOfWeek} ${editModal.mealType}`}
        subtitle="Changes save directly to MongoDB and repeat weekly."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveSlot} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">Meal Name</label>
              <input
                type="text"
                required
                value={editModal.mealName}
                onChange={(e) => setEditModal((p) => ({ ...p, mealName: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#059669] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Start Time</label>
              <input
                type="time"
                required
                value={editModal.startTime}
                onChange={(e) => setEditModal((p) => ({ ...p, startTime: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#059669] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">End Time</label>
              <input
                type="time"
                required
                value={editModal.endTime}
                onChange={(e) => setEditModal((p) => ({ ...p, endTime: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#059669] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Optional Description / Note
              </label>
              <input
                type="text"
                value={editModal.description}
                onChange={(e) => setEditModal((p) => ({ ...p, description: e.target.value }))}
                placeholder="e.g. Served with curd & chutney..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#059669] focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={editModal.isPublished}
                  onChange={(e) => setEditModal((p) => ({ ...p, isPublished: e.target.checked }))}
                  className="accent-[#059669]"
                />
                Published (visible to students on Weekly Menu)
              </label>
            </div>
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Food Items ({editModal.items.length})
              </span>
              <Button type="button" variant="secondary" size="sm" onClick={addItemRow}>
                <Plus className="h-3.5 w-3.5" />
                Add Food Item
              </Button>
            </div>

            <div className="max-h-72 space-y-2.5 overflow-y-auto pr-1">
              {editModal.items.map((item, idx) => (
                <div
                  key={idx}
                  className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      required={editModal.isPublished}
                      value={item.name}
                      onChange={(e) => updateItem(idx, 'name', e.target.value)}
                      placeholder="Food item name (e.g. Aaloo Paratha)"
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-[#059669] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeItemRow(idx)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="Remove food item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={item.category}
                      onChange={(e) => updateItem(idx, 'category', e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-[#059669] focus:outline-none"
                    >
                      {ITEM_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>

                    <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700">
                      <input
                        type="checkbox"
                        checked={item.isVeg}
                        onChange={(e) => updateItem(idx, 'isVeg', e.target.checked)}
                        className="accent-[#059669]"
                      />
                      Veg
                    </label>

                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      placeholder="Item note (optional)"
                      className="min-w-[160px] flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-[#059669] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <Button type="button" variant="secondary" onClick={closeEditor}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              <Save className="h-4 w-4" />
              Save Weekly Meal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
