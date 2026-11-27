import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, UtensilsCrossed, Save, Pencil, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { menuService } from '../../services/menuService';
import { Card, EmptyState, Skeleton } from '../../components/common/Card';
import { Button } from '../../components/common/Controls';
import { extractErrorMessage, formatDate, getTodayISO } from '../../utils/formatters';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Snacks', 'Dinner'];
const ITEM_CATEGORIES = ['Main Course', 'Staples', 'Side Dish', 'Beverage', 'Dessert', 'Salad & Extras'];

const EMPTY_ITEM = { name: '', category: 'Main Course', description: '', isVeg: true };

export default function MenuManagement() {
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    date: getTodayISO(),
    mealType: 'Lunch',
    startTime: '12:00',
    endTime: '14:30',
    description: '',
    items: [{ ...EMPTY_ITEM }],
  });

  const fetchMenus = useCallback(async () => {
    try {
      const data = await menuService.getAdminMenus();
      setMenus(data.menus || []);
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to fetch menus'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(fetchMenus);
  }, [fetchMenus]);

  const addItemRow = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM }],
    }));
  };

  const removeItemRow = (idx) => {
    if (form.items.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const updateItem = (idx, field, value) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)),
    }));
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({
      date: getTodayISO(),
      mealType: 'Lunch',
      startTime: '12:00',
      endTime: '14:30',
      description: '',
      items: [{ ...EMPTY_ITEM }],
    });
  };

  const handleEdit = (menu) => {
    setEditingId(menu._id);
    setForm({
      date: menu.date,
      mealType: menu.mealType,
      startTime: menu.startTime,
      endTime: menu.endTime,
      description: menu.description || '',
      items: menu.items.map((it) => ({
        name: it.name,
        category: it.category || 'Main Course',
        description: it.description || '',
        isVeg: it.isVeg !== false,
      })),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await menuService.deleteMenu(id);
      toast.success('Menu deleted');
      if (editingId === id) resetForm();
      await fetchMenus();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Failed to delete menu'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = form.items.filter((it) => it.name.trim());
    if (validItems.length === 0) {
      toast.error('Please add at least one menu item with a name.');
      return;
    }

    const payload = {
      ...form,
      items: validItems.map((it) => ({
        ...it,
        name: it.name.trim(),
        description: it.description.trim(),
      })),
    };

    try {
      setSaving(true);
      if (editingId) {
        await menuService.updateMenu(editingId, payload);
        toast.success('Menu updated and students notified');
      } else {
        await menuService.saveMenu(payload);
        toast.success('Menu published and students notified');
      }
      resetForm();
      await fetchMenus();
    } catch (err) {
      toast.error(extractErrorMessage(err, 'Could not save menu'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-slate-900">Menu Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Publish or edit daily mess menus across Breakfast, Lunch, Snacks, and Dinner.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Menu Editor Form */}
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-display text-base font-semibold text-slate-900">
              {editingId ? 'Edit Menu' : 'Publish / Update Menu'}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Meal Type</label>
                <select
                  value={form.mealType}
                  onChange={(e) => setForm((p) => ({ ...p, mealType: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#059669] focus:outline-none"
                >
                  {MEAL_TYPES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Start Time</label>
                <input
                  type="time"
                  required
                  value={form.startTime}
                  onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#059669] focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">End Time</label>
                <input
                  type="time"
                  required
                  value={form.endTime}
                  onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#059669] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">
                Meal Description (Optional)
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Freshly prepared homestyle lunch thali..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#059669] focus:outline-none"
              />
            </div>

            <div className="space-y-3 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Menu Items ({form.items.length})
                </span>
                <Button type="button" variant="secondary" size="sm" onClick={addItemRow}>
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </Button>
              </div>

              <div className="max-h-80 space-y-3 overflow-y-auto pr-1">
                {form.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        required
                        value={item.name}
                        onChange={(e) => updateItem(idx, 'name', e.target.value)}
                        placeholder="Dish name (e.g. Dal Tadka)"
                        className="flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-[#059669] focus:outline-none"
                      />
                      {form.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
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
                    </div>

                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(idx, 'description', e.target.value)}
                      placeholder="Short note (optional)"
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs focus:border-[#059669] focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" loading={saving} className="w-full">
              <Save className="h-4 w-4" />
              {editingId ? 'Save Menu Updates' : 'Publish Menu'}
            </Button>
          </form>
        </Card>

        {/* Published Menus List */}
        <div className="space-y-4 lg:col-span-3">
          {loading ? (
            <Skeleton className="h-72" />
          ) : menus.length === 0 ? (
            <Card>
              <EmptyState
                icon={UtensilsCrossed}
                title="No menus published yet"
                description="Use the form on the left to publish today's lunch or other meal menus."
              />
            </Card>
          ) : (
            menus.map((menu) => (
              <Card key={menu._id} padding="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        {menu.mealType}
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {formatDate(menu.date)}
                      </span>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {menu.startTime} – {menu.endTime}
                      {menu.description && ` • ${menu.description}`}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleEdit(menu)}>
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(menu._id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {menu.items.map((item) => (
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
                  ))}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
