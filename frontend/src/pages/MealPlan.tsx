import { useState, useEffect } from 'react';
import { parseISO, addDays, format } from 'date-fns';
import { getCurrentMealPlan, getLastWeekIntake, saveLastWeekIntake, regenerateMealPlan } from '../services/mealPlanService';
import { WeeklyMealPlan, WeeklyIntakeRecord, WeeklyIntake, DailyMeal } from '../types';
import MealEditor from '../components/MealEditor';
import './MealPlan.css';

const dayOrder: (keyof WeeklyIntake)[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
const PURCHASED_STORAGE_PREFIX = 'shopping-list-purchased:';

function getTodayDayKey(): keyof WeeklyIntake {
  const today = new Date();
  return dayOrder[today.getDay()];
}

function purchasedStorageKey(planId: string | number): string {
  return `${PURCHASED_STORAGE_PREFIX}${planId}`;
}

function loadPurchasedItems(planId: string | number): Set<string> {
  try {
    const raw = localStorage.getItem(purchasedStorageKey(planId));
    if (!raw) {
      return new Set();
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((key): key is string => typeof key === 'string'));
  } catch {
    return new Set();
  }
}

function savePurchasedItems(planId: string | number, items: Set<string>): void {
  localStorage.setItem(purchasedStorageKey(planId), JSON.stringify([...items]));
}

function clearPurchasedItems(planId: string | number): void {
  localStorage.removeItem(purchasedStorageKey(planId));
}

function MealPlan() {
  const [mealPlan, setMealPlan] = useState<WeeklyMealPlan | null>(null);
  const [lastWeekRecord, setLastWeekRecord] = useState<WeeklyIntakeRecord | null>(null);
  const [showLastWeekEdit, setShowLastWeekEdit] = useState(false);
  const [lastWeekData, setLastWeekData] = useState<{
    year: number;
    weekStartDate: string;
    weekEndDate: string;
    intakeData: WeeklyIntake;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedDay, setSelectedDay] = useState<keyof WeeklyIntake>('sun');
  const [selectedLastWeekDay, setSelectedLastWeekDay] = useState<keyof WeeklyIntake>('sun');
  const [selectedModalDay, setSelectedModalDay] = useState<keyof WeeklyIntake>('sun');
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getCurrentMealPlan();
      setMealPlan(data.mealPlan);
      setLastWeekRecord(data.lastWeekRecord);
      setPurchasedItems(loadPurchasedItems(data.mealPlan.id));
      setSelectedDay(getTodayDayKey());
      setSelectedLastWeekDay(getTodayDayKey());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditLastWeek = async () => {
    try {
      const data = await getLastWeekIntake();
      setLastWeekData(data);
      setSelectedModalDay('sun');
      setShowLastWeekEdit(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load last week data.');
    }
  };

  const handleSaveLastWeek = async () => {
    if (!lastWeekData) return;

    try {
      setSaving(true);
      setError('');
      await saveLastWeekIntake({
        year: lastWeekData.year,
        week_start_date: lastWeekData.weekStartDate,
        week_end_date: lastWeekData.weekEndDate,
        intake_data: lastWeekData.intakeData
      });
      setSuccess('Last week intake saved!');
      setShowLastWeekEdit(false);
      // Reload data
      await loadData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateMealPlan = async () => {
    if (!confirm('Delete current meal plan and generate a new one?')) {
      return;
    }

    try {
      setRegenerating(true);
      setError('');
      const previousPlanId = mealPlan?.id;
      const data = await regenerateMealPlan();
      if (previousPlanId != null) {
        clearPurchasedItems(previousPlanId);
      }
      setMealPlan(data.mealPlan);
      setLastWeekRecord(data.lastWeekRecord);
      setPurchasedItems(loadPurchasedItems(data.mealPlan.id));
      setSuccess('New meal plan generated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to regenerate meal plan.');
    } finally {
      setRegenerating(false);
    }
  };

  const togglePurchased = (key: string) => {
    if (!mealPlan) {
      return;
    }
    const planId = mealPlan.id;
    setPurchasedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      savePurchasedItems(planId, next);
      return next;
    });
  };

  const updateDayMeal = (day: keyof WeeklyIntake, mealType: keyof DailyMeal, meals: any[]) => {
    if (!lastWeekData) return;
    
    setLastWeekData({
      ...lastWeekData,
      intakeData: {
        ...lastWeekData.intakeData,
        [day]: {
          ...lastWeekData.intakeData[day],
          [mealType]: meals
        }
      }
    });
  };

  const dayNames: Record<string, string> = {
    sun: 'Sunday',
    mon: 'Monday',
    tue: 'Tuesday',
    wed: 'Wednesday',
    thu: 'Thursday',
    fri: 'Friday',
    sat: 'Saturday'
  };

  const getDateForDay = (weekStartDate: string) => (day: keyof WeeklyIntake) => {
    const base = parseISO(weekStartDate);
    const idx = dayOrder.indexOf(day);
    return format(addDays(base, idx), 'M/d');
  };

  const getShoppingListByCategory = (): Record<string, string[]> => {
    if (!mealPlan?.shopping_list) return {};
    const raw = mealPlan.shopping_list;
    if (Array.isArray(raw)) return { 'Other': raw };
    const mapped: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(raw)) {
      mapped[k] = (mapped[k] || []).concat(v);
    }
    return mapped;
  };

  const shoppingListByCategory = mealPlan ? getShoppingListByCategory() : {};
  const shoppingListTotal = Object.values(shoppingListByCategory).flat().length;
  const SHOPPING_CATEGORY_ORDER = ['Vegetables', 'Fruits', 'Meat & Seafood', 'Dairy & Eggs', 'Grains & Processed', 'Seasonings & Other', 'Other'];

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Weekly Meal Plan</h1>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* 1. Last week intake section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: lastWeekRecord ? '15px' : 0 }}>
          <h2 className="card-title" style={{ marginBottom: 0 }}>Last Week</h2>
          {lastWeekRecord && (
            <button className="btn btn-secondary" onClick={handleEditLastWeek}>
              Edit
            </button>
          )}
        </div>
        {lastWeekRecord ? (
          <>
            <p className="info-text" style={{ marginBottom: '20px' }}>
              {lastWeekRecord.week_start_date} ~ {lastWeekRecord.week_end_date}
            </p>
            <div className="day-tabs">
              {dayOrder.map(day => (
                <button
                  key={day}
                  type="button"
                  className={`day-tab ${selectedLastWeekDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedLastWeekDay(day)}
                >
                  <span className="day-tab-name">{dayNames[day].slice(0, 3)}</span>
                  <span className="day-tab-date">{getDateForDay(lastWeekRecord.week_start_date)(day)}</span>
                </button>
              ))}
            </div>
            <div className="day-card day-card-single">
              <h3 className="day-title">{dayNames[selectedLastWeekDay]} {getDateForDay(lastWeekRecord.week_start_date)(selectedLastWeekDay)}</h3>
              <div className="meal-columns">
                <div className="meal-column">
                  <strong className="meal-column-title">Breakfast</strong>
                  <ul>
                    {lastWeekRecord.intake_data[selectedLastWeekDay].breakfast.map((item, i) => (
                      <li key={i}>{typeof item === 'string' ? item : item.name}</li>
                    ))}
                  </ul>
                </div>
                <div className="meal-column">
                  <strong className="meal-column-title">Lunch</strong>
                  <ul>
                    {lastWeekRecord.intake_data[selectedLastWeekDay].lunch.map((item, i) => (
                      <li key={i}>{typeof item === 'string' ? item : item.name}</li>
                    ))}
                  </ul>
                </div>
                <div className="meal-column">
                  <strong className="meal-column-title">Dinner</strong>
                  <ul>
                    {lastWeekRecord.intake_data[selectedLastWeekDay].dinner.map((item, i) => (
                      <li key={i}>{typeof item === 'string' ? item : item.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <p className="info-text">
              No last week record. Add your intake for more accurate meal recommendations.
            </p>
            <button className="btn btn-primary" onClick={handleEditLastWeek}>
              Add Last Week
            </button>
          </>
        )}
      </div>

      {/* 2. Last week evaluation */}
      {lastWeekRecord && (
        <div className="card">
          <h2 className="card-title">Last Week Evaluation</h2>
          
          <div className="evaluation-section">
            <h3>Macros</h3>
            <div className="macro-info">
              <div className="macro-item">
                <span className="macro-label">Calories</span>
                <span className="macro-value">{lastWeekRecord.macro.calories?.toLocaleString() || 0} kcal</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">Carbs</span>
                <span className="macro-value">{lastWeekRecord.macro.carbs_g}g ({lastWeekRecord.macro.ratio.carbs_pct}%)</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">Protein</span>
                <span className="macro-value">{lastWeekRecord.macro.protein_g}g ({lastWeekRecord.macro.ratio.protein_pct}%)</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">Fat</span>
                <span className="macro-value">{lastWeekRecord.macro.fat_g}g ({lastWeekRecord.macro.ratio.fat_pct}%)</span>
              </div>
            </div>

            <h3>Strengths</h3>
            <ul>
              {lastWeekRecord.strengths.map((item, i) => (
                <li key={i} className="positive">{item}</li>
              ))}
            </ul>

            <h3>Weaknesses</h3>
            <ul>
              {lastWeekRecord.weaknesses.map((item, i) => (
                <li key={i} className="negative">{item}</li>
              ))}
            </ul>

            <h3>Improvements</h3>
            <ul>
              {lastWeekRecord.improvements.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>

            <h3>Cautions</h3>
            <ul>
              {lastWeekRecord.cautions.map((item, i) => (
                <li key={i} className="warning">{item}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Last week edit modal */}
      {showLastWeekEdit && lastWeekData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Last Week Intake</h2>
            <p className="modal-subtitle">
              {lastWeekData.weekStartDate} ~ {lastWeekData.weekEndDate}
            </p>

            <div className="day-tabs">
              {dayOrder.map(day => (
                <button
                  key={day}
                  type="button"
                  className={`day-tab ${selectedModalDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedModalDay(day)}
                >
                  <span className="day-tab-name">{dayNames[day].slice(0, 3)}</span>
                  <span className="day-tab-date">{getDateForDay(lastWeekData.weekStartDate)(day)}</span>
                </button>
              ))}
            </div>

            <div className="day-card day-card-single modal-day-editor">
              <h3 className="day-title">{dayNames[selectedModalDay]} {getDateForDay(lastWeekData.weekStartDate)(selectedModalDay)}</h3>
              <div className="meal-columns meal-columns-editable">
                <div className="meal-column">
                  <strong className="meal-column-title">Breakfast</strong>
                  <MealEditor
                    label=""
                    meals={lastWeekData.intakeData[selectedModalDay].breakfast}
                    onChange={(meals) => updateDayMeal(selectedModalDay, 'breakfast', meals)}
                  />
                </div>
                <div className="meal-column">
                  <strong className="meal-column-title">Lunch</strong>
                  <MealEditor
                    label=""
                    meals={lastWeekData.intakeData[selectedModalDay].lunch}
                    onChange={(meals) => updateDayMeal(selectedModalDay, 'lunch', meals)}
                  />
                </div>
                <div className="meal-column">
                  <strong className="meal-column-title">Dinner</strong>
                  <MealEditor
                    label=""
                    meals={lastWeekData.intakeData[selectedModalDay].dinner}
                    onChange={(meals) => updateDayMeal(selectedModalDay, 'dinner', meals)}
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowLastWeekEdit(false)}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveLastWeek}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. This week's meal plan */}
      {mealPlan && (
        <>
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h2 className="card-title" style={{ marginBottom: '5px' }}>This Week's Plan</h2>
                <p className="info-text" style={{ marginBottom: 0 }}>
                  {mealPlan.week_start_date} ~ {mealPlan.week_end_date}
                </p>
              </div>
              <button
                className="btn btn-secondary"
                onClick={handleRegenerateMealPlan}
                disabled={regenerating}
              >
                {regenerating ? 'Generating...' : '🔄 Regenerate'}
              </button>
            </div>

            <div className="day-tabs">
              {dayOrder.map(day => (
                <button
                  key={day}
                  type="button"
                  className={`day-tab ${selectedDay === day ? 'active' : ''}`}
                  onClick={() => setSelectedDay(day)}
                >
                  <span className="day-tab-name">{dayNames[day].slice(0, 3)}</span>
                  <span className="day-tab-date">{mealPlan && getDateForDay(mealPlan.week_start_date)(day)}</span>
                </button>
              ))}
            </div>

            <div className="day-card day-card-single">
              <h3 className="day-title">{dayNames[selectedDay]} {mealPlan && getDateForDay(mealPlan.week_start_date)(selectedDay)}</h3>
              <div className="meal-columns">
                <div className="meal-column">
                  <strong className="meal-column-title">Breakfast</strong>
                  <ul>
                    {mealPlan.plan_data[selectedDay].breakfast.map((item, i) => {
                      const name = typeof item === 'string' ? item : item.name;
                      const kcal = typeof item === 'object' ? item.calories_kcal : undefined;
                      return (
                        <li key={i}>
                          {name}
                          {kcal != null && <span className="meal-item-calories">({kcal.toLocaleString()} kcal)</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="meal-column">
                  <strong className="meal-column-title">Lunch</strong>
                  <ul>
                    {mealPlan.plan_data[selectedDay].lunch.map((item, i) => {
                      const name = typeof item === 'string' ? item : item.name;
                      const kcal = typeof item === 'object' ? item.calories_kcal : undefined;
                      return (
                        <li key={i}>
                          {name}
                          {kcal != null && <span className="meal-item-calories">({kcal.toLocaleString()} kcal)</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="meal-column">
                  <strong className="meal-column-title">Dinner</strong>
                  <ul>
                    {mealPlan.plan_data[selectedDay].dinner.map((item, i) => {
                      const name = typeof item === 'string' ? item : item.name;
                      const kcal = typeof item === 'object' ? item.calories_kcal : undefined;
                      return (
                        <li key={i}>
                          {name}
                          {kcal != null && <span className="meal-item-calories">({kcal.toLocaleString()} kcal)</span>}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Weekly macros */}
          <div className="card">
            <h2 className="card-title">Weekly Macros</h2>
            <div className="macro-info">
              <div className="macro-item">
                <span className="macro-label">Calories</span>
                <span className="macro-value">{mealPlan.plan_macro.calories?.toLocaleString() || 0} kcal</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">Carbs</span>
                <span className="macro-value">{mealPlan.plan_macro.carbs_g}g ({mealPlan.plan_macro.ratio.carbs_pct}%)</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">Protein</span>
                <span className="macro-value">{mealPlan.plan_macro.protein_g}g ({mealPlan.plan_macro.ratio.protein_pct}%)</span>
              </div>
              <div className="macro-item">
                <span className="macro-label">Fat</span>
                <span className="macro-value">{mealPlan.plan_macro.fat_g}g ({mealPlan.plan_macro.ratio.fat_pct}%)</span>
              </div>
            </div>
          </div>

          {/* 5. Recommendation rationale */}
          <div className="card">
            <h2 className="card-title">Recommendation Rationale</h2>
            <div className="rationale-section">
              <h3>Considerations</h3>
              <ul>
                {mealPlan.rationale.considered.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
              <h3>Summary</h3>
              <p className="rationale-notes-paragraph">{mealPlan.rationale.notes}</p>
            </div>
          </div>

          {/* 6. Shopping list */}
          {shoppingListTotal > 0 && (
            <div className="card">
              <h2 className="card-title">Shopping List</h2>
              <div className="shopping-list-by-category">
                {[...SHOPPING_CATEGORY_ORDER, ...Object.keys(shoppingListByCategory).filter(cat => !SHOPPING_CATEGORY_ORDER.includes(cat))]
                  .filter(cat => (shoppingListByCategory[cat]?.length ?? 0) > 0)
                  .map(category => (
                    <div key={category} className="shopping-category">
                      <h3 className="shopping-category-title">{category}</h3>
                      <ul className="shopping-list">
                        {shoppingListByCategory[category].map((item, i) => {
                          const key = `${category}:${item}:${i}`;
                          const purchased = purchasedItems.has(key);
                          return (
                            <li
                              key={i}
                              className={`shopping-list-item${purchased ? ' purchased' : ''}`}
                              onClick={() => togglePurchased(key)}
                            >
                              {item}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default MealPlan;
