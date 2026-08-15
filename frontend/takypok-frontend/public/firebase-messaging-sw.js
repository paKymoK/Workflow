// FCM background-message service worker. Runs outside the Vite/React bundle, so config is
// inlined directly rather than read from import.meta.env.
//
// PLACEHOLDER: replace every value below with your Firebase web app config (Firebase console ->
// Project settings -> General -> Your apps -> SDK setup and configuration) before deploying.
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

const firebaseConfig = {
  apiKey: "AIzaSyB6sfQANK1jw6pV5VQ7lNORGK18kABHZZQ",
  authDomain: "workflow-7b6ac.firebaseapp.com",
  projectId: "workflow-7b6ac",
  storageBucket: "workflow-7b6ac.firebasestorage.app",
  messagingSenderId: "385319271521",
  appId: "1:385319271521:web:91c4b7b3e48c93933abe20",
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification ?? {};
  self.registration.showNotification(title ?? "New notification", {
    body,
    data: payload.data,
  });
});
