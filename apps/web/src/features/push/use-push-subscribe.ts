import { apiClient } from '@/shared/api';


export async function registerPushSubscription(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const reg = await navigator.serviceWorker.register('/sw.js');

    const { data } = await apiClient.get('/push/vapid-public-key');
    const vapidKey: string = data?.data?.key ?? '';
    if (!vapidKey) return;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    const existing = await reg.pushManager.getSubscription();
    if (existing) return;

    const subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: vapidKey,
    });

    const json = subscription.toJSON();
    await apiClient.post('/push/subscribe', {
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    });
  } catch {
    // push ixtiyoriy — xato bo'lsa e'tiborsiz qoldiriladi
  }
}
