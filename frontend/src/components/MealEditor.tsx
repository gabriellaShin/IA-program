import { useState } from 'react';
import { MealItem } from '../types';
import './MealEditor.css';

interface MealEditorProps {
  meals: MealItem[];
  onChange: (meals: MealItem[]) => void;
  label: string;
}

function MealEditor({ meals, onChange, label }: MealEditorProps) {
  const [newMealName, setNewMealName] = useState('');

  const addMeal = () => {
    if (newMealName.trim()) {
      onChange([...meals, { name: newMealName.trim() }]);
      setNewMealName('');
    }
  };

  const removeMeal = (index: number) => {
    onChange(meals.filter((_, i) => i !== index));
  };

  const updateMeal = (index: number, name: string) => {
    const updated = [...meals];
    updated[index] = { ...updated[index], name };
    onChange(updated);
  };

  return (
    <div className="meal-editor">
      {label && <label className="meal-label">{label}</label>}
      
      <div className="meal-items">
        {meals.map((meal, index) => (
          <div key={index} className="meal-item">
            <input
              type="text"
              className="meal-input"
              value={meal.name}
              onChange={(e) => updateMeal(index, e.target.value)}
              placeholder="Food name"
            />
            <button
              type="button"
              className="btn-remove"
              onClick={() => removeMeal(index)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="meal-add">
        <input
          type="text"
          className="meal-input"
          value={newMealName}
          onChange={(e) => setNewMealName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addMeal()}
          placeholder="Add food..."
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={addMeal}
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default MealEditor;
