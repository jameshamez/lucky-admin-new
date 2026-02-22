export interface Supply {
  id: string;
  code: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  dateReceived: string;
  minStock: number;
}

export interface Requisition {
  id: string;
  supplyId: string;
  supplyCode: string;
  supplyName: string;
  category: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  requester: string;
  date: string;
  note: string;
}

export const CATEGORIES = [
  "เครื่องเขียน",
  "กระดาษ/แฟ้ม",
  "อุปกรณ์สำนักงาน",
  "ของใช้ทั่วไป",
  "หมึก/โทนเนอร์",
];

export const UNITS = ["ชิ้น", "กล่อง", "โหล", "เล่ม", "รีม", "แพ็ค", "ขวด", "ม้วน"];

export const EMPLOYEES = [
  "นายสมชาย ใจดี",
  "นางสาวสมหญิง รักงาน",
  "นายทดสอบ ระบบดี",
  "นางสาวคลัง ยิ้มดี",
  "นายผู้จัดการ",
];

export const INITIAL_SUPPLIES: Supply[] = [
  { id: "1", code: "SUP-001", name: "ปากกาลูกลื่น", category: "เครื่องเขียน", quantity: 120, unit: "โหล", pricePerUnit: 85, dateReceived: "2024-01-10", minStock: 10 },
  { id: "2", code: "SUP-002", name: "กระดาษ A4", category: "กระดาษ/แฟ้ม", quantity: 50, unit: "รีม", pricePerUnit: 120, dateReceived: "2024-01-12", minStock: 20 },
  { id: "3", code: "SUP-003", name: "แฟ้มเอกสาร", category: "กระดาษ/แฟ้ม", quantity: 8, unit: "โหล", pricePerUnit: 180, dateReceived: "2024-01-15", minStock: 10 },
  { id: "4", code: "SUP-004", name: "สมุดบันทึก", category: "เครื่องเขียน", quantity: 30, unit: "เล่ม", pricePerUnit: 45, dateReceived: "2024-01-18", minStock: 15 },
  { id: "5", code: "SUP-005", name: "หมึกพิมพ์ HP", category: "หมึก/โทนเนอร์", quantity: 5, unit: "กล่อง", pricePerUnit: 950, dateReceived: "2024-02-01", minStock: 3 },
  { id: "6", code: "SUP-006", name: "กาวแท่ง", category: "อุปกรณ์สำนักงาน", quantity: 2, unit: "โหล", pricePerUnit: 65, dateReceived: "2024-02-05", minStock: 5 },
  { id: "7", code: "SUP-007", name: "กรรไกร", category: "อุปกรณ์สำนักงาน", quantity: 15, unit: "ชิ้น", pricePerUnit: 35, dateReceived: "2024-02-10", minStock: 5 },
];

export const INITIAL_REQUISITIONS: Requisition[] = [
  { id: "1", supplyId: "1", supplyCode: "SUP-001", supplyName: "ปากกาลูกลื่น", category: "เครื่องเขียน", quantity: 2, unit: "โหล", pricePerUnit: 85, requester: "นายสมชาย ใจดี", date: "2024-02-10", note: "ใช้ในแผนกขาย" },
  { id: "2", supplyId: "2", supplyCode: "SUP-002", supplyName: "กระดาษ A4", category: "กระดาษ/แฟ้ม", quantity: 5, unit: "รีม", pricePerUnit: 120, requester: "นางสาวสมหญิง รักงาน", date: "2024-02-12", note: "พิมพ์เอกสาร" },
  { id: "3", supplyId: "5", supplyCode: "SUP-005", supplyName: "หมึกพิมพ์ HP", category: "หมึก/โทนเนอร์", quantity: 1, unit: "กล่อง", pricePerUnit: 950, requester: "นายทดสอบ ระบบดี", date: "2024-02-14", note: "เปลี่ยนหมึกเครื่องปริ้น" },
];
