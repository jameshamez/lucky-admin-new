# เอกสารส่งมอบระบบ (System Handover) — Lucky Admin

> เอกสารนี้เขียนสำหรับ **ทีม Dev/IT ที่จะรับช่วงดูแลระบบต่อ**
> สำหรับภาพรวมสถาปัตยกรรม/เทคโนโลยี/โครงสร้างโปรเจกต์แบบละเอียด ดู [`SYSTEM_OVERVIEW.md`](./SYSTEM_OVERVIEW.md) ประกอบ — เอกสารนี้จะไม่พูดซ้ำสิ่งที่อยู่ในนั้นแล้ว แต่จะเสริม 3 เรื่องที่ยังไม่มีที่ไหนบันทึกไว้:
> 1. สรุปงานที่แก้ไขในรอบล่าสุด (mock data → API จริง)
> 2. **สถานะจริงของทุกหน้าจอในระบบ** ทีละแผนก (หน้าไหนใช้ API จริงแล้ว / หน้าไหนยังเป็น mock / หน้าไหนเป็นโค้ดขยะที่ไม่ได้ใช้งาน) — ได้จากการสำรวจโค้ดทั้งระบบ
> 3. Checklist สิ่งที่ต้องทำก่อน/หลัง deploy และรายการ known limitations ที่ควรวางแผนแก้ต่อ

อัปเดตล่าสุด: 2026-07-06

---

## 1. สรุปงานที่แก้ไขในรอบนี้ (Session Changelog)

รอบการทำงานนี้ไล่แก้ทีละจุดที่ frontend ยังใช้ **mock/hardcoded data** ให้เปลี่ยนไปใช้ backend PHP/MySQL จริง เรียงตามลำดับที่ทำ:

| # | เรื่อง | ไฟล์หลักที่แก้/เพิ่ม | สรุป |
|---|---|---|---|
| 1 | Petty Cash Report | `backend/api/accounting/reports.php`, `src/pages/accounting/reports/PettyCashReport.tsx` | แก้บั๊กชื่อคอลัมน์/ค่า enum ผิด (เทียบกับ schema จริง), เพิ่ม `monthlyCategoryData`/`monthlyTrendData` ให้กราฟใช้ข้อมูลจริง |
| 2 | Accounting Dashboard | `backend/api/accounting/dashboard.php` | แก้บั๊ก status enum ผิดชุดเดียวกับข้อ 1 (pendingRequests, pettyCash, accountsPayable) |
| 3 | Quotation (จัดซื้อ) | `src/pages/procurement/Quotation.tsx` | เปลี่ยนราคาผู้ผลิตที่ hardcode ไว้ ให้อ่านจาก `quotation.rawDetails.supplierEntries` ที่บันทึกจริง |
| 4 | ระบบ Auth/Session (frontend) | `src/contexts/AuthContext.tsx`, `src/lib/departments.ts`, `src/App.tsx` (96 routes), `DashboardLayout.tsx` | สร้าง single source of truth สำหรับ user ที่ login อยู่ (ยังอิง `localStorage`, ไม่มี token/session ฝั่ง server), เพิ่ม route guard จริงตามแผนก (กันการพิมพ์ URL ตรงๆ เพื่อข้ามแผนกที่ไม่มีสิทธิ์) |
| 5 | คู่มือการใช้งานระบบ (shared) | `backend/database/user_manual.sql` (7 ตาราง), `user_manual_*.php` ×4, `src/pages/UserManual.tsx` | สร้าง backend เต็มระบบ: วิดีโอ/คู่มือ/แบบทดสอบ พร้อม server-side grading (กันโกงคำตอบ). ใช้ร่วมกัน 6 เส้นทาง (ดูข้อ 8 เรื่องไฟล์ UserManual ที่ซ้ำ) |
| 6 | คลังสินค้าหลัก (Stage A) | `backend/database/inventory.sql`, `inventory_*.php` ×5, `InventoryDashboard/All/Adjust/History/Receive/Transfer/Settings.tsx` | ระบบคลังสินค้าสำเร็จรูปจริง แยกคลัง `TEG`/`LUCKY`, มี ledger การเคลื่อนไหวสต็อก |
| 7 | ของเสีย/สต็อกผลิต/เบิกใช้ (Stage B) | `backend/database/production_stock.sql` (6 ตาราง), `defective_items.php`, `stock_items.php`, `withdrawal_components.php`, `withdrawals.php` | โดเมนแยกจาก Stage A: ถ้วยรางวัล/เหรียญ + BOM component เบิกใช้งานจริง ผูกกับพนักงานจริง (ไม่ใช่ "สมชาย ใจดี" hardcode) |
| 8 | QC หลายแผนกอนุมัติ (Stage C) | `backend/database/qc_approvals.sql`, `qc_approvals.php`, `QCVerificationCards.tsx`, `OrderDetail.tsx` | รวม mock 2 จุดที่เคยทำงานคนละแบบให้เป็นตาราง/endpoint เดียว พร้อม lazy-init แถว pending และ modal เหตุผลตอน Fail |
| 9 | สต็อกสินค้าฝั่งขาย (Stage D) | `src/pages/sales/InventoryStock.tsx` | ไม่สร้าง backend ใหม่ — ใช้ endpoint ของ Stage B ซ้ำ (read-only) |
| 10 | ProductionStepBox ผู้ใช้ hardcode | `src/components/production/ProductionStepBox.tsx` | จุดสุดท้ายที่ยังเขียน `"สมชาย ใจดี"`/`"ฝ่ายขาย"` ตายตัว 3 จุด เปลี่ยนเป็นดึงจาก `useAuth()` จริง |
| 11 | วัสดุสิ้นเปลืองสำนักงาน | `backend/database/office_supplies.sql`, `office_supplies.php`, `src/pages/production/InventoryManagement.tsx` | โดเมนที่ 3 (แยกจาก Stage A/B) — กระดาษ/หมึก/ฟิล์ม ฯลฯ รวมฟอร์ม รับเข้า/จ่ายออก ที่เคยซ้ำกัน 2 จุดให้ใช้ path บันทึกเดียวกัน, ต่อ Excel bulk import ให้บันทึกจริง |
| 12 | ยอดเงินคงเหลือ เงินสดย่อย | `accounting/petty_cash.php` (เพิ่ม `?type=fund` และ `action=set_fund`), `StandalonePettyCash.tsx` | แก้ตัวเลข hardcode ฿50,000 — เพิ่มการตั้งค่า "วงเงินสดย่อย" (float) ผ่านไอคอนดินสอบนการ์ด เก็บไว้ใน `system_settings` (key `petty_cash_fund`, ตารางเดิมที่ `/manager/settings` ใช้อยู่แล้ว ไม่ต้องรัน .sql ใหม่) แล้วคำนวณ "ยอดเงินคงเหลือ" = วงเงิน − ยอดที่จ่ายแล้วแต่ยังไม่เคลียร์ (`status='จ่ายแล้ว' AND clearance_status='รอเคลียร์'`) |
| 13 | ปุ่ม Export ที่ไม่ทำงาน (13 ไฟล์) | `CustomerAccounts.tsx`, `WorkOrders.tsx`, `ProcurementDashboard.tsx`, `PricingHistory.tsx`, `ProductionReports.tsx`, `DesignReports.tsx`, `Reports.tsx`, `AccountingDashboard.tsx`, `Revenue.tsx`, `Expenses.tsx`, `InventoryReport.tsx`, `OfficeEquipmentReport.tsx`, `SalesReport.tsx`, `ComprehensiveReports.tsx`, `src/index.css` | เพิ่ม `handleExportExcel` จริง (library `xlsx` ตามรูปแบบ `HRDashboard.tsx`) ให้ทุกปุ่ม "Export Excel"/"ส่งออกรายงาน" ที่เคยไม่มี `onClick` หรือมีแค่ toast มายา — export เฉพาะข้อมูลที่ผ่านตัวกรอง/ค้นหาปัจจุบัน. ปุ่ม "Export PDF" (7 ไฟล์ที่มีคู่กับ Excel) ผูกกับ `window.print()` + คลาส `.print-area`/`.print-hide` ใหม่ใน `src/index.css` (ซ่อน sidebar/header/แถบปุ่มตอนพิมพ์). **ระหว่างแก้พบว่า `DesignReports.tsx` และ `AccountingDashboard.tsx` มีส่วนข้อมูล hardcode/สุ่มปนอยู่มากกว่าที่บันทึกไว้เดิม** — อัปเดตสถานะทั้งสองหน้าด้านล่างแล้ว, Export ที่แก้จึงส่งออกเฉพาะส่วนที่เป็นข้อมูลจริงเท่านั้น ไม่รวมส่วน mock |
| 14 | แก้บล็อก hardcode ใน AccountingDashboard.tsx | `accounting/dashboard.php` (+mirror), `AccountingDashboard.tsx` | เพิ่ม query จริง 5 ส่วน: `topExpenseCategories` (จาก `accounting_transactions` เดือนนี้), `topGPJobs` (จาก `orders`, ใช้สูตรประมาณต้นทุน 65% เดียวกับ `work_orders.php` เพื่อความสอดคล้อง), `arSummary`/`apSummary` (ยอดรวม+จำนวนจริงแทนตัวเลขคงที่ ฿175,000/฿89,500), `officeAssets` (จาก `accounting_office_assets` — เดิมทั้งบล็อกเป็นเลขคงที่ 42/35/4/3 และมูลค่า ฿1,285,000), `officeSupplies` (จาก `accounting_office_supplies`+`accounting_office_requisitions` — เดิมทั้งบล็อกเป็นเลขคงที่ 7/2/฿42,175/฿1,770). แก้ `pettyCash.total` hardcode ฿50,000 ในไฟล์นี้ด้วย (บั๊กเดียวกับที่แก้ใน `StandalonePettyCash.tsx` แต่คนละไฟล์ backend) โดยอ่านจาก `system_settings.petty_cash_fund` เดียวกัน. ลบบรรทัด "มูลค่าสต็อกรวมประมาณ ฿3,850,000" ทิ้ง เพราะตาราง `office_inventory` ไม่มีคอลัมน์ราคา คำนวณจริงไม่ได้ |
| 15 | ปิดจบ known limitations ที่เหลือทั้งหมด (7 จุด: บัญชี 3 + จัดซื้อ 4) | ดูรายละเอียดด้านล่าง | **บัญชี**: (ก) `InternalRequests.tsx` — 3 แท็บต่อ backend จริง (`material_requests.php` ผ่าน `accountingStockService('all')` ใหม่, `vehicle_reservations.php`, ตาราง+endpoint ใหม่ `accounting_employee_expenses`) พร้อมแก้บั๊กแฝงใน `material_requests.php`'s PUT ที่ไม่เคยรับค่า `status` เลย (การอนุมัติ/ปฏิเสธจาก `InternalRequisitions.tsx` เดิมจึงเป็น no-op เงียบๆ มาตลอด); (ข) `FinancialReports.tsx` — ต่อข้อมูลจริงทั้งหมดจาก `dashboard.php`/`work_orders.php`, Export Excel จริง; (ค) `OfficeSuppliesReport.tsx` — เพิ่ม `type=office_supplies` ใหม่ใน `reports.php`. **จัดซื้อ**: (ง) `RequisitionCenter.tsx` — แท็บจองรถต่อ `vehicle_reservations.php`, แท็บเบิกซื้อวัสดุต่อระบบ PR ใหม่ (ดู (ฉ)); (จ) เลิกใช้ `PriceEstimation.tsx` เมนูเก่า เปลี่ยนเป็น redirect ไป `/procurement/estimation/quotation` (Quotation.tsx จริง) ทั้ง route และ sidebar; (ฉ) `PurchaseRequisition.tsx` — สร้างระบบ PR วัสดุอุปกรณ์ใหม่ทั้งหมด: ตาราง `purchase_requisitions`/`pr_line_items`/`pr_payments`/`pr_attachments`, endpoint `procurement/purchase_requisitions.php` (เลขที่ PR ออกฝั่ง server, ไฟล์แนบ/หลักฐานโอนเงิน/รูปรับของอัปโหลดจริงผ่าน `upload.php` เดิม); (ช) `ProcurementSettings.tsx` — เพิ่ม Dialog เพิ่ม/แก้ไขโรงงาน/วัสดุ/สี/ช่องทางจัดส่ง (เพิ่ม PUT ใหม่ใน `settings.php` สำหรับวัสดุ/สี/ช่องทาง) และผูกบันทึกอัตราแลกเปลี่ยน/VAT จริง. ยืนยันผ่าน `php -l`+`tsc --noEmit`+`npm run build`+Playwright smoke test บน dev server จริงครบทุกจุด — **(ฉ)/(ง)/(ช) ต้องรัน `.sql`+deploy PHP ใหม่บน production ก่อนใช้งานได้จริง ดู checklist ข้อ 5** |

**หลักการที่ยึดตลอดทั้ง session**: ไฟล์ backend มี 2 ชุดคู่ขนาน — `backend/api/` (ต้นทางในรีโป) กับ `api-lucky/admin/` (โค้ดที่ deploy จริงบน `nacres.co.th`) ทุกจุดที่แก้ไขข้างต้น **แก้ทั้งสองชุดพร้อมกัน** แล้ว แต่ **การอัปโหลดขึ้น hosting จริงเป็นความรับผิดชอบนอกเหนือจาก sandbox นี้** — ดู checklist ข้อ 5

---

## 2. สถานะจริงของทุกหน้าจอในระบบ (Full Page Audit)

ตารางด้านล่างมาจากการไล่อ่านโค้ดทุกไฟล์ในทุกแผนกอีกครั้ง (กรกฎาคม 2026) ไม่ใช่แค่หน้าที่แก้ในรอบนี้ — ใช้เป็น **source of truth ปัจจุบัน** แทนที่รายการหน้า/backend แบบสั้นในหัวข้อ 5 ของ `SYSTEM_OVERVIEW.md`

สัญลักษณ์สถานะ: 🟢 = ต่อ API จริงและ persist ครบ · 🟡 = ต่อ API จริงบางส่วน (มีปุ่ม/ฟีเจอร์ที่ยังไม่ทำงาน) · 🔴 = mock/hardcode ทั้งหน้า (กด "บันทึก" แล้วข้อมูลหาย) · ⚫ = โค้ดที่ไม่ได้ใช้งาน/เข้าไม่ถึง (orphaned/dead code)

### ฝ่ายขาย (Sales)

| หน้า | Route | ไฟล์ | สถานะ | หมายเหตุ |
|---|---|---|---|---|
| แดชบอร์ด | `/sales` | SalesDashboard.tsx | 🟡 | ปุ่ม quick-action บางปุ่มในตาราง "งานเร่งด่วน" ยังไม่ผูก backend (UI only) |
| จัดการลูกค้า | `/sales/customers` | CustomerManagement.tsx | 🟢 | |
| โปรไฟล์ลูกค้า | `/sales/customers/:id` | CustomerProfile.tsx | 🟢 | เข้าถึงได้จากการคลิกแถวเท่านั้น ไม่มีในเมนู |
| จัดการคำสั่งซื้อ | `/sales/create-order` | CreateOrder.tsx + CreateOrderForm.tsx | 🟢 | ไฟล์ใหญ่สุดใน Sales (6,077 บรรทัด) |
| สั่งผลิต (เก่า) | `/sales/production-order` | ProductionOrder.tsx | ⚫ | ไม่อยู่ในเมนู และใช้ Supabase client แทน REST API เดียวกับหน้าอื่น — ของเก่าที่ไม่ได้ใช้แล้ว ควรถามทีมก่อนลบ |
| ประเมินราคา | `/sales/price-estimation` (+add/detail/edit) | PriceEstimation.tsx, AddPriceEstimation.tsx, PriceEstimationDetail.tsx | 🟢 | 5-stage status flow |
| ติดตามคำสั่งซื้อ | `/sales/track-orders` | OrderTracking.tsx | 🟢 | จุดกำเนิด 33-status pipeline หลักของทั้งระบบ (ดูภาคผนวก) |
| รายละเอียดคำสั่งซื้อ | `/sales/track-orders/:orderId` | OrderDetail.tsx | 🟢 | จุดที่ sync สถานะข้ามแผนกกับ Design/QC |
| จัดการสินค้า | `/sales/product-inventory` | ProductInventory.tsx (`isSalesMode`) | 🟢 | ใช้ component เดียวกับ Production แบบ read-only |
| สต็อกสินค้า (ซ้ำ) | `/sales/inventory` | InventoryStock.tsx | 🟡 | ต่อ API จริง (Stage B) แต่ไม่มีในเมนู — ซ้ำกับ "จัดการสินค้า" ด้านบน ควรเลือกใช้ทางใดทางหนึ่ง |
| เบิกการใช้งาน | `/sales/internal-requests` | InternalRequisitions.tsx | 🟢 | |
| การตั้งค่า | `/sales/settings` | SalesSettings.tsx | 🟢 | |
| รายงานผล | `/sales/reports` | SalesReports.tsx | 🟢 | |
| คู่มือการใช้งาน | `/sales/user-manual` | UserManual.tsx (shared) | 🟢 | แก้ในรอบนี้ (ดูข้อ 8 เรื่องชื่อไฟล์ซ้ำ) |

### ฝ่ายกราฟิก (Design)

| หน้า | Route | ไฟล์ | สถานะ | หมายเหตุ |
|---|---|---|---|---|
| แดชบอร์ด | `/design` | DesignDashboard.tsx | 🟡 | ปุ่ม "เปิดงาน" ในตารางงานเร่งด่วนไม่ผูก navigation |
| รับงานออกแบบ | `/design/jobs` | JobOrderManagement.tsx | 🟢 | ไฟล์ใหญ่สุดใน Design (70,236 บรรทัด) จุดทำงานหลักของนักออกแบบ |
| ดูและติดตามสถานะงาน | `/design/tracking`, `/design/job-tracking` | JobTracking.tsx | 🟢 | 2 route ชี้ไฟล์เดียวกัน (alias ซ้ำซ้อน) |
| เบิกสินค้า/สต็อกวัสดุ | `/design/materials` | MaterialStock.tsx | 🟢 | โครงสร้างเดียวกับ Sales' InternalRequisitions แต่ไม่มีแท็บจองรถ |
| รายงานผล | `/design/reports` | DesignReports.tsx | 🟡⚫ | เมนู sidebar ถูกคอมเมนต์ปิดไว้ (เข้าได้เฉพาะพิมพ์ URL ตรง) และ**ข้อมูลจริงเฉพาะสรุปสถานะงาน+รายการงาน** (ใช้ `designJobService.getJobs()`) ส่วนกราฟ "ยอดขายตามประเภทสินค้า"/"ผลงานนักออกแบบ"/"แนวโน้ม 6 เดือน" เป็นค่า hardcode คงที่ ไม่ผูกกับข้อมูลจริง, กราฟเส้น 30 วันใช้ `Math.random()` สุ่มใหม่ทุกครั้งที่ render — Export Excel ที่เพิ่งแก้ (รอบนี้) จึงส่งออกเฉพาะสรุปสถานะ+รายการงานจริงเท่านั้น ไม่รวมกราฟปลอมเหล่านี้ |
| คู่มือการใช้งาน | `/design/user-manual` | UserManual.tsx (shared) | 🟢 | เหมือนข้อ Sales |
| จัดการงาน (เก่า) | — ไม่มี route | JobManagement.tsx | ⚫ | ไฟล์อยู่ในโฟลเดอร์แต่ไม่ถูก import/route เลย |
| คู่มือการทำงาน (เก่า) | — ไม่มี route | WorkGuides.tsx | ⚫ | เช่นเดียวกัน — เหตุผลที่ session นี้เลือกไปแก้ `UserManual.tsx` แทน |

### ฝ่ายจัดซื้อ (Procurement)

| หน้า | Route | ไฟล์ | สถานะ | หมายเหตุ |
|---|---|---|---|---|
| แดชบอร์ด | `/procurement`, `/procurement/dashboard` | ProcurementDashboard.tsx | 🟡 | stats/tasks จริง (Export Excel แก้แล้ว) แต่ calendar events, critical alerts, recent activity feed เป็น mock array ล้วน |
| ระบบประเมินราคา (เก่า) | `/procurement/estimation` | ~~PriceEstimation.tsx~~ → redirect | 🟢 | **แก้แล้ว** — route เปลี่ยนเป็น redirect ไป `/procurement/estimation/quotation` (Quotation.tsx จริง) แล้ว เมนู sidebar ก็แก้ให้ชี้ตรงไปหน้าจริงแล้วเช่นกัน ไฟล์ mock เดิมยังอยู่ในโปรเจกต์แต่ไม่มี route ใดใช้แล้ว |
| จัดการคำขอประเมินราคา | `/procurement/estimation/quotation` | Quotation.tsx | 🟢 | แก้ไขราคาผู้ผลิต mock ในรอบนี้ |
| ประวัติการประเมินราคา | `/procurement/estimation/history` | PricingHistory.tsx | 🟢 | ปุ่ม "ส่งออกรายงาน" แก้แล้ว |
| เพิ่มใบประเมินราคา | `/procurement/estimation/add` | AddPriceEstimation.tsx | 🟢 | wrapper บาง ๆ ของฟอร์มฝั่ง Sales ตัวเดียวกัน |
| คำขอเบิกจากภายใน (เก่า) | `/procurement/requisitions` | InternalRequisitions.tsx (procurement) | 🔴⚫ | mock ทั้งหน้า และไม่มีในเมนู (ถูกแทนที่ด้วย RequisitionCenter) |
| สั่งซื้อวัสดุอุปกรณ์ | `/procurement/purchase-requisition` | PurchaseRequisition.tsx | 🟢* | **แก้แล้ว** — ตาราง `purchase_requisitions`/`pr_line_items`/`pr_payments`/`pr_attachments` ใหม่ทั้งหมด + endpoint `procurement/purchase_requisitions.php` ใหม่ (เลขที่ PR สร้างฝั่ง server ไม่ใช่ client-side นับเหมือนเดิม), ไฟล์แนบ/หลักฐานโอนเงิน/รูปยืนยันรับของอัปโหลดจริงผ่าน `upload.php` ที่มีอยู่แล้ว *ต้องรัน `.sql` ใหม่บน production ก่อนใช้งานได้ (ดู checklist) |
| สต๊อกสินค้า | `/procurement/inventory-stock` | ProductInventory.tsx (`isProcurementMode`) | 🟢 | read-only |
| เบิกการใช้งาน | `/procurement/requisition-center` | RequisitionCenter.tsx | 🟢 | **แก้แล้ว** — แท็บ "เบิกซื้อวัสดุ" สร้าง PR แบบย่อผ่าน `purchase_requisitions.php` ใหม่ (รวมอัปโหลดไฟล์แนบ), แท็บ "จองรถส่วนกลาง" ต่อ `vehicle_reservations.php` จริงผ่าน `productionService` |
| รายงานและสรุปยอด | `/procurement/reports` | ProcurementReports.tsx | 🟢 | |
| การตั้งค่า | `/procurement/settings` | ProcurementSettings.tsx | 🟢 | **แก้แล้ว** — เพิ่ม Dialog เพิ่ม/แก้ไข โรงงาน (ใช้ service ที่มีอยู่แล้ว), วัสดุ, สี (เพิ่ม PUT ใหม่ใน `settings.php`), ช่องทางจัดส่ง (create); ช่องอัตราแลกเปลี่ยน/VAT แก้ไขได้และบันทึกจริงผ่าน `createSetting('general', ...)` ที่มี upsert อยู่แล้ว |
| คู่มือการทำงาน (เก่า) | `/procurement/user-manual` | `src/pages/procurement/UserManual.tsx` | 🔴⚫ | **คนละไฟล์กับ `UserManual.tsx` ที่แก้ในรอบนี้** — ยังเป็น mock ทั้งหน้า และเมนูถูกคอมเมนต์ปิด ดูข้อ 8 |
| สต็อกสินค้า (เก่า, ไม่มี route) | — | `src/pages/procurement/InventoryStock.tsx` | ⚫ | ไม่ถูก import ที่ไหนเลย |
| ประวัติใบเสนอราคา (เก่า, ไม่มี route) | — | `src/pages/procurement/QuotationHistory.tsx` | ⚫ | เช่นเดียวกัน |

### ฝ่ายผลิตและจัดส่ง (Production)

| หน้า | Route | ไฟล์ | สถานะ | หมายเหตุ |
|---|---|---|---|---|
| แดชบอร์ด | `/production`, `/production/dashboard` | ProductionDashboard.tsx | 🟢 | read-only overview |
| จัดการผลิตและจัดส่ง | `/production/orders`, `/production/order-management` | OrderManagement.tsx | 🟢 | |
| รายละเอียดออเดอร์ | `/production/orders/:orderId` | ProductionOrderDetail.tsx | 🟢 | ฝัง `ProductionWorkflowBox`/`ProductionStepBox` (แก้ user hardcode ในรอบนี้) |
| รายละเอียดงานพนักงาน | `/production/employee-tasks` | EmployeeTaskDetails.tsx | 🟢⚫ | ต่อ API จริงแล้ว แต่ **ไม่มีลิงก์เข้าถึงจากที่ไหนในเมนูเลย** เข้าได้เฉพาะพิมพ์ URL ตรงๆ |
| คลังสินค้า | `/production/inventory` | ProductInventory.tsx | 🟢 | ไฟล์ใหญ่สุดในระบบ (5,670 บรรทัด) — master catalog สินค้าสำเร็จรูปทั้งบริษัท |
| คำขอและการจัดการอื่นๆ (เก่า) | `/production/requests-management` | RequestsManagement.tsx | 🔴⚫ | mock ทั้งหน้า ไม่มีในเมนู ถูกแทนที่ด้วย VehicleRequestManagement (ฝั่งรถ) แล้ว |
| จัดการยานพาหนะ | `/production/vehicle-management` | VehicleRequestManagement.tsx | 🟡 | เกือบทั้งหมดจริง ยกเว้นการเปลี่ยนสถานะรถ (พร้อมใช้/ซ่อมบำรุง) ในแท็บ "จัดการข้อมูลรถ" เป็น client-state เท่านั้น ไม่ได้ save |
| รายละเอียดคำขอใช้รถ | `/production/vehicle-request/:id` | VehicleRequestDetail.tsx | 🟢 | |
| คลังสต็อก (Stage A กลุ่ม) | `/production/inventory-*` (dashboard/all/adjust/history/receive/transfer/settings/defective/damaged) | Inventory*.tsx | 🟢 | สร้างในรอบนี้ (Stage A) — คลัง `TEG`/`LUCKY` |
| จัดการสต็อกสินค้า (Stage B + วัสดุสำนักงาน) | `/production/inventory-management` | InventoryManagement.tsx | 🟢 | แก้ล่าสุดในรอบนี้ — รวม 3 โดเมน: Stage B (ของเสีย/สต็อกผลิต, เป็น tab ที่ฝังมาจริงอยู่แล้ว) + วัสดุสำนักงาน (แก้ใหม่) |
| รายงาน | `/production/reports` | ProductionReports.tsx | 🟡 | ข้อมูลจริง "ส่งออกรายงาน" แก้แล้ว แต่ปุ่ม "สั่งซื้อ" (reorder) ในตาราง stock ต่ำ ยังไม่ผูก handler |
| คู่มือการใช้งาน | `/production/user-manual` | UserManual.tsx (shared) | 🟢 | |
| Production Main (เก่า) | — ไม่มี route | ProductionMain.tsx | ⚫ | import ไว้ใน App.tsx แต่ไม่เคยถูกใช้เป็น element ของ Route ใดเลย |

### ฝ่ายบัญชี (Accounting)

| หน้า | Route | ไฟล์ | สถานะ | หมายเหตุ |
|---|---|---|---|---|
| หน้าแรก (hub) | `/accounting` | AccountingMain.tsx | 🟡 | quick-stats จริง แต่การ์ด "คู่มือการทำงาน" ลิงก์ไป `/accounting/work-guides` ที่ไม่มี route จริง (ลิงก์เสีย) |
| แดชบอร์ด | `/accounting/dashboard` | AccountingDashboard.tsx | 🟢 | แก้บั๊ก status enum, Export Excel/PDF, และแก้บล็อก hardcode ทั้งหมดแล้ว (ดูข้อ 14 ใน changelog) — เหลือ known limitation เดียวคือ GP/Margin ใช้สูตรประมาณต้นทุน 65% ของยอดขาย ไม่ใช่ต้นทุนจริงต่อออเดอร์ (ดูหัวข้อ known limitations) |
| รายรับ-รายจ่าย (เก่า) | `/accounting/revenue-expenses` | RevenueExpenses.tsx | 🔴⚫ | mock ทั้งหน้า ถูกแทนที่ด้วย Revenue.tsx + Expenses.tsx แล้ว ไม่มีในเมนู |
| ใบสั่งงาน | `/accounting/work-orders` | WorkOrders.tsx | 🟢 | Export Excel แก้แล้ว (เดิมมี handler แต่เป็น toast มายา) |
| หน้ารายรับ | `/accounting/revenue` | Revenue.tsx | 🟡 | Export Excel/PDF แก้แล้ว แต่ปุ่ม "ตรวจสอบรับยอด" ยังอัปเดตแค่ state ฝั่ง client ไม่ได้ยิง API บันทึก |
| หน้ารายจ่าย | `/accounting/expenses` | Expenses.tsx | 🟡 | Export Excel/PDF แก้แล้ว แต่ Import Excel ยังขึ้น toast เฉยๆ ไม่บันทึกจริง |
| การจัดการลูกหนี้ | `/accounting/customer-accounts` | CustomerAccounts.tsx | 🟢 | Export Excel แก้แล้ว |
| ทรัพย์สินสำนักงาน | `/accounting/office-inventory` | OfficeInventory.tsx | 🟢 | |
| เบิกเงินสดย่อย | `/accounting/petty-cash` | StandalonePettyCash.tsx | 🟢 | แก้แล้ว — "ยอดเงินคงเหลือ" คำนวณจริงจาก วงเงินสดย่อย (ตั้งค่าได้ผ่านไอคอนดินสอบนการ์ด) หักด้วยยอดที่จ่ายแล้วแต่ยังไม่เคลียร์ |
| เบิกใช้วัสดุสำนักงาน | `/accounting/office-requisitions` | OfficeRequisitions.tsx | 🟢 | |
| คำขอการเบิกจ่าย (เก่า) | `/accounting/internal-requests` | InternalRequests.tsx | 🟢 | **แก้แล้ว** — 3 แท็บต่อ backend จริงทั้งหมด: เบิกซื้อวัสดุ (`material_requests.php`, ผ่าน `accountingStockService` แผนก `'all'`), จองรถส่วนกลาง (`vehicle_reservations.php`), เบิกค่าใช้จ่ายพนักงาน (สร้างตาราง+endpoint ใหม่ `accounting_employee_expenses`) ปุ่มอนุมัติ/ปฏิเสธบันทึกจริง การ์ดสรุปคำนวณจากข้อมูลจริง |
| รายงานทางการเงิน | `/accounting/financial-reports` | FinancialReports.tsx | 🟢 | **แก้แล้ว** — ทุกกราฟ/ตาราง/การ์ดสรุปดึงจาก `dashboard.php`/`work_orders.php` จริง, Export Excel ทำงานจริง (KPI target ยังเป็นเป้าหมายธุรกิจคงที่ตามหลักการเดียวกับ `salesByPerson` target ที่มีอยู่แล้วในระบบ ไม่ใช่ mock) |
| รายงาน (hub) | `/accounting/reports` | ReportsMain.tsx | 🟢 | |
| รายงานยอดขาย | `/accounting/reports/sales` | SalesReport.tsx | 🟡 | Export Excel/PDF แก้แล้ว แต่ฟิลเตอร์วันที่/พนักงาน/ประเภทสินค้ายังเป็น cosmetic (ปุ่มค้นหาไม่ re-fetch) |
| รายงานสต๊อกสินค้า | `/accounting/reports/inventory` | InventoryReport.tsx | 🟡 | Export Excel/PDF แก้แล้ว แต่ฟิลเตอร์เป็น cosmetic เช่นกัน |
| รายงานวัสดุสำนักงาน | `/accounting/reports/office-supplies` | OfficeSuppliesReport.tsx | 🟢 | **แก้แล้ว** — เพิ่ม `type=office_supplies` ใน `reports.php` จริง (summary/กราฟรายเดือน/รายการคงเหลือ/ประวัติเบิกใช้จาก `accounting_office_supplies`+`accounting_office_requisitions`) ตาราง "ประวัติการเบิกใช้" ตัดคอลัมน์ แผนก/สถานะ ออกเพราะ schema จริงไม่มีข้อมูลนี้ |
| รายงานอุปกรณ์สำนักงาน | `/accounting/reports/office-equipment` | OfficeEquipmentReport.tsx | 🟡 | Export Excel/PDF แก้แล้ว แต่ฟิลเตอร์ cosmetic |
| รายงานเงินสดย่อย | `/accounting/reports/petty-cash` | PettyCashReport.tsx | 🟢 | แก้ในรอบนี้ |

### ฝ่ายบุคคล (HR)

| หน้า | Route | ไฟล์ | สถานะ | หมายเหตุ |
|---|---|---|---|---|
| หน้าแรก (hub) | `/hr` | HRMain.tsx | 🟡 | quick-stats หน้าแรก hardcode, การ์ด "คู่มือการทำงาน" ลิงก์ `/hr/work-guides` ที่ไม่มี route (ลิงก์เสีย) |
| แดชบอร์ด | `/hr/dashboard` | HRDashboard.tsx | 🟢 | Export Excel หลาย sheet ทำงานจริง |
| จัดการข้อมูลพนักงาน | `/hr/employee-management` | EmployeeManagement.tsx | 🟢 | |
| ค่าคอม → งานสั่งผลิต | `/hr/commission-made-to-order` | CommissionMadeToOrder.tsx | 🟢 | |
| ค่าคอม → งานสำเร็จรูป | `/hr/commission-ready-made` | CommissionReadyMade.tsx | 🟢 | |
| ตั้งค่า HR & Commission | `/hr/settings` | HRSettings.tsx | 🟢 | เป็น single source of truth ของสูตรคอมมิชชั่นทั้งระบบ |
| รายงานผล | `/hr/reports` | HRReports.tsx | 🟢 | มี dead import `supabase` ที่ไม่ได้ใช้ (ไม่กระทบการทำงาน) |
| รายงานค่าคอมรายเดือน | `/hr/monthly-commission-report` | MonthlyCommissionReport.tsx | 🟢 | เช่นกัน มี dead import `supabase` |
| จัดการผู้ใช้งานระบบ | `/hr/user-management` | HRUserManagement.tsx | 🟢🟡 | ทำงานจริง แต่เป็น **โค้ดซ้ำ** กับ `/manager/users` (คนละไฟล์ ยิง endpoint เดียวกันคนละวิธี) — ควรรวมเป็นไฟล์เดียวในอนาคต |

### ผู้บริหาร (Manager/Admin)

| หน้า | Route | ไฟล์ | สถานะ | หมายเหตุ |
|---|---|---|---|---|
| แดชบอร์ดผู้บริหาร | `/manager` | ExecutiveDashboard.tsx | 🟡 | ปุ่ม "รีเฟรช" ไม่มี handler (แต่เปลี่ยนช่วงเวลาแล้ว fetch ใหม่อัตโนมัติอยู่แล้ว) |
| การจัดการผู้ใช้งาน | `/manager/users` | UserManagement.tsx | 🟢 | เป็นตัว canonical (ดูหมายเหตุซ้ำกับ HRUserManagement) |
| การตั้งค่าระบบ | `/manager/settings` | SystemSettings.tsx | 🟢 | เก็บเป็น JSON blob แยกตาม key, กด save แยกทีละ section |
| รายงานผลรวม | `/manager/reports` | ComprehensiveReports.tsx | 🟢 | ข้อมูลจริงทั้งหมด, ปุ่ม Export Excel/PDF แก้แล้ว (เดิมเป็น toast มายา) |

---

## 3. สรุป Known Limitations แยกตามความสำคัญ

### 🔴 หน้า mock ที่ยัง "อยู่ในเมนู" ผู้ใช้เข้าถึงได้ (ความเสี่ยงสูงสุด — ผู้ใช้อาจเข้าใจผิดว่าบันทึกสำเร็จ)

**อัปเดต (รอบล่าสุด): ทั้ง 5 ข้อด้านล่างแก้เสร็จหมดแล้วในโค้ด** — ดูข้อ 15 ใน changelog แต่ 3 ข้อ (3, 4, 5) ต้องรัน `.sql` ใหม่ + deploy ไฟล์ PHP ใหม่ขึ้น production ก่อนจะใช้งานได้จริงบนเว็บไซต์จริง (ดู Deployment Checklist หัวข้อ 5)

1. ~~**`InternalRequests.tsx`** (`/accounting/internal-requests`) — อนุมัติ/ปฏิเสธกดไม่ได้จริง~~ ✅ แก้แล้ว
2. ~~**`FinancialReports.tsx`** (`/accounting/financial-reports`) — ตัวเลขสรุปทั้งหมดคงที่~~ ✅ แก้แล้ว
3. ~~**`OfficeSuppliesReport.tsx`** (`/accounting/reports/office-supplies`) — ไม่มี backend endpoint รองรับเลย~~ ✅ แก้แล้ว
4. ~~**`PurchaseRequisition.tsx`** (`/procurement/purchase-requisition`) — หน้า mock ที่ทำ UI สมบูรณ์ที่สุด เสี่ยงสูงสุดที่จะทำให้ผู้ใช้เข้าใจผิด เพราะดูใช้งานได้จริงทุกฟีเจอร์~~ ✅ แก้แล้ว (ตารางใหม่ต้องรัน `.sql` บน production ก่อน)
5. ~~**`RequisitionCenter.tsx`** (`/procurement/requisition-center`) — 2 ใน 3 แท็บ (เบิกซื้อวัสดุ, จองรถ) toast สำเร็จลวง ไม่บันทึกจริง~~ ✅ แก้แล้ว

### 🟡 บันทึกได้จริงบางส่วน แต่มีตัวเลข/ปุ่มสำคัญที่ยังไม่ทำงาน
- ~~`StandalonePettyCash.tsx`: ยอดเงินคงเหลือ hardcode ฿50,000~~ — **แก้แล้ว** (ดูข้อ 12 ใน changelog)
- ~~ปุ่ม Export Excel/PDF ที่ไม่ทำงานใน 13 หน้า~~ — **แก้แล้ว** (ดูข้อ 13 ใน changelog) — เหลือปุ่ม "สั่งซื้อ" (reorder) ใน `ProductionReports.tsx` ที่ยังไม่ผูก handler เป็นจุดเดียวที่ตกหล่น
- ~~`AccountingDashboard.tsx`: บล็อก hardcode (Top GP Jobs, หมวดค่าใช้จ่าย, ภาพรวมทรัพย์สิน/วัสดุสำนักงาน)~~ — **แก้แล้ว** (ดูข้อ 14 ใน changelog)
- **GP/Margin ใช้สูตรประมาณ (ไม่ใช่ต้นทุนจริง)**: `work_orders.php` และ (หลังแก้ข้อ 14) `dashboard.php` คำนวณ `expense = revenue * 0.65` เป็นค่าประมาณ เพราะตาราง `accounting_expenses` มีแค่ `po_no` (free text) ไม่มี FK เชื่อมกับ `orders.order_id` จึงหาต้นทุนจริงต่อออเดอร์ไม่ได้ในโครงสร้างข้อมูลปัจจุบัน — ตัวเลข GP/Margin ที่เห็นในหน้า WorkOrders.tsx และ AccountingDashboard.tsx (Top GP Jobs) จึงเป็นค่าประมาณเสมอ ไม่ใช่ตัวเลขบัญชีจริง การแก้ให้แม่นยำต้องเพิ่ม FK เชื่อมออเดอร์กับรายจ่าย (เปลี่ยนโครงสร้างข้อมูล)
- **`DesignReports.tsx`** (พบระหว่างแก้ export): กราฟ "ยอดขายตามประเภทสินค้า"/"ผลงานนักออกแบบ"/"แนวโน้ม 6 เดือน" เป็นค่า hardcode คงที่ ไม่ได้คำนวณจาก `jobs` ที่ fetch มาจริง และกราฟเส้น 30 วันใช้ `Math.random()` สุ่มค่าใหม่ทุกครั้งที่ render (ไม่ persist, เปลี่ยนทุกครั้งที่รีเฟรช) — มีแค่การ์ดสรุปสถานะงาน + รายการงานเท่านั้นที่เป็นข้อมูลจริง
- ~~**`ProcurementSettings.tsx`**: อ่าน/ลบได้ แต่เพิ่ม/แก้ไข ยังไม่มี handler~~ — **แก้แล้ว** (ดูข้อ 15 ใน changelog)

### ⚫ โค้ดขยะ/orphaned (ไม่กระทบผู้ใช้ตอนนี้ แต่ทำให้โค้ดสับสน แนะนำถามทีมก่อนลบ)
- ไม่มี route เลย: `ProductionMain.tsx`, `src/pages/design/JobManagement.tsx`, `src/pages/design/WorkGuides.tsx`, `src/pages/procurement/InventoryStock.tsx`, `src/pages/procurement/QuotationHistory.tsx`
- มี route แต่ไม่มีทางเข้าจากเมนู: `EmployeeTaskDetails.tsx`, `RequestsManagement.tsx` (production), `InternalRequisitions.tsx` (procurement, มี mock data ด้วย), `DesignReports.tsx` (จริงแล้วแต่เมนูปิด), `UserManual.tsx` ของ procurement (mock + เมนูปิด)
- ใช้ backend คนละระบบ: `ProductionOrder.tsx` (`/sales/production-order`) ยังเรียก Supabase แทน REST API เดียวกับหน้าอื่นทั้งหมด

### 🔁 โค้ดซ้ำที่ควรรวมในอนาคต
- `HRUserManagement.tsx` ↔ `UserManagement.tsx` (manager) — endpoint เดียวกัน คนละ implementation
- ~~`/procurement/estimation` (PriceEstimation.tsx เดิม, mock) ↔ `Quotation.tsx` จริง — sidebar หลักยังลิงก์ไปหน้า mock~~ — **แก้แล้ว**: route/sidebar ชี้ไป `Quotation.tsx` โดยตรงแล้ว ไฟล์ `PriceEstimation.tsx` เดิมยังอยู่ในโปรเจกต์แต่ไม่มี route ใช้แล้ว (ลบทิ้งได้ในอนาคตหากไม่มีใครอ้างอิง)
- `/sales/inventory` (InventoryStock.tsx) ↔ `/sales/product-inventory` (ProductInventory.tsx) — แสดงข้อมูลคล้ายกัน คนละหน้า

---

## 4. ฐานข้อมูล — ตารางที่สร้างใหม่ในรอบนี้ (ต้องรันบน production ก่อนใช้งาน)

Sandbox นี้เข้าถึง DB production จริงไม่ได้ — ไฟล์ `.sql` ด้านล่าง **ต้องถูกรันด้วยมือ** บนฐานข้อมูล production ก่อนฟีเจอร์ที่เกี่ยวข้องจะทำงาน (ถ้ายังไม่ได้ทำ):

| ไฟล์ | ตารางที่สร้าง | ใช้กับฟีเจอร์ |
|---|---|---|
| `backend/database/user_manual.sql` | 7 ตาราง (videos, manuals, quizzes, questions, attempts, ...) | คู่มือการใช้งานระบบ (6 route ที่ใช้ `UserManual.tsx`) |
| `backend/database/inventory.sql` | 8 ตาราง | คลังสินค้าหลัก Stage A (`/production/inventory-*`) |
| `backend/database/production_stock.sql` | 6 ตาราง | ของเสีย/สต็อกผลิต/เบิกใช้ Stage B |
| `backend/database/qc_approvals.sql` | ตาราง qc_approvals | QC หลายแผนกอนุมัติ (Sales `OrderDetail.tsx` + `QCVerificationCards.tsx`) |
| `backend/database/office_supplies.sql` | 3 ตาราง (มี seed data ให้แล้ว) | วัสดุสิ้นเปลืองสำนักงาน (`InventoryManagement.tsx`) |
| `backend/database/purchase_requisitions.sql` **(ใหม่)** | 4 ตาราง (`purchase_requisitions`, `pr_line_items`, `pr_payments`, `pr_attachments`) | สั่งซื้อวัสดุอุปกรณ์ (`PurchaseRequisition.tsx` + `RequisitionCenter.tsx` แท็บเบิกซื้อวัสดุ) |
| `backend/database/accounting_employee_expenses.sql` **(ใหม่)** | ตาราง `accounting_employee_expenses` | เบิกค่าใช้จ่ายพนักงาน (`InternalRequests.tsx` แท็บค่าใช้จ่ายพนักงาน) |

ทุกไฟล์เขียนด้วย `CREATE TABLE IF NOT EXISTS` จึงรันซ้ำได้อย่างปลอดภัยหากไม่แน่ใจว่าเคยรันไปแล้วหรือยัง

---

## 5. Deployment Checklist

- [ ] ยืนยันว่าไฟล์ `.sql` ทั้ง 5 ไฟล์ในหัวข้อ 4 ถูกรันบน DB production แล้ว **รวม 2 ไฟล์ใหม่ล่าสุด**: `purchase_requisitions.sql`, `accounting_employee_expenses.sql`
- [ ] ยืนยันว่าไฟล์ PHP ที่แก้/เพิ่มใน `backend/api/**` ถูก sync ไปยัง `api-lucky/admin/**` บน hosting จริงแล้ว (โค้ดในรีโปนี้แก้ทั้งสองชุดคู่ขนานพร้อมกันแล้ว แต่การอัปโหลดขึ้นเซิร์ฟเวอร์จริงต้องทำแยก) — **ไฟล์ใหม่/แก้ล่าสุดที่ต้อง deploy**: `procurement/purchase_requisitions.php` (ใหม่), `accounting/employee_expenses.php` (ใหม่), `procurement/settings.php` (แก้ เพิ่ม PUT), `accounting/reports.php` (แก้ เพิ่ม `type=office_supplies`), `material_requests.php` (แก้บั๊ก PUT ไม่รับ `status`), `price_estimations.php` (แก้บั๊ก HTTP 500 ตอนดึง list — ดูรายละเอียดด้านล่าง) — ยืนยันแล้วผ่าน `curl` ตรงว่า 2 ไฟล์ใหม่คืน 404 และ `price_estimations.php` list endpoint ยังคืน 500 บน production ตอนนี้ (ยังไม่ได้ deploy ทั้งหมด)
- [ ] รัน `npx tsc --noEmit -p tsconfig.app.json` — ควรมี error เท่า baseline เดิม (9 error ที่มีอยู่ก่อนแล้วใน `CreateOrderForm.tsx` ×4, `JobOrderManagement.tsx` ×2, `CommissionReadyMade.tsx` ×1, `HRDashboard.tsx` ×1 ซึ่งไม่เกี่ยวกับงานที่แก้รอบนี้)
- [ ] รัน `npm run build` ให้ผ่าน
- [ ] ทดสอบผ่านเบราว์เซอร์จริง (Playwright ใช้งานได้แล้วใน sandbox นี้หลังแก้ cache Chromium ที่เสีย — ใช้ทดสอบ 7 จุดที่แก้รอบนี้ผ่าน dev server จริงมาแล้ว) โดยเฉพาะบน **production จริงหลัง deploy**: login guard ข้ามแผนก, บันทึกรับเข้า/จ่ายออกวัสดุสำนักงาน, เบิกใช้ Stage B, QC approve/fail, สร้าง/แก้ไข PR วัสดุอุปกรณ์ใหม่, อนุมัติ/ปฏิเสธคำขอเบิกจ่าย 3 ประเภทใน `InternalRequests.tsx`
- [ ] **แก้แล้ว รอบ 2** (deploy แล้วครั้งแรกแต่ยังไม่พอ ต้อง deploy ซ้ำ): `price_estimations.php` คืน HTTP 500 ตอนดึงรายการทั้งหมด (`GET` ไม่มี `id`) ที่หน้า `/procurement/estimation/quotation` — รอบแรกแก้โดยเลิก `json_decode`/`json_encode` คอลัมน์ `details` ตอนดึง list + เพิ่ม memory_limit เป็น 256M + เพิ่ม shutdown handler ดักจับ fatal error ให้ตอบ JSON แทน body ว่าง หลัง deploy รอบแรกแล้วทดสอบซ้ำ shutdown handler ที่เพิ่มเข้าไปเผยให้เห็นสาเหตุจริงชัดเจนขึ้น: **`Allowed memory size of 268435456 bytes exhausted` ที่บรรทัด `$conn->query($sql)` เอง** — คือตัวคำสั่ง query แบบ buffered (ค่าเริ่มต้นของ mysqli) โหลดทั้ง 200 แถว (รวม `details` ที่มีไฟล์แนบ/รูปขนาดใหญ่) เข้าหน่วยความจำทั้งหมดก่อนจะเริ่มอ่านด้วยซ้ำ ไม่ใช่แค่ตอน json_decode/encode ตามที่เข้าใจตอนแรก. แก้เพิ่มรอบ 2: (1) เพิ่ม `memory_limit` เป็น 512M, (2) เปลี่ยนเป็น unbuffered query (`$conn->query($sql, MYSQLI_USE_RESULT)`) ให้ดึงทีละแถวแทนที่จะโหลดทั้ง result set มาก่อน ยืนยันด้วย `php -l` แล้ว — **ต้อง deploy `price_estimations.php` เวอร์ชันล่าสุดนี้ทับของเดิมอีกครั้ง** (ไม่มีตาราง `.sql` ใหม่ ไม่กระทบ schema)

---

## 6. ภาคผนวก — 33-Status Order Pipeline

`productStatusList` ที่นิยามใน `src/pages/sales/OrderTracking.tsx` คือ workflow backbone ที่ Sales, Design (sync สถานะ job), Procurement, และ Production ทุกแดชบอร์ดอ้างอิงร่วมกัน แบ่งเป็น 8 กลุ่มใหญ่: ประเมินราคา/อนุมัติ → ออกแบบกราฟิก → จัดซื้อ/สั่งผลิต → กำลังผลิต → QC/ตรวจสอบ → พร้อมจัดส่ง → ขนส่ง → ส่งถึงแล้ว หากจะแก้ไข/เพิ่มสถานะใหม่ในอนาคต ต้องแก้ที่ไฟล์นี้เป็นจุดเดียว แล้วไล่ตรวจผลกระทบใน `OrderDetail.tsx` (sync กับ design job), `JobOrderManagement.tsx` (sync กลับมาที่ order), และแดชบอร์ดของทุกแผนกที่นับสถานะกลุ่มนี้

## 7. ภาคผนวก — คู่มือการใช้งาน (`UserManual`) มี 2 ไฟล์ อย่าสับสน

| | `src/pages/UserManual.tsx` | `src/pages/procurement/UserManual.tsx` |
|---|---|---|
| Import เป็นชื่อ | `UserManual` | `ProcurementUserManual` |
| ใช้ที่ route | `/user-manual`, `/sales/user-manual`, `/design/user-manual`, `/production/user-manual`, `/accounting/user-manual`, `/hr/user-manual` (6 จุด) | `/procurement/user-manual` (จุดเดียว) |
| สถานะ | 🟢 แก้เป็น backend จริงในรอบนี้ (วิดีโอ/คู่มือ/แบบทดสอบพร้อม server-side grading) | 🔴 ยังเป็น mock ทั้งหน้า ไม่มี fetch/service call เลย |
| เข้าถึงได้จากเมนูไหม | ได้ | ไม่ได้ (sidebar entry ถูกคอมเมนต์ปิด) |

**ข้อเสนอแนะ**: ฝ่ายจัดซื้อควรใช้ `UserManual.tsx` (ตัวที่แก้แล้ว) เหมือนแผนกอื่น แทนที่จะมีไฟล์แยกของตัวเอง — ถ้าตกลงกันได้ ให้เปลี่ยน route `/procurement/user-manual` ให้ชี้ไปที่ component `UserManual` ตัวเดียวกับแผนกอื่น แล้วลบ `src/pages/procurement/UserManual.tsx` ทิ้ง (พร้อมเปิดเมนูกลับมา)
