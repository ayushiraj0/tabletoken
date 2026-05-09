import { useState, useEffect } from 'react';
import API from '../api/axios';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String) {
  const padding  = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64   = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData  = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotification() {
  const [permission, setPermission]   = useState(Notification.permission);
  const [subscribed, setSubscribed]   = useState(false);
  const [loading, setLoading]         = useState(false);
  const [supported, setSupported]     = useState(false);

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
    setSupported(isSupported);

    if (isSupported) {
      // Register service worker
      navigator.serviceWorker.register('/sw.js').then(reg => {
        // Check if already subscribed
        reg.pushManager.getSubscription().then(sub => {
          setSubscribed(!!sub);
        });
      }).catch(err => {
        console.error('SW registration failed:', err);
      });
    }
  }, []);

  const subscribe = async () => {
    if (!supported) return;
    setLoading(true);

    try {
      // Request permission
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== 'granted') {
        setLoading(false);
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Save subscription to server
      await API.post('/push/subscribe', { subscription });
      setSubscribed(true);
    } catch (err) {
      console.error('Push subscription failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        await API.post('/push/unsubscribe');
        setSubscribed(false);
      }
    } catch (err) {
      console.error('Unsubscribe failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return { permission, subscribed, loading, supported, subscribe, unsubscribe };
}