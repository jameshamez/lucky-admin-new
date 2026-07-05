# Lucky Admin — เอกสารภาพรวมระบบ

ระบบบริหารจัดการภายในองค์กร (ERP-like Internal Admin System) สำหรับธุรกิจสิ่งพิมพ์/งานกราฟิก (Nacres) ครอบคลุมตั้งแต่งานขาย ออกแบบ จัดซื้อ ผลิต บัญชี ไปจนถึงบุคคล โดยแบ่งการเข้าถึงตามแผนก (Department-based access)

## 1. ภาพรวมสถาปัตยกรรม

```
┌─────────────────────────┐        HTTPS/JSON        ┌──────────────────────────┐
│   Frontend (SPA)         │ ────────────────────────▶ │   Backend API (PHP)      │
│   React + Vite + TS      │ ◀──────────────────────── │   backend/api/**.php     │
│   deploy: Vercel         │                            │   host: nacres.co.th     │
└───────────┬──────────────┘                            └────────────┬─────────────┘
            │                                                          │
            │ (บางฟีเจอร์ใช้ตรง)                                        │ mysqli
            ▼                                                          ▼
    ┌───────────────┐                                         ┌───────────────┐
    │ Supabase       │                                         │ MySQL          │
    │ (Postgres)     │                                         │ (นาเครส hosting)│
    └───────────────┘                                         └───────────────┘
```

ระบบใช้สถาปัตยกรรมแบบ **แยก Frontend/Backend**:
- **Frontend**: Single Page Application เรียก REST API ของ backend ผ่าน `fetch` (ดูตัวอย่างที่ `src/pages/Login.tsx` เรียก `https://nacres.co.th/api-lucky/admin/auth.php`)
- **Backend**: PHP script แบบ endpoint ต่อไฟล์ (ไม่ใช้เฟรมเวิร์ก) เชื่อมต่อ MySQL ผ่าน `mysqli` (`condb.php`)
- **Supabase**: ใช้เป็นฐานข้อมูล/บริการเสริมคู่ขนาน (มี migrations และ client แยกต่างหาก) สำหรับบางฟีเจอร์

> 📌 **สำคัญ**: โค้ด backend ที่ frontend เรียกใช้งานจริง (production) คือไฟล์ที่อยู่ใต้ `api-lucky/admin/` (deploy ที่ `https://nacres.co.th/api-lucky/admin/...`) ส่วนโฟลเดอร์ `backend/api/` ในโปรเจกต์นี้เป็นโค้ด backend อีกชุดที่โครงสร้างคล้ายกันมาก แต่ **ไม่ใช่ตัวที่รันบน production จริง** — ดูรายละเอียดความแตกต่างในหัวข้อ [10. backend/api vs api-lucky/admin](#10-backendapi-vs-api-luckyadmin-โค้ด-2-ชุดที่ต้องระวัง)

> ⚠️ **ข้อควรระวังด้านความปลอดภัย**: ไฟล์เชื่อมต่อฐานข้อมูล (เช่น `condb.php`) มี username/password ฝังตรงในโค้ด ควรย้ายไปเก็บใน environment variable บนโฮสต์ และตรวจสอบว่าไฟล์ `.sql`/`.php` ที่มี credential ไม่ถูก commit หรือ public เข้าถึงได้

## 2. เทคโนโลยีที่ใช้

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend Framework | React 18 + TypeScript + Vite |
| UI Components | shadcn/ui (Radix UI) + Tailwind CSS |
| Routing | React Router v6 |
| Forms/Validation | React Hook Form + Zod |
| Data Fetching / Cache | TanStack Query |
| Charts | Recharts |
| PDF/Export | jsPDF, html2canvas, xlsx |
| Calendar | react-big-calendar |
| Backend | PHP (native, ไม่มีเฟรมเวิร์ก) + mysqli |
| Database (หลัก) | MySQL (hosting ของ nacres.co.th) |
| Database (เสริม) | Supabase (Postgres) |
| Deployment (Frontend) | Vercel (`vercel.json`) |
| Auth | Custom login API (`auth.php`) เก็บ session/user ใน `localStorage` |
| แจ้งเตือน/สลิป | SlipOK API (proxy ผ่าน Vercel rewrite) |

## 3. โครงสร้างโปรเจกต์ (ระดับบนสุด)

```
lucky-admin-new/
├── src/                  # React frontend
│   ├── pages/            # หน้าจอแยกตามโมดูล (sales, design, procurement, production, accounting, hr, admin, ...)
│   ├── components/       # UI components แยกตามโมดูล + ui/ (shadcn primitives)
│   ├── services/         # ฟังก์ชันเรียก API แยกตามโมดูล (เช่น orderService.ts, hrService.ts)
│   ├── hooks/            # custom hooks (use-mobile, use-toast)
│   ├── lib/              # utils, employeeData, commissionConfig
│   ├── integrations/supabase/  # Supabase client + generated types
│   └── App.tsx           # การประกาศ route ทั้งหมดของระบบ
├── backend/
│   ├── api/              # PHP REST endpoints แยกตามโมดูล (โค้ด "คู่ขนาน" — ไม่ใช่ตัวที่รันจริง)
│   ├── database/         # ไฟล์ schema (.sql) ของแต่ละโมดูล
│   ├── models/           # PHP model (เช่น Material.php)
│   ├── utils/            # helper ฝั่ง PHP
│   └── condb.php         # การเชื่อมต่อฐานข้อมูล MySQL
├── api-lucky/admin/      # ★ โค้ด backend จริงที่ deploy อยู่บน nacres.co.th (production)
├── sql/                  # production_schema.sql
├── supabase/             # config + migrations (Postgres)
└── vercel.json           # rewrite rules สำหรับ deploy
```

## 4. การยืนยันตัวตนและสิทธิ์การเข้าถึง (Auth & Department Access)

- ผู้ใช้ล็อกอินผ่านหน้า `Login.tsx` → เรียก `auth.php?action=login`
- เก็บข้อมูล user (รวม `role` และ `department`) ไว้ใน `localStorage`
- หลังล็อกอิน ระบบพาไปหน้า **เลือกแผนก** (`DepartmentSelection.tsx`) ซึ่งจะกรองแผนกที่เข้าถึงได้ตาม `department` ของผู้ใช้
- Role มี 3 ระดับ: `Admin`, `Manager`, `User` — **Admin/Manager เข้าถึงได้ทุกแผนกเสมอ** ส่วน `User` เข้าได้เฉพาะแผนกของตนเอง

แผนก (Department) ในระบบ:

| แผนก | เส้นทาง | คำอธิบาย |
|---|---|---|
| ฝ่ายขาย (Sales) | `/sales` | จัดการลูกค้า สร้างออเดอร์ ประเมินราคา ติดตามออเดอร์ |
| ฝ่ายกราฟิก (Design) | `/design` | จัดการงานออกแบบ ติดตามสถานะงาน สต็อกวัสดุออกแบบ |
| ฝ่ายจัดซื้อ (Procurement) | `/procurement` | ใบขอซื้อ/สั่งซื้อ ใบเสนอราคา สต็อกสินค้า ประวัติราคา |
| ฝ่ายผลิตและจัดส่ง (Production) | `/production` | จัดการออเดอร์ผลิต คลังสินค้า/วัตถุดิบ การเบิก-โอน-ปรับสต็อก งานพาหนะ |
| ฝ่ายบัญชี (Accounting) | `/accounting` | รายรับ-รายจ่าย บัญชีลูกค้า เงินสดย่อย ครุภัณฑ์สำนักงาน รายงานการเงิน |
| ฝ่ายบุคคล (HR) | `/hr` | พนักงาน ค่าคอมมิชชั่น (MTO/Ready-made) เงินเดือน รายงาน HR |
| ผู้จัดการ (Manager) | `/manager` | ผู้ใช้งาน, การตั้งค่า, รายงานภาพรวม |
| เงินสดย่อย (Petty Cash) | `/petty-cash` | โมดูลเงินสดย่อยแบบ standalone |

นอกจากนี้ยังมีหน้ากลาง (ไม่ผูกแผนก): `/orders`, `/inventory`, `/communication`, `/reports`, `/status`, `/user-manual`

## 5. โมดูลของระบบ (Frontend Pages ↔ Backend API)

### 5.1 Sales (ฝ่ายขาย)
- Pages: `CustomerManagement`, `CustomerProfile`, `CreateOrder`, `OrderDetail`, `OrderTracking`, `PriceEstimation`(+Add/Detail), `ProductionOrder`, `SalesDashboard`, `SalesReports`, `SalesSettings`, `InventoryStock`, `InternalRequisitions`
- Backend: `customers.php`, `customer_orders.php`, `customer_activities.php`, `customer_notes.php`, `customer_design_files.php`, `orders.php`, `order_upload.php`, `price_estimation/*`, `sales_dashboard.php`, `sales_reports.php`, `sales_settings.php`, `products_catalog.php`

### 5.2 Design (ฝ่ายกราฟิก)
- Pages: `DesignDashboard`, `JobManagement`, `JobOrderManagement`, `JobTracking`, `MaterialStock`, `WorkGuides`, `DesignReports`
- Backend: `graphic/design_jobs.php`, `graphic/design_job_logs.php`

### 5.3 Procurement (ฝ่ายจัดซื้อ)
- Pages: `PurchaseOrders`, `PurchaseRequisition`, `RequisitionCenter`, `Quotation`(+History), `PriceEstimation`(+Add/History), `InventoryStock`, `ProcurementDashboard/Reports/Settings`
- Backend: `procurement/dashboard.php`, `procurement/reports.php`, `procurement/settings.php`, `procurement/suppliers.php`, `material_requests.php`, `materials.php`, `equipment_requests.php`, `equipments.php`

### 5.4 Production (ฝ่ายผลิตและจัดส่ง)
- Pages: `OrderManagement`, `ProductionOrderDetail`, `EmployeeTaskDetails`, `RequestsManagement`, `VehicleRequestManagement/Detail`, กลุ่ม Inventory (`InventoryAll/Adjust/Deduct/Receive/Transfer/History/Settings/Dashboard`), `ProductionReports`
- Backend: `production/dashboard.php`, `production/reports.php`, `production/vehicles.php`, `production/vehicle_usage.php`, `production/migrate_workflow.php`

### 5.5 Accounting (ฝ่ายบัญชี)
- Pages: `AccountingDashboard`, `Revenue`, `Expenses`, `RevenueExpenses`, `CustomerAccounts`, `OfficeInventory`, `OfficeRequisitions`, `PettyCash`, `WorkOrders`, `ProductInventory`, `FinancialReports`, `ReportsMain` (+ ย่อย: sales/inventory/office-supplies/office-equipment/petty-cash)
- Backend: `accounting/customer_accounts.php`, `accounting/dashboard.php`, `accounting/reports.php`, `accounting/office_requisitions.php`, `accounting/office_assets.php`, `accounting/work_orders.php`, `accounting/revenue.php`, `accounting/petty_cash.php`, `accounting/expenses.php`

### 5.6 HR (ฝ่ายบุคคล)
- Pages: `EmployeeManagement`, `CommissionMadeToOrder`, `CommissionReadyMade`, `PayrollCommissions`, `MonthlyCommissionReport`, `HRDashboard/Reports/Settings/UserManagement`
- Backend: `hr/employees.php`, `hr/dashboard.php`, `hr/settings.php`, `hr/commission_report.php`, `hr/commission_mto.php`, `hr/commission_ready_made.php`, `hr/reports.php`

### 5.7 Admin / Manager
- Pages: `ExecutiveDashboard`, `UserManagement`, `SystemSettings`, `ComprehensiveReports`
- Backend: `admin/dashboard.php`, `admin/settings.php`, `admin/comprehensive_reports.php`, `users.php`, `auth.php`

### 5.8 อื่น ๆ
- **Communication**: หน้า `Communication.tsx` + `communication.php` (ระบบสื่อสาร/แจ้งเตือนภายใน)
- **Portal**: `backend/api/portal/getOrderByJobId.php` — เอนด์พอยต์สำหรับให้ภายนอก (เช่น ลูกค้า) เช็คสถานะงานผ่าน Job ID
- **Vehicle Reservations**: `vehicle_reservations.php`
- **Standalone Petty Cash**: `StandalonePettyCash.tsx`

## 6. ฐานข้อมูล

ระบบมีไฟล์ schema กระจายอยู่หลายที่ตามการพัฒนาแต่ละช่วง:

- `backend/database/*.sql` — schema ตามโมดูล (accounting_*, communication, customers_admin, production_reports, system_settings, vehicle_management)
- `backend/*.sql` (root ของ backend) — employees, equipments, orders_tables/orders_alter, price_estimations, sales_settings_tables, customer_profile_tables, vehicle_reservations, migrate_orders_columns
- `sql/production_schema.sql` — schema รวมฝั่ง production
- `supabase/migrations/*.sql` — migration ฝั่ง Supabase (Postgres) แยกต่างหากจาก MySQL หลัก
- `procurement.sql`, `update_table_order_items.sql`, `db_migration.php` (root) — สคริปต์ migrate เพิ่มเติม

> เนื่องจากมี MySQL (หลัก) และ Supabase/Postgres (เสริม) อยู่คู่กัน ควรตรวจสอบให้ชัดเจนว่าแต่ละโมดูล/ตารางอ้างอิงฐานข้อมูลใดเป็นแหล่งความจริง (source of truth) เพื่อป้องกันข้อมูลไม่ตรงกัน

## 7. Environment Variables (`.env`)

| ตัวแปร | ใช้ทำอะไร |
|---|---|
| `VITE_SUPABASE_PROJECT_ID` | Project ID ของ Supabase |
| `VITE_SUPABASE_URL` | URL ของ Supabase project |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public/anon key สำหรับเรียก Supabase จากฝั่ง client |
| `VITE_SLIPOK_BRANCH_ID` | Branch ID สำหรับตรวจสอบสลิปโอนเงินผ่าน SlipOK |
| `VITE_SLIPOK_API_KEY` | API key ของ SlipOK |

Backend PHP เชื่อมต่อ MySQL ผ่าน `backend/condb.php` (ปัจจุบัน hardcode host/user/password — ควรย้ายเป็น env var บนฝั่งเซิร์ฟเวอร์)

## 8. การติดตั้งและรันโปรเจกต์ (Frontend)

```bash
npm install        # หรือ bun install (มี bun.lockb)
npm run dev         # รัน dev server (Vite)
npm run build        # build production
npm run preview      # preview build
npm run lint         # ตรวจสอบโค้ดด้วย ESLint
```

Backend (PHP) ต้องรันบนเซิร์ฟเวอร์ที่รองรับ PHP + MySQL (ปัจจุบันคือ hosting ของ `nacres.co.th`) — ไม่มี local dev server สำหรับ backend ในโปรเจกต์นี้

## 9. การ Deploy

- **Frontend**: Deploy บน Vercel — `vercel.json` กำหนด:
  - Proxy `/slipok-proxy/*` → `https://api.slipok.com/api/line/apikey/*` (หลีกเลี่ยงปัญหา CORS เวลาเรียก SlipOK)
  - Fallback ทุก route ไปที่ `index.html` (รองรับ client-side routing ของ SPA)
- **Backend**: PHP ไฟล์วางตรงบน hosting (`nacres.co.th/api-lucky/...`) ไม่ได้ผ่านกระบวนการ build

## 10. `backend/api` vs `api-lucky/admin` — โค้ด 2 ชุดที่ต้องระวัง

โปรเจกต์นี้มีโค้ด backend (PHP) อยู่ **สองชุดที่โครงสร้างคล้ายกันมาก**:

| | `api-lucky/admin/` | `backend/api/` |
|---|---|---|
| สถานะ | **โค้ดจริงที่ deploy อยู่บน production** (`https://nacres.co.th/api-lucky/admin/...`) ที่ frontend เรียกใช้งานอยู่จริง (เช่น `auth.php` ใน `Login.tsx`) | โค้ดชุดคู่ขนานในรีโป โครงสร้างคล้ายกันแต่ **ไม่ได้ถูกเรียกใช้งานโดยตรง** จาก production URL ปัจจุบัน |
| ที่มา | ซิงก์/คัดลอกมาจากไฟล์จริงบนเซิร์ฟเวอร์ hosting | โค้ดที่พัฒนา/เก็บไว้ในรีโปตามการ refactor |
| ความครบถ้วน | มีไฟล์มากกว่าและมีของเก่าปนของใหม่ (ดูด้านล่าง) | มีเฉพาะ endpoint หลักที่จัดระเบียบตามโมดูล |

**นัยสำคัญ**: ถ้าจะแก้ไข endpoint ที่ใช้งานจริง ต้องแก้ที่ `api-lucky/admin/` (แล้วอัปโหลดขึ้น hosting จริง) — การแก้ที่ `backend/api/` เพียงอย่างเดียว **จะไม่มีผลกับระบบที่ผู้ใช้ใช้งานอยู่** จนกว่าจะซิงก์/นำไป deploy ทับของจริง ควรตกลงกันในทีมว่าจะยึดโค้ดชุดไหนเป็น source of truth แล้ว deprecate อีกชุดหนึ่ง เพื่อไม่ให้ endpoint สองชุด drift ออกจากกัน

### โครงสร้างจริงของ `api-lucky/admin/` (production)

```
api-lucky/admin/
├── auth.php, users.php, customers.php, orders.php, order_upload.php
├── customer_orders.php, customer_activities.php, customer_notes.php, customer_design_files.php
├── save_customer.php, save_customer_activity.php, delete_customer_activity.php   # endpoint เดี่ยวรุ่นเก่า
├── get_customers.php, get_customer_detail.php, get_customer_activities.php        # ก่อนถูกรวมเข้า customers.php/customer_orders.php
├── equipment_requests.php, equipments.php, material_requests.php, materials.php
├── price_estimations.php, products_catalog.php
├── sales_dashboard.php, sales_reports.php, sales_settings.php
├── vehicle_reservations.php, vehicle_usage.php, vehicles.php, 20-3-69-vehicle_reservations.php  # มีไฟล์ backup/ชั่วคราวปนอยู่
├── migrate_job_ids.php, migrate_sequence.php   # สคริปต์ migrate ข้อมูลแบบรันครั้งเดียว
├── debug.php, debug_db.php, dashboard_settings.php, systems.php, index.php
├── snapshots.php, snapshots2.php, snapshots3.php, tasks.php, tasks2.php, tasks3.php  # ไฟล์ทดลอง/เวอร์ชันซ้อนกัน
├── seo_analyzer.php, full_page_extractor.php   # เครื่องมือช่วย SEO/scrape (ไม่เกี่ยวกับโมดูลธุรกิจหลัก)
├── uploads/                                     # โฟลเดอร์เก็บไฟล์อัปโหลด
├── condb.php                                    # การเชื่อมต่อ MySQL (มี credential ฝังตรงในไฟล์)
├── admin/            → dashboard.php, settings.php, comprehensive_reports.php
├── accounting/        → customer_accounts.php, dashboard.php, expenses.php, office_assets.php,
│                          office_requisitions.php, petty_cash.php, reports.php, revenue.php, work_orders.php
├── graphic/           → design_jobs.php, design_job_logs.php, material_requests.php, materials.php
├── hr/                → commission_mto.php, commission_ready_made.php, commission_report.php,
│                          dashboard.php, db_update.php, employees.php, reports.php, settings.php
├── price_estimation/  → get_price_estimations.php, get_price_estimation_detail.php,
│                          save_price_estimation.php, delete_price_estimation.php, upload_file.php,
│                          db_schema.sql, migrate_product_details.sql
├── procurement/       → dashboard.php, reports.php, settings.php, suppliers.php
├── production/        → dashboard.php, diag.php, reports.php, vehicles.php, vehicle_usage.php
└── design/            → (ว่าง)
```

> ⚠️ **สิ่งที่ควรทำความสะอาด/ตรวจสอบเพิ่มเติม**:
> 1. ไฟล์ `condb.php` ใต้ `api-lucky/admin/` มี DB credential ฝังตรง เช่นเดียวกับ `backend/condb.php` — ควรย้ายไป env var บนเซิร์ฟเวอร์จริง
> 2. มีไฟล์ debug/scratch หลายตัว (`debug.php`, `debug_db.php`, `snapshots*.php`, `tasks*.php`, `seo_analyzer.php`, `full_page_extractor.php`) ที่ค้างอยู่ใน production path — ควรตรวจว่ายังใช้งานอยู่จริงหรือไม่ ถ้าไม่ใช้ควรลบออกจากเซิร์ฟเวอร์เพื่อลด attack surface
> 3. มี endpoint รุ่นเก่ากับรุ่นใหม่ปนกันสำหรับ "customer" (เช่น `get_customers.php` เก่า vs `customers.php`/`customer_orders.php` ใหม่) — ควรยืนยันว่า frontend เรียกตัวไหนอยู่ แล้ว deprecate ตัวที่ไม่ใช้แล้ว

---
*หมายเหตุ: เอกสารนี้สรุปจากโครงสร้างโค้ดปัจจุบันในโปรเจกต์ (auto-generated จากการสำรวจโค้ด) หากมีการเพิ่ม/ย้ายโมดูลควรอัปเดตเอกสารนี้ตาม*
