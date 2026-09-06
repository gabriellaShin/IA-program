# Database Schema (Reference Only)

The `schema.sql` file in this directory is a reference PostgreSQL schema.
The application currently uses Firebase Firestore as its database.

## Collections

### users
Basic user information: username, password hash, gender, age, diet goal, diet characteristics.
Health conditions are stored as a subcollection under each user document.

### weekly_intake_records
Weekly meal intake records with AI-generated evaluation: macros, strengths, weaknesses, improvements, and cautions.

### weekly_meal_plans
AI-generated weekly meal plans including plan data, macros, rationale, shopping list, and substitutions.
