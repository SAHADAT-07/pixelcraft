// =========================================================================
// Pixel Craft — Firebase Cloud Database Integration
// Provides real-time cloud data storage for:
// 1. Website CMS Configuration (Collection: 'config', Document: 'cms')
// 2. Customer Orders (Collection: 'orders')
// 3. Contact Inquiries (Collection: 'messages')
// =========================================================================

// =========================================================================
// 🔑 OPTION 1: PASTE YOUR FIREBASE CREDENTIALS DIRECTLY HERE IN CODE
// (You can get these from: Firebase Console -> Project Settings -> General -> Your apps)
// If you paste your keys below, Firebase connects automatically on page load!
// =========================================================================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyD9bOZt7Y7DfUQHQqifTeSyItSUbLE8U-Q",
  authDomain: "pixelcraft22-dbdd4.firebaseapp.com",
  projectId: "pixelcraft22-dbdd4",
  storageBucket: "pixelcraft22-dbdd4.firebasestorage.app",
  messagingSenderId: "523777454888",
  appId: "1:523777454888:web:171f4a262455ccf0c0561d",
  measurementId: "G-JK1DKQ3MHR"
};

const STORAGE_KEY_FIREBASE = "pixelcraft_firebase_config";

let firebaseApp = null;
let firestoreDb = null;
let firebaseAnalytics = null;
let isCloudConnected = false;
let unsubscribeConfigListener = null;
let unsubscribeOrdersListener = null;
let unsubscribeMessagesListener = null;

// Resolve active Firebase config (checks localStorage overrides, falls back to code config)
function getFirebaseConfig() {
  const codeDefaults = {
    enabled: !!(FIREBASE_CONFIG.apiKey && FIREBASE_CONFIG.projectId),
    apiKey: FIREBASE_CONFIG.apiKey || "",
    authDomain: FIREBASE_CONFIG.authDomain || (FIREBASE_CONFIG.projectId ? `${FIREBASE_CONFIG.projectId}.firebaseapp.com` : ""),
    projectId: FIREBASE_CONFIG.projectId || "",
    storageBucket: FIREBASE_CONFIG.storageBucket || (FIREBASE_CONFIG.projectId ? `${FIREBASE_CONFIG.projectId}.firebasestorage.app` : ""),
    messagingSenderId: FIREBASE_CONFIG.messagingSenderId || "",
    appId: FIREBASE_CONFIG.appId || "",
    measurementId: FIREBASE_CONFIG.measurementId || ""
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY_FIREBASE);
    if (!raw) return codeDefaults;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return Object.assign({}, codeDefaults, parsed);
    }
  } catch (e) {
    console.warn("Could not read stored Firebase config:", e);
  }

  return codeDefaults;
}

// Save Firebase config to localStorage
function saveFirebaseConfig(cfg) {
  try {
    localStorage.setItem(STORAGE_KEY_FIREBASE, JSON.stringify(cfg));
    return true;
  } catch (e) {
    console.error("Failed to save Firebase config:", e);
    return false;
  }
}

// Check if Firebase is initialized
function isFirebaseInitialized() {
  return !!(firebaseApp && firestoreDb && isCloudConnected);
}

function getFirestoreDB() {
  return firestoreDb;
}

// Initialize Firebase App & Firestore Database
function initFirebaseApp() {
  const config = getFirebaseConfig();

  // If Firebase is not enabled or credentials are empty, operate in local mode
  if (!config.enabled || !config.apiKey || !config.projectId) {
    isCloudConnected = false;
    window.dispatchEvent(new CustomEvent("firebase-status-changed", { 
      detail: { connected: false, reason: "disabled" } 
    }));
    return false;
  }

  // Check if Firebase SDK is loaded
  if (typeof firebase === "undefined" || !firebase.initializeApp) {
    console.warn("Firebase SDK script not loaded yet. Running in local storage fallback mode.");
    isCloudConnected = false;
    window.dispatchEvent(new CustomEvent("firebase-status-changed", { 
      detail: { connected: false, reason: "sdk_missing" } 
    }));
    return false;
  }

  try {
    // Initialize or reuse default app
    if (!firebase.apps.length) {
      firebaseApp = firebase.initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
        measurementId: config.measurementId || ""
      });
    } else {
      firebaseApp = firebase.app();
    }

    firestoreDb = firebase.firestore();

    // Initialize Analytics if measurementId is available and SDK is loaded
    if (config.measurementId && typeof firebase.analytics === "function") {
      try {
        firebaseAnalytics = firebase.analytics();
        console.log("%c[Firebase Analytics]%c Initialized — measurementId:", "color:#f59e0b;font-weight:bold", "color:#10b981", config.measurementId);
      } catch (analyticsErr) {
        console.warn("[Firebase Analytics] Could not initialize:", analyticsErr.message);
      }
    }

    isCloudConnected = true;

    // Attach real-time Firestore listeners
    setupCloudRealtimeListeners();

    window.dispatchEvent(new CustomEvent("firebase-status-changed", { 
      detail: { connected: true, projectId: config.projectId } 
    }));
    console.log(`%c[Firebase]%c Connected to Firestore database: ${config.projectId}`, "color: #f59e0b; font-weight: bold", "color: #10b981; font-weight: bold");
    return true;
  } catch (err) {
    console.error("Failed to initialize Firebase:", err);
    isCloudConnected = false;
    window.dispatchEvent(new CustomEvent("firebase-status-changed", { 
      detail: { connected: false, error: err.message } 
    }));
    return false;
  }
}

// Log Custom Events to Firebase Analytics (e.g. page_view, order, inquiry, cta_click)
function logFirebaseEvent(eventName, eventParams = {}) {
  try {
    if (firebaseAnalytics && typeof firebaseAnalytics.logEvent === "function") {
      firebaseAnalytics.logEvent(eventName, eventParams);
      console.log(`%c[Firebase Analytics]%c Event logged: "${eventName}"`, "color:#f59e0b;font-weight:bold", "color:#3b82f6", eventParams);
      return true;
    }
  } catch (err) {
    console.debug("[Firebase Analytics] Event log notice:", err.message);
  }
  return false;
}

if (typeof window !== "undefined") {
  window.logFirebaseEvent = logFirebaseEvent;
  window.getFirebaseAnalytics = () => firebaseAnalytics;
}

// ==================== REALTIME CLOUD LISTENERS ====================
function setupCloudRealtimeListeners() {
  if (!firestoreDb) return;

  try {
    // 1. CMS Config Listener (Collection: 'config', Document: 'cms')
    if (unsubscribeConfigListener) unsubscribeConfigListener();
    unsubscribeConfigListener = firestoreDb.collection("config").doc("cms").onSnapshot(
      (doc) => {
        if (doc.exists) {
          const cloudData = doc.data();
          if (cloudData && typeof cloudData === "object") {
            localStorage.setItem("pixelcraft_cms_config", JSON.stringify(cloudData));
            window.dispatchEvent(new CustomEvent("cms-updated", { detail: cloudData }));
          }
        }
      },
      (err) => {
        console.warn("Firestore config listener notice:", err.message);
      }
    );

    // 2. Orders Realtime Listener (Collection: 'orders')
    if (unsubscribeOrdersListener) unsubscribeOrdersListener();
    unsubscribeOrdersListener = firestoreDb.collection("orders").orderBy("timestamp", "desc").onSnapshot(
      (snapshot) => {
        const cloudOrders = [];
        snapshot.forEach((doc) => {
          cloudOrders.push(doc.data());
        });
        if (cloudOrders.length > 0) {
          localStorage.setItem("pixelcraft_orders", JSON.stringify(cloudOrders));
          window.dispatchEvent(new CustomEvent("orders-updated", { detail: cloudOrders }));
        }
      },
      (err) => {
        console.warn("Firestore orders listener notice:", err.message);
      }
    );

    // 3. Contact Messages Listener (Collection: 'messages')
    if (unsubscribeMessagesListener) unsubscribeMessagesListener();
    unsubscribeMessagesListener = firestoreDb.collection("messages").orderBy("timestamp", "desc").onSnapshot(
      (snapshot) => {
        const cloudMessages = [];
        snapshot.forEach((doc) => {
          cloudMessages.push(doc.data());
        });
        if (cloudMessages.length > 0) {
          localStorage.setItem("pixelcraft_messages", JSON.stringify(cloudMessages));
          window.dispatchEvent(new CustomEvent("messages-updated", { detail: cloudMessages }));
        }
      },
      (err) => {
        console.warn("Firestore messages listener notice:", err.message);
      }
    );
  } catch (err) {
    console.warn("Could not attach Firestore listeners:", err);
  }
}

// ==================== DATABASE CRUD OPERATIONS ====================

// Push CMS Config to Firestore: collection('config').doc('cms')
async function syncConfigToFirebase(data) {
  if (!isFirebaseInitialized()) return false;
  try {
    await firestoreDb.collection("config").doc("cms").set(data, { merge: true });
    return true;
  } catch (err) {
    console.error("Firebase config sync error:", err);
    return false;
  }
}

// Push Customer Order to Firestore: collection('orders').doc(order.id)
async function pushOrderToFirebase(order) {
  if (!isFirebaseInitialized()) return false;
  try {
    await firestoreDb.collection("orders").doc(order.id).set(order);
    return true;
  } catch (err) {
    console.error("Firebase order push error:", err);
    return false;
  }
}

// Update Order Status in Firestore
async function updateOrderInFirebase(orderId, newStatus) {
  if (!isFirebaseInitialized()) return false;
  try {
    await firestoreDb.collection("orders").doc(orderId).update({ status: newStatus });
    return true;
  } catch (err) {
    console.error("Firebase order status update error:", err);
    return false;
  }
}

// Delete Order from Firestore
async function deleteOrderInFirebase(orderId) {
  if (!isFirebaseInitialized()) return false;
  try {
    await firestoreDb.collection("orders").doc(orderId).delete();
    return true;
  } catch (err) {
    console.error("Firebase order delete error:", err);
    return false;
  }
}

// Push Contact Message to Firestore: collection('messages').doc(msg.id)
async function pushMessageToFirebase(msg) {
  if (!isFirebaseInitialized()) return false;
  try {
    await firestoreDb.collection("messages").doc(msg.id).set(msg);
    return true;
  } catch (err) {
    console.error("Firebase message push error:", err);
    return false;
  }
}

// Update Message Status in Firestore
async function updateMessageInFirebase(msgId, data) {
  if (!isFirebaseInitialized()) return false;
  try {
    await firestoreDb.collection("messages").doc(msgId).update(data);
    return true;
  } catch (err) {
    console.error("Firebase message update error:", err);
    return false;
  }
}

// Delete Message from Firestore
async function deleteMessageInFirebase(msgId) {
  if (!isFirebaseInitialized()) return false;
  try {
    await firestoreDb.collection("messages").doc(msgId).delete();
    return true;
  } catch (err) {
    console.error("Firebase message delete error:", err);
    return false;
  }
}

// ==================== DATABASE SEED & MIGRATION ====================

// Initialize and seed empty Firestore collections with default website data
async function seedFirestoreDatabase(customDb = null) {
  const db = customDb || firestoreDb;
  if (!db) {
    throw new Error("Firestore database is not connected.");
  }

  const results = { config: false, ordersCount: 0, messagesCount: 0 };

  // 1. Seed CMS Configuration
  const defaultCms = (typeof DEFAULT_CMS_CONFIG !== "undefined") 
    ? DEFAULT_CMS_CONFIG 
    : ((typeof getCMSData === "function") ? getCMSData() : null);

  if (defaultCms) {
    await db.collection("config").doc("cms").set(defaultCms);
    results.config = true;
  }

  // 2. Seed Sample Orders
  const sampleOrders = [
    {
      id: "ORD-73910",
      planId: "plan-2",
      planName: "Pro",
      price: 79,
      period: "/mo",
      customerName: "Sarah Miller",
      customerEmail: "sarah.m@techcorp.io",
      customerPhone: "+1 (555) 349-2810",
      customerCompany: "TechCorp Labs",
      paymentMethod: "Credit Card / Stripe",
      notes: "Need fast onboarding and help configuring custom domain.",
      status: "Confirmed",
      date: new Date(Date.now() - 3600000 * 3).toLocaleString(),
      timestamp: Date.now() - 3600000 * 3
    },
    {
      id: "ORD-84192",
      planId: "plan-3",
      planName: "Enterprise",
      price: 139,
      period: "/mo",
      customerName: "David Chen",
      customerEmail: "david.c@vertexgrowth.com",
      customerPhone: "+1 (555) 892-1144",
      customerCompany: "Vertex Growth Group",
      paymentMethod: "Bank Transfer / Wire",
      notes: "Interested in dedicated account manager and SLA.",
      status: "Pending",
      date: new Date(Date.now() - 3600000 * 14).toLocaleString(),
      timestamp: Date.now() - 3600000 * 14
    }
  ];

  const ordersBatch = db.batch();
  sampleOrders.forEach((ord) => {
    const ref = db.collection("orders").doc(ord.id);
    ordersBatch.set(ref, ord);
  });
  await ordersBatch.commit();
  results.ordersCount = sampleOrders.length;

  // 3. Seed Sample Inquiries
  const sampleMessages = [
    {
      id: "msg-101",
      name: "Alex Johnson",
      email: "alex@example.com",
      message: "Hi Pixel Craft team, we need a complete brand identity revamp and a new marketing website. What is your estimated timeline?",
      date: new Date(Date.now() - 3600000 * 4).toLocaleString(),
      timestamp: Date.now() - 3600000 * 4,
      read: true
    },
    {
      id: "msg-102",
      name: "Sarah Miller",
      email: "sarah.m@techcorp.io",
      message: "Interested in the Pro Plan ($79/mo). Can we schedule a quick discovery call this week?",
      date: new Date(Date.now() - 3600000 * 18).toLocaleString(),
      timestamp: Date.now() - 3600000 * 18,
      read: false
    }
  ];

  const messagesBatch = db.batch();
  sampleMessages.forEach((msg) => {
    const ref = db.collection("messages").doc(msg.id);
    messagesBatch.set(ref, msg);
  });
  await messagesBatch.commit();
  results.messagesCount = sampleMessages.length;

  return results;
}

// Upload current local storage data up to Firestore Cloud
async function migrateAllLocalDataToFirebase() {
  if (!isFirebaseInitialized()) {
    throw new Error("Firebase is not connected. Please enter your credentials and test connection first.");
  }

  const results = { config: false, orders: 0, messages: 0 };

  // 1. Upload CMS Config
  const cmsData = (typeof getCMSData === "function") ? getCMSData() : null;
  if (cmsData) {
    await firestoreDb.collection("config").doc("cms").set(cmsData);
    results.config = true;
  }

  // 2. Upload Customer Orders
  const orders = (typeof getOrders === "function") ? getOrders() : [];
  if (orders.length > 0) {
    const batch = firestoreDb.batch();
    orders.forEach((ord) => {
      const ref = firestoreDb.collection("orders").doc(ord.id);
      batch.set(ref, ord);
    });
    await batch.commit();
    results.orders = orders.length;
  }

  // 3. Upload Contact Messages
  const messages = (typeof getMessages === "function") ? getMessages() : [];
  if (messages.length > 0) {
    const batch = firestoreDb.batch();
    messages.forEach((msg) => {
      const ref = firestoreDb.collection("messages").doc(msg.id);
      batch.set(ref, msg);
    });
    await batch.commit();
    results.messages = messages.length;
  }

  return results;
}

// Test Firebase Connection actively by pinging a test doc
async function testFirebaseConnection(customConfig = null) {
  const cfg = customConfig || getFirebaseConfig();

  if (!cfg.apiKey || !cfg.projectId) {
    return { success: false, message: "API Key and Project ID are required." };
  }

  if (typeof firebase === "undefined") {
    return { success: false, message: "Firebase SDK is not loaded. Please check your internet connection." };
  }

  try {
    const testAppName = "firebase-test-" + Date.now();
    const testApp = firebase.initializeApp({
      apiKey: cfg.apiKey,
      authDomain: cfg.authDomain || `${cfg.projectId}.firebaseapp.com`,
      projectId: cfg.projectId,
      storageBucket: cfg.storageBucket || `${cfg.projectId}.firebasestorage.app`,
      messagingSenderId: cfg.messagingSenderId || "",
      appId: cfg.appId || "",
      measurementId: cfg.measurementId || ""
    }, testAppName);

    const testDb = testApp.firestore();

    // Ping test document in Firestore
    const pingRef = testDb.collection("_system_ping").doc("test_connection");
    await pingRef.set({
      ping: true,
      timestamp: Date.now()
    });
    await pingRef.delete();

    // Clean up temporary app instance
    await testApp.delete();

    return {
      success: true,
      message: `Successfully connected to Firebase Cloud Firestore project "${cfg.projectId}"!`
    };
  } catch (err) {
    return {
      success: false,
      message: err.message || "Failed to connect. Check your Project ID and ensure Firestore Database is created in Test Mode."
    };
  }
}

// Auto-initialize when script loads
document.addEventListener("DOMContentLoaded", () => {
  initFirebaseApp();
});
