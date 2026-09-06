import { getDb } from '../db/firebase.js';
import bcrypt from 'bcrypt';
import { User, HealthCondition, UserProfile } from '../types/index.js';

const SALT_ROUNDS = 10;

/**
 * Create user (register)
 */
export async function createUser(userData: {
  username: string;
  password: string;
  name: string;
  gender: string;
  age: number;
  diet_goal: string;
  diet_characteristics: string[];
  health_conditions: Array<{
    condition_type: string;
    details?: any;
  }>;
}): Promise<User> {
  const db = getDb();
  const passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);

  // Prepare user data
  const userDoc = {
    username: userData.username,
    password_hash: passwordHash,
    name: userData.name,
    gender: userData.gender,
    age: userData.age,
    diet_goal: userData.diet_goal,
    diet_characteristics: userData.diet_characteristics,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Save to Firestore
  const userRef = await db.collection('users').add(userDoc);
  const userId = userRef.id;

  // Save health conditions (subcollection)
  if (userData.health_conditions && userData.health_conditions.length > 0) {
    const batch = db.batch();
    userData.health_conditions.forEach(condition => {
      const conditionRef = db
        .collection('users')
        .doc(userId)
        .collection('health_conditions')
        .doc();
      batch.set(conditionRef, {
        condition_type: condition.condition_type,
        details: condition.details || {},
        created_at: new Date().toISOString()
      });
    });
    await batch.commit();
  }

  // Return user object
  return {
    id: userId,
    username: userDoc.username,
    name: userDoc.name,
    gender: userDoc.gender as any,
    age: userDoc.age,
    diet_goal: userDoc.diet_goal as any,
    diet_characteristics: userDoc.diet_characteristics,
    created_at: userDoc.created_at,
    updated_at: userDoc.updated_at
  };
}

/**
 * Find user by username
 */
export async function findUserByUsername(username: string): Promise<User | null> {
  const db = getDb();
  const snapshot = await db
    .collection('users')
    .where('username', '==', username)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  return {
    id: doc.id,
    username: data.username,
    name: data.name,
    gender: data.gender,
    age: data.age,
    diet_goal: data.diet_goal,
    diet_characteristics: data.diet_characteristics,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * Authenticate with username and password
 */
export async function authenticateUser(
  username: string,
  password: string
): Promise<User | null> {
  const db = getDb();
  const snapshot = await db
    .collection('users')
    .where('username', '==', username)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const data = doc.data();

  const isValid = await bcrypt.compare(password, data.password_hash);
  if (!isValid) {
    return null;
  }

  return {
    id: doc.id,
    username: data.username,
    name: data.name,
    gender: data.gender,
    age: data.age,
    diet_goal: data.diet_goal,
    diet_characteristics: data.diet_characteristics,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * Find user by ID
 */
export async function findUserById(userId: string): Promise<User | null> {
  const db = getDb();
  const doc = await db.collection('users').doc(userId).get();

  if (!doc.exists) {
    return null;
  }

  const data = doc.data()!;
  return {
    id: doc.id,
    username: data.username,
    name: data.name,
    gender: data.gender,
    age: data.age,
    diet_goal: data.diet_goal,
    diet_characteristics: data.diet_characteristics,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
}

/**
 * Get user profile (with health conditions)
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  const db = getDb();
  const conditionsSnapshot = await db
    .collection('users')
    .doc(userId)
    .collection('health_conditions')
    .get();

  const health_conditions: HealthCondition[] = conditionsSnapshot.docs.map(doc => ({
    id: doc.id,
    user_id: userId,
    condition_type: doc.data().condition_type,
    details: doc.data().details,
    created_at: doc.data().created_at
  }));

  return {
    user,
    health_conditions
  };
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    gender?: string;
    age?: number;
    diet_goal?: string;
    diet_characteristics?: string[];
  }
): Promise<User> {
  const db = getDb();
  const updateData: any = {
    ...updates,
    updated_at: new Date().toISOString()
  };

  await db.collection('users').doc(userId).update(updateData);

  const user = await findUserById(userId);
  return user!;
}

/**
 * Update health conditions
 */
export async function updateHealthConditions(
  userId: string,
  conditions: Array<{
    condition_type: string;
    details?: any;
  }>
): Promise<void> {
  const db = getDb();
  const existingConditions = await db
    .collection('users')
    .doc(userId)
    .collection('health_conditions')
    .get();

  const batch = db.batch();
  existingConditions.docs.forEach(doc => {
    batch.delete(doc.ref);
  });

  // Add new health conditions
  conditions.forEach(condition => {
    const conditionRef = db
      .collection('users')
      .doc(userId)
      .collection('health_conditions')
      .doc();
    batch.set(conditionRef, {
      condition_type: condition.condition_type,
      details: condition.details || {},
      created_at: new Date().toISOString()
    });
  });

  await batch.commit();
}
