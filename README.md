# Pixel Craft — Landing Page & Dynamic Admin Control Panel

A responsive digital agency landing page with an interactive **Admin Control Panel (CMS)**. Easily change website brand names, upload custom logos, configure live previews, manage online ordering and order confirmations, update product pricing, and track customer orders and inquiries without touching code!

---

## 🚀 Live Admin Panel Features

### 1. 🖥️ Real-Time Live Preview Changes
- **Split-Screen Live Preview**: Toggle side-by-side split view with a single click in the admin header. Edit any content, brand, or price on the left and see it update instantly on the right.
- **Dedicated Live Website Preview Tab**: Full responsive preview sandbox with device switchers:
  - 🖥️ **Desktop** (100% full width)
  - 📱 **Tablet** (768px viewport)
  - 📲 **Mobile** (375px viewport)
- **Zero-Latency Live Sync**: Instant updates as you type in headings, subtitles, button texts, or logos without requiring manual page reloads.

### 2. 🎨 Brand & Logo Customization ("Logo Change")
- **Logo Display Modes**:
  - **Text Only**: Displays the custom brand text.
  - **Image Logo Only**: Displays a clean graphic logo.
  - **Image + Text**: Displays the graphic logo alongside your brand name.
- **Upload Logo File**: Directly upload PNG, SVG, JPG, or WebP logo files from your computer (auto-converted to base64 Data URLs).
- **Direct Image URL**: Paste any hosted image URL.
- **Logo Sizing Slider**: Adjust navbar logo scale from `20px` to `70px` with instant live preview.
- **Dual Live Preview**: View how the logo looks on the dark navbar and footer in real-time.

### 3. 🛒 Ordering & Order Confirmation Settings
- **Online Order Acceptance Toggle**: Turn online ordering ON or OFF with 1 click.
- **3 Flexible Public Ordering Modes**:
  1. **Interactive Order Modal (Recommended)**: Pop-up checkout on the public site with customer info, payment preference, and instant confirmation receipt with unique Order ID (`#ORD-XXXXX`).
  2. **WhatsApp Instant Ordering**: Directs clients to your WhatsApp business number with a preformatted order message containing plan name, price, and order ID.
  3. **Contact Form Inquiry**: Smoothly scrolls to the contact section with plan inquiry prefilled.
- **Order Confirmation Message Customization**:
  - Custom Confirmation Headline (e.g., *"Order Confirmed! Thank You"*).
  - Custom Confirmation Message & Next Steps (e.g., *"Your order has been received successfully. Our team will contact you within 2-4 hours..."*).
  - Configurable Phone Requirement & Auto-Confirmation.
- **Currency & Button Controls**: Set your custom currency symbol (`$`, `€`, `£`, `₹`, `৳`) and global plan button text (*"Order Now"*, *"Choose Plan"*, etc.).

### 4. 📦 Customer Orders Management
- **Orders Dashboard**: Track total orders received, confirmed orders, pending orders, and total estimated revenue.
- **Interactive Orders Table**: View Order ID, customer name, email, phone, plan, price, payment method, date, and status.
- **Status Workflows**: Update order status between `Pending`, `Confirmed`, `Completed`, and `Cancelled`.
- **Order Details Modal**: Inspect full order details, customer notes, company name, and reply directly via email (`mailto:`).

### 5. 💰 Product & Pricing Management
- **Price Changes**: Edit pricing amounts for any tier ($49, $79, $139, etc.).
- **Plan Names & Billing Cycles**: Modify tier names and billing periods (`/mo`, `/year`, `/one-time`).
- **Feature Bullet Points**: Add, edit, or delete checklist bullet points for each plan.
- **Popular Badge**: Highlight top-tier plans with a high-visibility badge.
- **Add / Remove Plans**: Create new custom tiers or remove existing ones.

### 6. 🛠️ Hero Section, Services & About Us Manager
- **Hero Section**: Edit headline, description, call-to-action button, link, and video showcase embed URL.
- **What We Do (Services)**: Add, edit, or remove service cards with custom Font Awesome icons.
- **About Us**: Customize team photo URL, section headline, and benefits checklist.

### 7. 📬 Visitor Inquiries Inbox
- View messages submitted through the website's contact form.
- Mark inquiries as read, reply via one-click email, or delete messages.

### 8. 🔥 Firebase Cloud Storage & Real-Time Multi-Device Sync
- **Cloud Firestore Database**: Store your CMS configuration, incoming customer orders, and visitor inquiries in Google Cloud Firestore.
- **Real-Time Cross-Device Sync**: Any order placed on mobile or another computer instantly updates the Admin Panel in real time via Firestore `onSnapshot` listeners.
- **Hybrid Offline / Cloud Mode**: Seamlessly works locally in browser `localStorage` if Firebase is disabled, or syncs to the cloud when Firebase credentials are configured.
- **One-Click Cloud Migration**: Easily push all current local content, orders, and inquiries to Firebase Cloud Firestore from the **Firebase Cloud** tab in the Admin Panel.
- **Connection Verifier**: Test your Firebase credentials with a built-in interactive ping tool.

### 9. 💾 Backup & Reset
- **Export Backup (JSON)**: Download your complete website configuration.
- **Import Backup**: Upload a `.json` backup file to restore settings.
- **Factory Reset**: Revert back to original default settings anytime.

---

## 🔥 How to Connect Firebase to This Project

You can connect Firebase Cloud Firestore in 4 simple steps without touching code:

1. **Create a Free Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com).
   - Click **"Add project"** and name it (e.g., `pixel-craft`).

2. **Register a Web App**:
   - In the project dashboard, click the Web icon (`</>`).
   - Give it an App nickname (e.g., `PixelCraft Web`) and click **"Register app"**.
   - You will see a `firebaseConfig` object with:
     ```javascript
     const firebaseConfig = {
       apiKey: "AIzaSy...",
       authDomain: "pixel-craft.firebaseapp.com",
       projectId: "pixel-craft",
       storageBucket: "pixel-craft.appspot.com",
       messagingSenderId: "123456789...",
       appId: "1:123456789:web:..."
     };
     ```

3. **Enable Cloud Firestore Database**:
   - In the left sidebar, click **"Build" > "Firestore Database"**.
   - Click **"Create database"**.
   - Select **"Start in test mode"** (allows public read/write during development) or configure security rules:
     ```text
     rules_version = '2';
     service cloud.firestore {
       match /databases/{database}/documents {
         match /{document=**} {
           allow read, write: if true;
         }
       }
     }
     ```
   - Choose your nearest cloud location and click **"Enable"**.

4. **Paste Credentials into Admin Panel**:
   - Open [`admin.html`](admin.html) and go to the **Firebase Cloud** tab.
   - Turn on **"Enable Cloud Storage"**.
   - Paste your `apiKey`, `projectId`, `authDomain`, `storageBucket`, `messagingSenderId`, and `appId`.
   - Click **"Save Firebase Credentials"** and **"Verify & Ping Firestore"**.
   - Click **"Push to Firebase"** to upload your current website content, customer orders, and inquiries to the cloud!

---

## 🔑 Admin Login Credentials

- **Admin URL**: Open [`admin.html`](admin.html) or click the **Admin Panel** button in the footer or floating corner button on [`index.html`](index.html).
- **Default Username**: `admin`
- **Default Password**: `admin123`
*(Change username and password anytime in the **Admin Security** tab)*

---

## 💻 How to View & Run

No build tools, Node.js, or server installations required! Everything works directly in any modern browser:

1. **Open Public Website**:
   Double-click `index.html` or run:
   ```bash
   start index.html
   ```

2. **Open Admin Panel**:
   Double-click `admin.html` or click the floating "Admin Panel" button on `index.html`.
