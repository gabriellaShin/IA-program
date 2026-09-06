import admin from 'firebase-admin';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

let firestore: admin.firestore.Firestore | undefined;

export function initializeFirebase(): void {
  if (admin.apps.length > 0) {
    return;
  }

  const serviceAccountPath = join(__dirname, '../../firebase-service-account.json');
  if (existsSync(serviceAccountPath)) {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    return;
  }

  admin.initializeApp();
}

export function getDb() {
  initializeFirebase();
  if (!firestore) {
    firestore = admin.firestore();
    firestore.settings({ ignoreUndefinedProperties: true });
  }
  return firestore;
}
