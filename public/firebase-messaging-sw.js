// public/firebase-messaging-sw.js
// This file MUST live in /public and be served from the root of the domain.
// Next.js serves /public/* as static files — no config needed.

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            self.FIREBASE_API_KEY            || '__FIREBASE_API_KEY__',
  authDomain:        self.FIREBASE_AUTH_DOMAIN        || '__FIREBASE_AUTH_DOMAIN__',
  projectId:         self.FIREBASE_PROJECT_ID         || '__FIREBASE_PROJECT_ID__',
  storageBucket:     self.FIREBASE_STORAGE_BUCKET     || '__FIREBASE_STORAGE_BUCKET__',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID|| '__FIREBASE_MESSAGING_SENDER_ID__',
  appId:             self.FIREBASE_APP_ID             || '__FIREBASE_APP_ID__',
});

// NOTE: Replace the __FIREBASE_*__ placeholders with your actual config values
// before deploying. Service workers cannot access process.env.

const messaging = firebase.messaging();

// Handle background notifications (app not in focus)
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification ?? {};
  if (!title) return;

  self.registration.showNotification(title, {
    body:  body ?? '',
    icon:  '/icon-192.png',
    badge: '/badge-72.png',
    data:  payload.data ?? {},
  });
});

// Open or focus the app when notification is clicked
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const postId = event.notification.data?.postId;
  const url = postId ? `/?postId=${postId}` : '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
