# FAR-POS Project Brief

## What is this?
Multi-industry POS system for Indian retail vendors.
Live: https://shopeasy-pos.vercel.app/
GitHub: https://github.com/subhanshaik2025/far-pos
Local: /Users/subhan/Downloads/shopeasy-pos

## Tech Stack
React 18 + Vite, Google Sheets via Apps Script, Vercel, PWA

## File Structure
- src/App.jsx - main app, tab routing, state
- src/AuthPage.jsx - login/register
- src/AdminApp.jsx - admin panel at /admin
- src/main.jsx - entry with ErrorBoundary
- src/auth.js - login/register logic
- src/salesSheets.js - ALL Google Sheets API calls
- src/config.js - industries, translations EN/TE/HI
- src/components/BillingTab.jsx - billing/cart
- src/components/HistoryTab.jsx - bill history
- src/components/ReportsTab.jsx - reports
- src/utils/theme.js - colors GOLD BG SURF etc
- src/utils/billUtils.js - date parsing, filtering

## Apps Script URLs
- Users: https://script.google.com/macros/s/AKfycbyOJivL481i7M6VTA-xLb0jGI2lmu9IvRpjvooU47GbH8to_GiZ24A35OhPgTtZGaj7qQ/exec
- Sales: https://script.google.com/macros/s/AKfycbyWh7fm7c7C_LcwzVdf70Utn-09-h7EVs7O-IX-tkPsaI-T9hWToBrJZX-G4wPJ0PcelQ/exec

## Data Fields
Bills from sheets: bill_id, vendor_id, shop_phone, shop_name, items_json, subtotal, discount, gst, gst_percent, total, payment_mode, date, timestamp
Bills from app: id, items (array), mode, date, timestamp
Primary key: vendor_id from RegisteredUsers.id

## Features Done
Dark premium UI, Multi-industry, Billing with discount, WhatsApp bill, GST Invoice PDF,
Product Manager, Inventory, Customer Khata, Bill History, Reports daily/weekly/monthly,
Expense tracker, GSTIN settings, WhatsApp summary, Admin panel, PWA, Telugu/Hindi,
Loading states, Toast notifications, Offline detection, Error boundary, Google Sheets sync

## RULES
1. Never use app.replace() - write complete components
2. Check Google Sheets field names before coding
3. Each tab is separate component file
4. Apps Script uses setByHeader() for bills
5. Test npm run build before git push
6. Use nano for files not node -e with backticks

## Test Accounts
- 9533360607 / 3345 (Subhan, Far, salon)
- 9346465566 / 1234 (Dariya, Restaurant)
- 8125584558 / 1234 (Appa, cloth)
- Admin: 9533360607 / admin@far123