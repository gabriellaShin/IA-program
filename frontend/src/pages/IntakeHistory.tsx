import { useState, useEffect, useRef, useCallback } from 'react';
import { getIntakeHistory } from '../services/mealPlanService';
import { WeeklyIntakeRecord, WeeklyIntake } from '../types';
import './IntakeHistory.css';

function IntakeHistory() {
  const [records, setRecords] = useState<WeeklyIntakeRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);
      const data = await getIntakeHistory(page, 3);
      setRecords(prev => [...prev, ...data.records]);
      setHasMore(data.hasMore);
      setPage(prev => prev + 1);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, [page, loading, hasMore]);

  useEffect(() => {
    loadMore();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, loadMore]);

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
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

  return (
    <div className="page-container">
      <h1 className="page-title">Intake History</h1>
      <p className="page-subtitle">View your weekly meal intake records.</p>

      {error && <div className="error-message">{error}</div>}

      {records.length === 0 && !loading ? (
        <div className="empty-state">
          <p>No intake records yet.</p>
        </div>
      ) : (
        <div className="history-list">
          {records.map(record => (
            <div key={record.id} className="history-item">
              <div 
                className="history-header"
                onClick={() => toggleExpand(record.id)}
              >
                <div>
                  <h3>
                    {record.week_start_date} ~ {record.week_end_date}
                  </h3>
                  <p className="history-date">
                    Saved: {new Date(record.created_at).toLocaleDateString('en-US')}
                  </p>
                </div>
                <button className="expand-btn">
                  {expandedIds.has(record.id) ? '▲' : '▼'}
                </button>
              </div>

              {expandedIds.has(record.id) && (
                <div className="history-content">
                  {/* Macros */}
                  <div className="section">
                    <h4>Weekly Macros</h4>
                    <div className="macro-info">
                      <div className="macro-item">
                        <span className="macro-label">Calories</span>
                        <span className="macro-value">
                          {record.macro.calories?.toLocaleString() || 0} kcal
                        </span>
                      </div>
                      <div className="macro-item">
                        <span className="macro-label">Carbs</span>
                        <span className="macro-value">
                          {record.macro.carbs_g}g ({record.macro.ratio.carbs_pct}%)
                        </span>
                      </div>
                      <div className="macro-item">
                        <span className="macro-label">Protein</span>
                        <span className="macro-value">
                          {record.macro.protein_g}g ({record.macro.ratio.protein_pct}%)
                        </span>
                      </div>
                      <div className="macro-item">
                        <span className="macro-label">Fat</span>
                        <span className="macro-value">
                          {record.macro.fat_g}g ({record.macro.ratio.fat_pct}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Intake */}
                  <div className="section">
                    <h4>Intake</h4>
                    <div className="intake-grid">
                      {(Object.keys(record.intake_data) as Array<keyof WeeklyIntake>).map(day => (
                        <div key={day} className="day-intake">
                          <strong>{dayNames[day]}</strong>
                          <div className="meal-list">
                            <div>
                              <span className="meal-time">Breakfast:</span>
                              {record.intake_data[day].breakfast.length > 0
                                ? record.intake_data[day].breakfast.map(m => m.name).join(', ')
                                : 'None'}
                            </div>
                            <div>
                              <span className="meal-time">Lunch:</span>
                              {record.intake_data[day].lunch.length > 0
                                ? record.intake_data[day].lunch.map(m => m.name).join(', ')
                                : 'None'}
                            </div>
                            <div>
                              <span className="meal-time">Dinner:</span>
                              {record.intake_data[day].dinner.length > 0
                                ? record.intake_data[day].dinner.map(m => m.name).join(', ')
                                : 'None'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Evaluation */}
                  <div className="section">
                    <h4>Strengths</h4>
                    <ul className="eval-list positive">
                      {record.strengths.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="section">
                    <h4>Weaknesses</h4>
                    <ul className="eval-list negative">
                      {record.weaknesses.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="section">
                    <h4>Improvements</h4>
                    <ul className="eval-list">
                      {record.improvements.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="section">
                    <h4>Cautions</h4>
                    <ul className="eval-list warning">
                      {record.cautions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {loading && <div className="loading">Loading...</div>}
      
      <div ref={observerTarget} style={{ height: '20px' }} />
    </div>
  );
}

export default IntakeHistory;
