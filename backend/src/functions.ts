import { onRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2';
import { loadEnv } from './env.js';
import './params.js';

setGlobalOptions({ region: 'us-central1' });

let app: typeof import('./app.js').default | undefined;

async function getApp() {
  if (!app) {
    loadEnv();
    const loaded = await import('./app.js');
    app = loaded.default;
  }
  return app;
}

export const api = onRequest(
  {
    region: 'us-central1',
    invoker: 'public',
    cors: true,
    ingressSettings: 'ALLOW_ALL',
    minInstances: 1,
    timeoutSeconds: 120,
    memory: '512MiB'
  },
  async (req, res) => {
    const expressApp = await getApp();
    expressApp(req, res);
  }
);
