// Pixel Craft - Central Data & CMS Management
// Stores configuration, orders, and contact messages in LocalStorage

const DEFAULT_CMS_CONFIG = {
  general: {
    siteName: "Pixel Craft",
    browserTitle: "Pixel Craft — Empowering Brands With Digital Magic",
    logoType: "text", // "text" | "image" | "both"
    logoImage: "",
    logoHeight: 36,
    logoText: "Pixel Craft",
    tagline: "Empowering Brands With Digital Magic"
  },
  hero: {
    title: "Empowering Brands With Digital Magic",
    subtitle: "Empowering brands with digital magic is target, and magic in a creative agency or portfolio.",
    primaryBtnText: "Start a Project",
    primaryBtnLink: "#contact",
    videoBtnText: "Watch Video",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"
  },
  services: [
    {
      id: "srv-1",
      title: "Web Development",
      description: "Nec sed condimentum, web development convallis feugiat description.",
      icon: "fa-solid fa-code"
    },
    {
      id: "srv-2",
      title: "UI/UX Design",
      description: "Design are-web-motivation, design, meditation 2-2-3 design.",
      icon: "fa-solid fa-layer-group"
    },
    {
      id: "srv-3",
      title: "Digital Marketing",
      description: "Digital marketing marketing making relevant versimaltes and consideration.",
      icon: "fa-solid fa-bullhorn"
    }
  ],
  about: {
    title: "About Us",
    imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
    features: [
      { id: "feat-1", title: "Responsive Design", description: "Responsive design, alat, and attentiont" },
      { id: "feat-2", title: "Modern Tech Stack", description: "Modern com ceremen the solutions" },
      { id: "feat-3", title: "24/7 Support", description: "Round-the-clock technical guidance and assistance" }
    ]
  },
  pricing: [
    {
      id: "plan-1",
      name: "Basic",
      price: 49,
      period: "/mo",
      popular: false,
      badge: "",
      ctaText: "Order Now",
      features: [
        "Basic Features",
        "Modern Tech Stack",
        "24/7 Support"
      ]
    },
    {
      id: "plan-2",
      name: "Pro",
      price: 79,
      period: "/mo",
      popular: true,
      badge: "Popular",
      ctaText: "Order Now",
      features: [
        "Basic Features",
        "Modern Tech Stack",
        "24/7 Support"
      ]
    },
    {
      id: "plan-3",
      name: "Enterprise",
      price: 139,
      period: "/mo",
      popular: false,
      badge: "",
      ctaText: "Order Now",
      features: [
        "Basic Features",
        "Modern Tech Stack",
        "Enterprise Marketing"
      ]
    }
  ],
  ordering: {
    enabled: true,
    mode: "modal", // "modal" | "whatsapp" | "contact"
    currency: "$",
    defaultCtaText: "Order Now",
    requirePhone: true,
    requireCompany: false,
    autoConfirm: true,
    confirmTitle: "Order Confirmed! Thank You",
    confirmMessage: "Your order has been received successfully! Our client onboarding manager will contact you within 2-4 business hours to finalize your setup.",
    whatsappNumber: "+1234567890",
    whatsappMessage: "Hi Pixel Craft! I placed an order for the {plan} plan ({currency}{price}{period}). My Order ID is {orderId}."
  },
  contact: {
    title: "Get In Touch",
    phone: "(015) 232-7880",
    email: "email@pixelcraft.com",
    address: "222 H. Address Street,\nHank, 38003"
  },
  footer: {
    brandText: "Pixel Craft",
    copyright: "Copyright Pixel Craft. All rights reserved.",
    socials: {
      instagram: "https://instagram.com",
      twitter: "https://twitter.com",
      facebook: "https://facebook.com",
      youtube: "https://youtube.com"
    }
  }
};

const STORAGE_KEY_CONFIG = "pixelcraft_cms_config";
const STORAGE_KEY_MESSAGES = "pixelcraft_messages";
const STORAGE_KEY_ORDERS = "pixelcraft_orders";
const STORAGE_KEY_AUTH = "pixelcraft_admin_session";
const STORAGE_KEY_CREDENTIALS = "pixelcraft_admin_creds";

// Fetch Current CMS Data (Deep-merging defaults for schema safety)
function getCMSData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) {
      saveCMSData(DEFAULT_CMS_CONFIG);
      return JSON.parse(JSON.stringify(DEFAULT_CMS_CONFIG));
    }
    const parsed = JSON.parse(raw);
    
    // Deep merge to ensure all new keys (like ordering, logoType, etc.) always exist
    const merged = {
      ...DEFAULT_CMS_CONFIG,
      ...parsed,
      general: { ...DEFAULT_CMS_CONFIG.general, ...(parsed.general || {}) },
      hero: { ...DEFAULT_CMS_CONFIG.hero, ...(parsed.hero || {}) },
      about: { ...DEFAULT_CMS_CONFIG.about, ...(parsed.about || {}) },
      ordering: { ...DEFAULT_CMS_CONFIG.ordering, ...(parsed.ordering || {}) },
      contact: { ...DEFAULT_CMS_CONFIG.contact, ...(parsed.contact || {}) },
      footer: { 
        ...DEFAULT_CMS_CONFIG.footer, 
        ...(parsed.footer || {}),
        socials: { ...DEFAULT_CMS_CONFIG.footer.socials, ...((parsed.footer && parsed.footer.socials) || {}) }
      },
      pricing: Array.isArray(parsed.pricing) ? parsed.pricing : DEFAULT_CMS_CONFIG.pricing,
      services: Array.isArray(parsed.services) ? parsed.services : DEFAULT_CMS_CONFIG.services
    };

    return merged;
  } catch (err) {
    console.error("Failed to load CMS data:", err);
    return JSON.parse(JSON.stringify(DEFAULT_CMS_CONFIG));
  }
}

// Save CMS Data
function saveCMSData(data) {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(data));
    // Dispatch a custom event for same-tab updates
    window.dispatchEvent(new CustomEvent("cms-updated", { detail: data }));
    
    // Sync to Firebase Cloud Firestore if initialized
    if (typeof syncConfigToFirebase === "function" && typeof isFirebaseInitialized === "function" && isFirebaseInitialized()) {
      syncConfigToFirebase(data).catch(err => console.warn("Background Firebase config sync:", err));
    }
    return true;
  } catch (err) {
    console.error("Failed to save CMS data:", err);
    return false;
  }
}

// Reset CMS Data to Default
function resetCMSData() {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(DEFAULT_CMS_CONFIG));
    window.dispatchEvent(new CustomEvent("cms-updated", { detail: DEFAULT_CMS_CONFIG }));
    
    // Sync reset to Firebase Cloud Firestore if initialized
    if (typeof syncConfigToFirebase === "function" && typeof isFirebaseInitialized === "function" && isFirebaseInitialized()) {
      syncConfigToFirebase(DEFAULT_CMS_CONFIG).catch(err => console.warn("Background Firebase reset sync:", err));
    }
    return true;
  } catch (err) {
    console.error("Failed to reset CMS data:", err);
    return false;
  }
}

// ==================== CUSTOMER ORDERS MANAGEMENT ====================
function getOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ORDERS);
    if (!raw) {
      // Seed with initial sample orders for realistic admin demonstration
      const initialOrders = [
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
          notes: "Need fast onboarding and help configuring our custom domain.",
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
      localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(initialOrders));
      return initialOrders;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load orders:", err);
    return [];
  }
}

function saveNewOrder(orderData) {
  try {
    const list = getOrders();
    const config = getCMSData();
    const isAutoConfirm = config.ordering && config.ordering.autoConfirm;
    
    // Generate clean 5-digit Order ID
    const randomId = Math.floor(10000 + Math.random() * 90000);
    const orderId = "ORD-" + randomId;

    const newOrder = {
      id: orderId,
      planId: orderData.planId || "plan-custom",
      planName: orderData.planName || "Selected Plan",
      price: orderData.price || 0,
      period: orderData.period || "/mo",
      customerName: orderData.customerName || "Anonymous Customer",
      customerEmail: orderData.customerEmail || "",
      customerPhone: orderData.customerPhone || "",
      customerCompany: orderData.customerCompany || "",
      paymentMethod: orderData.paymentMethod || "Credit Card / Stripe",
      notes: orderData.notes || "",
      status: isAutoConfirm ? "Confirmed" : "Pending",
      date: new Date().toLocaleString(),
      timestamp: Date.now()
    };

    list.unshift(newOrder);
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("orders-updated", { detail: list }));

    // Push new order to Firebase Cloud Firestore
    if (typeof pushOrderToFirebase === "function" && typeof isFirebaseInitialized === "function" && isFirebaseInitialized()) {
      pushOrderToFirebase(newOrder).catch(err => console.warn("Background Firebase order push:", err));
    }

    return newOrder;
  } catch (err) {
    console.error("Failed to save new order:", err);
    return null;
  }
}

function updateOrderStatus(id, newStatus) {
  try {
    const list = getOrders().map(o => {
      if (o.id === id) {
        o.status = newStatus;
      }
      return o;
    });
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("orders-updated", { detail: list }));

    // Update order status in Firebase Cloud Firestore
    if (typeof updateOrderInFirebase === "function" && typeof isFirebaseInitialized === "function" && isFirebaseInitialized()) {
      updateOrderInFirebase(id, newStatus).catch(err => console.warn("Background Firebase status update:", err));
    }

    return true;
  } catch (err) {
    console.error("Failed to update order status:", err);
    return false;
  }
}

function deleteOrder(id) {
  try {
    const list = getOrders().filter(o => o.id !== id);
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("orders-updated", { detail: list }));

    // Delete order from Firebase Cloud Firestore
    if (typeof deleteOrderInFirebase === "function" && typeof isFirebaseInitialized === "function" && isFirebaseInitialized()) {
      deleteOrderInFirebase(id).catch(err => console.warn("Background Firebase order delete:", err));
    }

    return true;
  } catch (err) {
    console.error("Failed to delete order:", err);
    return false;
  }
}

function clearAllOrders() {
  try {
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("orders-updated", { detail: [] }));
    return true;
  } catch (err) {
    return false;
  }
}

// ==================== CONTACT MESSAGES MANAGEMENT ====================
function getMessages() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) {
      const initial = [
        {
          id: "msg-101",
          name: "Alex Johnson",
          email: "alex@example.com",
          message: "Hi Pixel Craft team, we need a complete brand identity revamp and a new marketing website. What is your estimated timeline?",
          date: new Date(Date.now() - 3600000 * 4).toLocaleString(),
          read: true
        },
        {
          id: "msg-102",
          name: "Sarah Miller",
          email: "sarah.m@techcorp.io",
          message: "Interested in the Pro Plan ($79/mo). Can we schedule a quick discovery call this week?",
          date: new Date(Date.now() - 3600000 * 18).toLocaleString(),
          read: false
        }
      ];
      localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to load messages:", err);
    return [];
  }
}

function saveNewMessage(msg) {
  try {
    const list = getMessages();
    const newEntry = {
      id: "msg-" + Date.now(),
      name: msg.name,
      email: msg.email,
      message: msg.message,
      date: new Date().toLocaleString(),
      read: false
    };
    list.unshift(newEntry);
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("messages-updated", { detail: list }));

    // Push new contact message to Firebase Cloud Firestore
    if (typeof pushMessageToFirebase === "function" && typeof isFirebaseInitialized === "function" && isFirebaseInitialized()) {
      pushMessageToFirebase(newEntry).catch(err => console.warn("Background Firebase message push:", err));
    }

    return newEntry;
  } catch (err) {
    console.error("Failed to save message:", err);
    return null;
  }
}

function deleteMessage(id) {
  try {
    const list = getMessages().filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("messages-updated", { detail: list }));

    // Delete message from Firebase Cloud Firestore
    if (typeof deleteMessageInFirebase === "function" && typeof isFirebaseInitialized === "function" && isFirebaseInitialized()) {
      deleteMessageInFirebase(id).catch(err => console.warn("Background Firebase message delete:", err));
    }

    return true;
  } catch (err) {
    console.error("Failed to delete message:", err);
    return false;
  }
}

function markMessageRead(id) {
  try {
    const list = getMessages().map(m => {
      if (m.id === id) m.read = true;
      return m;
    });
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("messages-updated", { detail: list }));

    // Update message read status in Firebase Cloud Firestore
    if (typeof updateMessageInFirebase === "function" && typeof isFirebaseInitialized === "function" && isFirebaseInitialized()) {
      updateMessageInFirebase(id, { read: true }).catch(err => console.warn("Background Firebase message read update:", err));
    }

    return true;
  } catch (err) {
    return false;
  }
}

function clearAllMessages() {
  try {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent("messages-updated", { detail: [] }));
    return true;
  } catch (err) {
    return false;
  }
}

// ==================== ADMIN AUTHENTICATION ====================
function getAdminCredentials() {
  try {
    const creds = localStorage.getItem(STORAGE_KEY_CREDENTIALS);
    if (!creds) {
      return { username: "admin", password: "admin123" };
    }
    return JSON.parse(creds);
  } catch (e) {
    return { username: "admin", password: "admin123" };
  }
}

function updateAdminCredentials(newUsername, newPassword) {
  try {
    localStorage.setItem(STORAGE_KEY_CREDENTIALS, JSON.stringify({
      username: newUsername,
      password: newPassword
    }));
    return true;
  } catch (e) {
    return false;
  }
}

function checkAdminAuth() {
  return sessionStorage.getItem(STORAGE_KEY_AUTH) === "authenticated";
}

function loginAdmin(username, password) {
  const creds = getAdminCredentials();
  if (username === creds.username && password === creds.password) {
    sessionStorage.setItem(STORAGE_KEY_AUTH, "authenticated");
    return true;
  }
  return false;
}

function logoutAdmin() {
  sessionStorage.removeItem(STORAGE_KEY_AUTH);
}
