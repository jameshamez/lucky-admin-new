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

export const INITIAL_SUPPLIES: Supply[] = [];
export const INITIAL_REQUISITIONS: Requisition[] = [];
