import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom'
import { getMealPlanFull, createMealPlan, saveMealPlanFull, getProfessional, MealPlanFull, MealPlanDay, Meal, MealFood } from '../lib/supabase'
import styles from './MealPlanBuilder.module.css'

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'
const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
}
const MEAL_ICONS: Record<MealType, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
}

function newMeal(dayId: string, type: MealType, order: number): Meal & { foods: MealFood[] } {
  return { id: `new-${Math.random()}`, day_id: dayId, meal_type: type, sort_order: order, foods: [] }
}

function newDay(planId: string, num: number): MealPlanDay & { meals: (Meal & { foods: MealFood[] })[] } {
  const id = `new-${Math.random()}`
  return {
    id,
    meal_plan_id: planId,
    day_number: num,
    label: `Day ${num}`,
    sort_order: num - 1,
    meals: MEAL_TYPES.map((t, i) => newMeal(id, t, i)),
  }
}

export default function MealPlanBuilder() {
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const proId = searchParams.get('pro') ?? ''
  const navigate = useNavigate()

  const [plan, setPlan] = useState<MealPlanFull | null>(null)
  const [proName, setProName] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      if (proId) {
        const pro = await getProfessional(proId)
        if (pro) setProName(pro.name)
      }

      if (id) {
        const full = await getMealPlanFull(id)
        if (full) {
          setPlan(full)
          if (full.days.length > 0) setExpandedDay(full.days[0].id)
        }
      } else {
        const tempId = `new-${Date.now()}`
        const draft: MealPlanFull = {
          id: tempId,
          professional_id: proId,
          name: 'Untitled Meal Plan',
          description: '',
          is_public: true,
          share_token: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          days: [newDay(tempId, 1) as MealPlanDay & { meals: (Meal & { foods: MealFood[] })[] }],
        }
        setPlan(draft)
        if (draft.days.length > 0) setExpandedDay(draft.days[0].id)
      }
      setLoading(false)
    }
    load()
  }, [id, proId])

  const updatePlanField = useCallback((field: 'name' | 'description', value: string) => {
    setPlan(prev => prev ? { ...prev, [field]: value } : prev)
  }, [])

  function addDay() {
    setPlan(prev => {
      if (!prev) return prev
      const num = prev.days.length + 1
      const day = newDay(prev.id, num)
      setExpandedDay(day.id)
      return { ...prev, days: [...prev.days, day as MealPlanDay & { meals: (Meal & { foods: MealFood[] })[] }] }
    })
  }

  function removeDay(dayId: string) {
    setPlan(prev => {
      if (!prev) return prev
      const days = prev.days.filter(d => d.id !== dayId).map((d, i) => ({ ...d, day_number: i + 1, label: `Day ${i + 1}`, sort_order: i }))
      setExpandedDay(days.length > 0 ? days[days.length - 1].id : null)
      return { ...prev, days }
    })
  }

  function updateDayLabel(dayId: string, label: string) {
    setPlan(prev => {
      if (!prev) return prev
      return { ...prev, days: prev.days.map(d => d.id === dayId ? { ...d, label } : d) }
    })
  }

  function addFood(dayId: string, mealId: string) {
    setPlan(prev => {
      if (!prev) return prev
      return {
        ...prev,
        days: prev.days.map(d => d.id !== dayId ? d : {
          ...d,
          meals: d.meals.map(m => m.id !== mealId ? m : {
            ...m,
            foods: [...m.foods, { id: `new-${Math.random()}`, meal_id: mealId, name: '', notes: '', sort_order: m.foods.length }],
          }),
        }),
      }
    })
  }

  function updateFood(dayId: string, mealId: string, foodId: string, field: 'name' | 'notes', value: string) {
    setPlan(prev => {
      if (!prev) return prev
      return {
        ...prev,
        days: prev.days.map(d => d.id !== dayId ? d : {
          ...d,
          meals: d.meals.map(m => m.id !== mealId ? m : {
            ...m,
            foods: m.foods.map(f => f.id !== foodId ? f : { ...f, [field]: value }),
          }),
        }),
      }
    })
  }

  function removeFood(dayId: string, mealId: string, foodId: string) {
    setPlan(prev => {
      if (!prev) return prev
      return {
        ...prev,
        days: prev.days.map(d => d.id !== dayId ? d : {
          ...d,
          meals: d.meals.map(m => m.id !== mealId ? m : {
            ...m,
            foods: m.foods.filter(f => f.id !== foodId),
          }),
        }),
      }
    })
  }

  async function handleSave() {
    if (!plan || !proId) return
    setSaving(true)
    try {
      if (id) {
        await saveMealPlanFull(plan)
        navigate(`/meal-plans?pro=${proId}`)
      } else {
        const created = await createMealPlan({
          professional_id: proId,
          name: plan.name,
          description: plan.description,
          is_public: plan.is_public,
        })
        await saveMealPlanFull({ ...plan, id: created.id, share_token: created.share_token })
        navigate(`/meal-plans?pro=${proId}`)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={styles.spinner} />
  if (!plan) return null

  return (
    <div>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link to={`/meal-plans?pro=${proId}`} className={styles.backBtn}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </Link>
          <h1 className={styles.title}>{id ? 'Edit Meal Plan' : 'New Meal Plan'}</h1>
          {proName && <span className={styles.proChip}>{proName}</span>}
        </div>
        <button className={styles.saveBtn} onClick={handleSave} disabled={saving || !plan.name.trim()}>
          {saving ? 'Saving...' : 'Save Plan'}
        </button>
      </div>

      <div className={styles.form}>
        <div className={styles.formMeta}>
          <div className={styles.field}>
            <label className={styles.label}>Plan Name</label>
            <input
              className={styles.input}
              value={plan.name}
              onChange={e => updatePlanField('name', e.target.value)}
              placeholder="e.g. 7-Day Gluten-Free Starter"
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea
              className={styles.textarea}
              value={plan.description}
              onChange={e => updatePlanField('description', e.target.value)}
              placeholder="Brief description of this meal plan..."
              rows={2}
            />
          </div>
        </div>

        <div className={styles.daysSection}>
          <div className={styles.daysSectionHeader}>
            <h2 className={styles.sectionTitle}>Days ({plan.days.length})</h2>
            <button className={styles.addDayBtn} onClick={addDay}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Add Day
            </button>
          </div>

          {plan.days.map(day => (
            <div key={day.id} className={styles.dayCard}>
              <div
                className={styles.dayHeader}
                onClick={() => setExpandedDay(expandedDay === day.id ? null : day.id)}
              >
                <div className={styles.dayHeaderLeft}>
                  <span className={styles.dayNumber}>Day {day.day_number}</span>
                  <input
                    className={styles.dayLabelInput}
                    value={day.label}
                    onChange={e => { e.stopPropagation(); updateDayLabel(day.id, e.target.value) }}
                    onClick={e => e.stopPropagation()}
                    placeholder={`Day ${day.day_number}`}
                  />
                </div>
                <div className={styles.dayHeaderRight}>
                  <span className={styles.foodCount}>
                    {day.meals.reduce((sum, m) => sum + m.foods.length, 0)} items
                  </span>
                  <button
                    className={styles.removeDayBtn}
                    onClick={e => { e.stopPropagation(); removeDay(day.id) }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                  <svg
                    width="16" height="16"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{ transform: expandedDay === day.id ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }}
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
              </div>

              {expandedDay === day.id && (
                <div className={styles.dayBody}>
                  {day.meals.map(meal => (
                    <div key={meal.id} className={styles.mealSection}>
                      <div className={styles.mealHeader}>
                        <span className={styles.mealEmoji}>{MEAL_ICONS[meal.meal_type]}</span>
                        <span className={styles.mealLabel}>{MEAL_LABELS[meal.meal_type]}</span>
                        <span className={styles.mealCount}>{meal.foods.length} item{meal.foods.length !== 1 ? 's' : ''}</span>
                      </div>

                      <div className={styles.foodList}>
                        {meal.foods.map(food => (
                          <div key={food.id} className={styles.foodRow}>
                            <input
                              className={styles.foodInput}
                              value={food.name}
                              onChange={e => updateFood(day.id, meal.id, food.id, 'name', e.target.value)}
                              placeholder="Food name..."
                            />
                            <input
                              className={`${styles.foodInput} ${styles.foodNotes}`}
                              value={food.notes}
                              onChange={e => updateFood(day.id, meal.id, food.id, 'notes', e.target.value)}
                              placeholder="Notes (optional)"
                            />
                            <button
                              className={styles.removeFoodBtn}
                              onClick={() => removeFood(day.id, meal.id, food.id)}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                            </button>
                          </div>
                        ))}
                        <button className={styles.addFoodBtn} onClick={() => addFood(day.id, meal.id)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                          Add {MEAL_LABELS[meal.meal_type]} Item
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {plan.days.length === 0 && (
            <div className={styles.emptyDays}>
              <p>No days added yet.</p>
              <button className={styles.addDayBtn} onClick={addDay}>Add First Day</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
