import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  Search,
  AlertTriangle,
  Clock,
  Package,
  Truck,
  CheckCircle,
  Share2,
  FileSpreadsheet,
  X,
  Palette,
  ShoppingBag,
  Factory
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

// Status list for "เหรียญสั่งผลิต + ลูกค้ามีแบบแล้ว"
const productStatusList = [
  { status: "รอจัดซื้อส่งประเมิน", department: "เซลล์" },
  { status: "อยู่ระหว่างการประเมินราคา", department: "จัดซื้อ" },
  { status: "ได้รับราคา", department: "จัดซื้อ" },
  { status: "เสนอราคาให้ลูกค้า", department: "เซลล์" },
  { status: "ลูกค้าอนุมัติราคา", department: "เซลล์" },
  { status: "รอกราฟิกปรับไฟล์เพื่อผลิต", department: "กราฟิก" },
  { status: "กำลังปรับไฟล์ผลิต", department: "กราฟิก" },
  { status: "ไฟล์ผลิตพร้อมสั่งผลิต", department: "กราฟิก" },
  { status: "รอจัดซื้อออก PO / สั่งผลิต", department: "จัดซื้อ" },
  { status: "สั่งผลิตแล้ว", department: "จัดซื้อ" },
  { status: "กำลังผลิต", department: "โรงงาน" },
  { status: "ตรวจสอบ Artwork จากโรงงาน", department: "โรงงาน" },
  { status: "ตรวจสอบ CNC", department: "โรงงาน" },
  { status: "อัปเดทปั้มชิ้นงาน", department: "โรงงาน" },
  { status: "อัปเดตสาย", department: "โรงงาน" },
  { status: "อัปเดตชิ้นงานก่อนจัดส่ง", department: "QC" },
  { status: "งานเสร็จสมบูรณ์", department: "QC" },
  { status: "อยู่ระหว่างขนส่ง", department: "ขนส่ง" },
  { status: "สินค้ามาส่งที่ร้าน", department: "คลัง" },
];

interface StatusHistoryItem {
  status: string;
  updatedAt: string;
  updatedBy: string;
  department: string;
}

interface OrderItem {
  id: number;
  name: string;
  description: string;
  quantity: number;
  currentStatus: string;
  statusHistory: StatusHistoryItem[];
}

interface Order {
  id: string;
  customer: string;
  items: string;
  orderDate: string;
  dueDate: string;
  status: string;
  value: number;
  progress: number;
  type: string;
  location: string;
  department: string;
  lineId: string;
  phone: string;
  email: string;
  address: string;
  taxId: string;
  orderItems: OrderItem[];
  sentDepartments?: string[];
}

const mockOrders: Order[] = [
  {
    id: "JOB-2024-001",
    customer: "บริษัท เอบีซี จำกัด",
    items: "เหรียญสั่งผลิต, ถ้วยรางวัล",
    orderDate: "2024-12-20",
    dueDate: "2025-01-15",
    status: "in_production",
    value: 55000,
    progress: 55,
    type: "internal",
    location: "domestic",
    department: "production",
    lineId: "@abc_company",
    phone: "02-123-4567",
    email: "contact@abc.co.th",
    address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    taxId: "0105555123456",
    sentDepartments: ["ฝ่ายกราฟฟิก", "ฝ่ายจัดซื้อ", "ฝ่ายผลิตและจัดส่ง"],
    orderItems: [
      {
        id: 1, name: "เหรียญสั่งผลิต",
        description: "ลูกค้ามีแบบแล้ว - เหรียญทองแดงชุบทอง ขนาด 5 ซม. พร้อมริบบิ้น",
        quantity: 100, currentStatus: "สินค้ามาส่งที่ร้าน",
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2024-12-20 09:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2024-12-20 14:30", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2024-12-21 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "เสนอราคาให้ลูกค้า", updatedAt: "2024-12-21 15:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "ลูกค้าอนุมัติราคา", updatedAt: "2024-12-22 10:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "รอกราฟิกปรับไฟล์เพื่อผลิต", updatedAt: "2024-12-22 11:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "กำลังปรับไฟล์ผลิต", updatedAt: "2024-12-22 14:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "ไฟล์ผลิตพร้อมสั่งผลิต", updatedAt: "2024-12-23 09:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "รอจัดซื้อออก PO / สั่งผลิต", updatedAt: "2024-12-23 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "สั่งผลิตแล้ว", updatedAt: "2024-12-23 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "กำลังผลิต", updatedAt: "2024-12-24 09:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "ตรวจสอบ Artwork จากโรงงาน", updatedAt: "2024-12-25 10:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "ตรวจสอบ CNC", updatedAt: "2024-12-26 09:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "อัปเดทปั้มชิ้นงาน", updatedAt: "2024-12-27 09:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "อัปเดตสาย", updatedAt: "2024-12-28 09:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "อัปเดตชิ้นงานก่อนจัดส่ง", updatedAt: "2024-12-29 09:00", updatedBy: "QC Team", department: "QC" },
          { status: "งานเสร็จสมบูรณ์", updatedAt: "2024-12-30 09:00", updatedBy: "QC Team", department: "QC" },
          { status: "อยู่ระหว่างขนส่ง", updatedAt: "2024-12-31 09:00", updatedBy: "ขนส่ง", department: "ขนส่ง" },
          { status: "สินค้ามาส่งที่ร้าน", updatedAt: "2025-01-02 10:00", updatedBy: "คลังสินค้า", department: "คลัง" },
        ]
      },
      {
        id: 2, name: "ถ้วยรางวัล",
        description: "ถ้วยรางวัลโลหะ ขนาด 12 นิ้ว ชุบทอง พร้อมฐานไม้",
        quantity: 50, currentStatus: "ไฟล์ผลิตพร้อมสั่งผลิต",
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2024-12-20 09:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2024-12-20 14:30", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2024-12-21 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "เสนอราคาให้ลูกค้า", updatedAt: "2024-12-21 15:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "ลูกค้าอนุมัติราคา", updatedAt: "2024-12-22 10:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "รอกราฟิกปรับไฟล์เพื่อผลิต", updatedAt: "2024-12-22 11:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "กำลังปรับไฟล์ผลิต", updatedAt: "2024-12-22 14:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "ไฟล์ผลิตพร้อมสั่งผลิต", updatedAt: "2024-12-23 09:00", updatedBy: "อาร์ต", department: "กราฟิก" },
        ]
      }
    ]
  },
  {
    id: "JOB-2024-003",
    customer: "สมาคมกีฬาแห่งประเทศไทย",
    items: "เหรียญรางวัล",
    orderDate: "2024-12-28",
    dueDate: "2025-01-25",
    status: "in_production",
    value: 85000,
    progress: 65,
    type: "internal",
    location: "domestic",
    department: "production",
    lineId: "@sportthailand",
    phone: "02-214-3456",
    email: "info@sportthailand.org",
    address: "286 ถนนรามคำแหง แขวงหัวหมาก เขตบางกะปิ กรุงเทพฯ 10240",
    taxId: "0993000456789",
    sentDepartments: ["ฝ่ายกราฟฟิก", "ฝ่ายผลิตและจัดส่ง"],
    orderItems: [
      {
        id: 1, name: "เหรียญรางวัล",
        description: "เหรียญสั่งผลิต - วัสดุ: ทองแดงชุบทอง ขนาด 7 ซม. สีทอง/สีเงิน/สีทองแดง อย่างละ 200 เหรียญ พร้อมริบบิ้นไตรรงค์",
        quantity: 600, currentStatus: "ตรวจสอบ CNC",
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2024-12-28 09:00", updatedBy: "พิมพ์ใจ", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2024-12-28 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2024-12-29 10:30", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "เสนอราคาให้ลูกค้า", updatedAt: "2024-12-29 14:00", updatedBy: "พิมพ์ใจ", department: "เซลล์" },
          { status: "ลูกค้าอนุมัติราคา", updatedAt: "2024-12-30 09:00", updatedBy: "พิมพ์ใจ", department: "เซลล์" },
          { status: "รอกราฟิกปรับไฟล์เพื่อผลิต", updatedAt: "2024-12-30 10:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "กำลังปรับไฟล์ผลิต", updatedAt: "2024-12-30 14:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "ไฟล์ผลิตพร้อมสั่งผลิต", updatedAt: "2024-12-31 09:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "รอจัดซื้อออก PO / สั่งผลิต", updatedAt: "2024-12-31 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "สั่งผลิตแล้ว", updatedAt: "2024-12-31 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "กำลังผลิต", updatedAt: "2025-01-02 09:00", updatedBy: "โรงงาน B", department: "โรงงาน" },
          { status: "ตรวจสอบ Artwork จากโรงงาน", updatedAt: "2025-01-04 10:00", updatedBy: "โรงงาน B", department: "โรงงาน" },
        ]
      }
    ]
  },
  {
    id: "JOB-2024-004",
    customer: "มหาวิทยาลัยศิลปากร",
    items: "ถ้วยรางวัลโลหะอิตาลี",
    orderDate: "2024-12-10",
    dueDate: "2025-01-05",
    status: "shipped",
    value: 42000,
    progress: 100,
    type: "internal",
    location: "domestic",
    department: "production",
    lineId: "@silpakorn_uni",
    phone: "02-221-5555",
    email: "info@su.ac.th",
    address: "31 ถนนหน้าพระลาน แขวงพระบรมมหาราชวัง เขตพระนคร กรุงเทพฯ 10200",
    taxId: "0994000789123",
    sentDepartments: ["ฝ่ายจัดซื้อ", "ฝ่ายผลิตและจัดส่ง"],
    orderItems: [
      {
        id: 1, name: "ถ้วยรางวัลโลหะอิตาลี",
        description: "ถ้วยรางวัลโลหะนำเข้าจากอิตาลี รุ่น B112 G ขนาด 14 นิ้ว ชุบทอง พร้อมฐานหินอ่อน และโบว์สีแดง #1",
        quantity: 30, currentStatus: "สินค้ามาส่งที่ร้าน",
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2024-12-10 09:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2024-12-10 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2024-12-11 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "เสนอราคาให้ลูกค้า", updatedAt: "2024-12-11 14:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "ลูกค้าอนุมัติราคา", updatedAt: "2024-12-12 10:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "รอกราฟิกปรับไฟล์เพื่อผลิต", updatedAt: "2024-12-12 11:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "กำลังปรับไฟล์ผลิต", updatedAt: "2024-12-12 14:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "ไฟล์ผลิตพร้อมสั่งผลิต", updatedAt: "2024-12-13 09:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "รอจัดซื้อออก PO / สั่งผลิต", updatedAt: "2024-12-13 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "สั่งผลิตแล้ว", updatedAt: "2024-12-13 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "กำลังผลิต", updatedAt: "2024-12-14 09:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "ตรวจสอบ Artwork จากโรงงาน", updatedAt: "2024-12-16 10:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "ตรวจสอบ CNC", updatedAt: "2024-12-18 09:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "อัปเดทปั้มชิ้นงาน", updatedAt: "2024-12-20 09:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "อัปเดตสาย", updatedAt: "2024-12-22 09:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "อัปเดตชิ้นงานก่อนจัดส่ง", updatedAt: "2024-12-24 09:00", updatedBy: "QC Team", department: "QC" },
          { status: "งานเสร็จสมบูรณ์", updatedAt: "2024-12-26 09:00", updatedBy: "QC Team", department: "QC" },
          { status: "อยู่ระหว่างขนส่ง", updatedAt: "2024-12-28 09:00", updatedBy: "ขนส่ง", department: "ขนส่ง" },
          { status: "สินค้ามาส่งที่ร้าน", updatedAt: "2025-01-03 10:00", updatedBy: "คลังสินค้า", department: "คลัง" },
        ]
      }
    ]
  },
  {
    id: "JOB-2024-005",
    customer: "โรงเรียนอัสสัมชัญ",
    items: "เหรียญสำเร็จรูป",
    orderDate: "2025-01-02",
    dueDate: "2025-01-20",
    status: "in_production",
    value: 15000,
    progress: 45,
    type: "internal",
    location: "domestic",
    department: "production",
    lineId: "@assumption_bkk",
    phone: "02-630-7111",
    email: "info@assumption.ac.th",
    address: "26 ซอยเจริญกรุง 40 แขวงบางรัก เขตบางรัก กรุงเทพฯ 10500",
    taxId: "0994000111222",
    sentDepartments: ["ฝ่ายผลิตและจัดส่ง"],
    orderItems: [
      {
        id: 1, name: "เหรียญสำเร็จรูป",
        description: "สินค้าสำเร็จรูป - เหรียญสำเร็จรูป รุ่นพลาสติก รู้แพ้รู้ชนะ สีทอง 100 ชิ้น สีเงิน 50 ชิ้น",
        quantity: 150, currentStatus: "ได้รับราคา",
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2025-01-02 09:00", updatedBy: "สมหญิง", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2025-01-02 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2025-01-03 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
        ]
      }
    ]
  },
  {
    id: "JOB-2024-006",
    customer: "บริษัท สปอร์ตเดย์ จำกัด",
    items: "เสื้อ",
    orderDate: "2025-01-03",
    dueDate: "2025-01-25",
    status: "in_production",
    value: 45000,
    progress: 30,
    type: "internal",
    location: "domestic",
    department: "production",
    lineId: "@sportday_th",
    phone: "02-555-8899",
    email: "order@sportday.co.th",
    address: "88 ถนนรัชดาภิเษก แขวงห้วยขวาง เขตห้วยขวาง กรุงเทพฯ 10310",
    taxId: "0105558889999",
    sentDepartments: ["ฝ่ายกราฟฟิก", "ฝ่ายจัดซื้อ"],
    orderItems: [
      {
        id: 1, name: "เสื้อ",
        description: "หมวดสิ่งทอ & เสื้อผ้า - เสื้อผ้าไมโครเรียบ คอกลม แขนสั้น ไซส์ M 50 ตัว, L 80 ตัว, XL 70 ตัว",
        quantity: 200, currentStatus: "เสนอราคาให้ลูกค้า",
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2025-01-03 10:00", updatedBy: "พิมพ์ใจ", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2025-01-03 15:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2025-01-04 11:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "เสนอราคาให้ลูกค้า", updatedAt: "2025-01-04 14:00", updatedBy: "พิมพ์ใจ", department: "เซลล์" },
        ]
      }
    ]
  },
  {
    id: "JOB-2024-007",
    customer: "สมาคมศิษย์เก่าจุฬาลงกรณ์",
    items: "โล่สั่งผลิต",
    orderDate: "2025-01-05",
    dueDate: "2025-02-10",
    status: "in_production",
    value: 72000,
    progress: 55,
    type: "internal",
    location: "domestic",
    department: "production",
    lineId: "@chula_alumni",
    phone: "02-218-2000",
    email: "alumni@chula.ac.th",
    address: "254 ถนนพญาไท แขวงวังใหม่ เขตปทุมวัน กรุงเทพฯ 10330",
    taxId: "0993000999888",
    sentDepartments: ["ฝ่ายกราฟฟิก"],
    orderItems: [
      {
        id: 1, name: "โล่สั่งผลิต",
        description: "สินค้าสั่งผลิต - โล่อะคริลิค ขนาด 8x10 นิ้ว พร้อมฐานไม้สักทอง พิมพ์ UV สี่สี",
        quantity: 50, currentStatus: "กำลังปรับไฟล์ผลิต",
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2025-01-05 09:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2025-01-05 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2025-01-06 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "เสนอราคาให้ลูกค้า", updatedAt: "2025-01-06 14:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "ลูกค้าอนุมัติราคา", updatedAt: "2025-01-07 10:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "รอกราฟิกปรับไฟล์เพื่อผลิต", updatedAt: "2025-01-07 11:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "กำลังปรับไฟล์ผลิต", updatedAt: "2025-01-07 14:00", updatedBy: "อาร์ต", department: "กราฟิก" },
        ]
      }
    ]
  }
];

const statusConfig = {
  pending_approval: { label: "รออนุมัติ", color: "bg-yellow-500", textColor: "text-yellow-900", icon: Clock },
  in_production: { label: "กำลังผลิต", color: "bg-orange-500", textColor: "text-orange-900", icon: Package },
  ready_to_ship: { label: "พร้อมส่ง", color: "bg-blue-500", textColor: "text-blue-900", icon: Truck },
  shipped: { label: "เสร็จสิ้น", color: "bg-green-500", textColor: "text-green-900", icon: CheckCircle },
  urgent: { label: "เร่งด่วน", color: "bg-red-500", textColor: "text-red-900", icon: AlertTriangle }
};

const getStatusIndex = (status: string) => productStatusList.findIndex(s => s.status === status);

// Map item-level status to a broad progress category for bubble filters
const getProgressCategory = (status: string): string => {
  const idx = getStatusIndex(status);
  if (idx < 0) return "อื่นๆ";
  if (idx <= 4) return "ประเมินราคา/อนุมัติ";
  if (idx <= 7) return "ออกแบบกราฟิก";
  if (idx <= 9) return "จัดซื้อ/สั่งผลิต";
  if (idx <= 14) return "กำลังผลิต";
  if (idx <= 16) return "QC/ตรวจสอบ";
  if (idx <= 17) return "ขนส่ง";
  return "ส่งถึงแล้ว";
};

export default function OrderTracking() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("https://finfinphone.com/api-lucky/admin/orders.php");
        const json = await res.json();
        if (json.status === "success" && json.data) {
          const mappedOrders = json.data.map((o: any) => {
            const departments = (() => {
              if (!o.departments) return [];
              if (Array.isArray(o.departments)) return o.departments;
              if (typeof o.departments === 'string') {
                try { return JSON.parse(o.departments); } catch (e) { return []; }
              }
              return [];
            })();

            // Map standard order status for KPI
            let broadStatus = "pending_approval";
            if (["กำลังผลิต", "ตรวจสอบ Artwork จากโรงงาน", "ตรวจสอบ CNC", "อัปเดทปั้มชิ้นงาน", "อัปเดตสาย"].includes(o.order_status)) {
              broadStatus = "in_production";
            } else if (["อัปเดตชิ้นงานก่อนจัดส่ง", "งานเสร็จสมบูรณ์"].includes(o.order_status)) {
              broadStatus = "ready_to_ship";
            } else if (["อยู่ระหว่างขนส่ง", "สินค้ามาส่งที่ร้าน", "จัดส่งเรียบร้อย"].includes(o.order_status)) {
              broadStatus = "shipped";
            }

            return {
              id: o.job_id || String(o.order_id),
              customer: o.customer_name || "ไม่ระบุชื่อ",
              items: o.job_name || "ไม่ระบุสินค้า",
              orderDate: (o.order_date || "").split(" ")[0],
              dueDate: o.delivery_date || "-",
              status: broadStatus,
              value: parseFloat(o.total_amount) || 0,
              progress: 0,
              type: o.product_category || "internal",
              location: o.event_location || "domestic",
              department: o.responsible_person || "-",
              lineId: o.customer_line || "-",
              phone: o.customer_phone || "-",
              email: o.customer_email || "-",
              address: o.customer_address || o.delivery_address || "-",
              taxId: o.tax_id || "-",
              sentDepartments: departments,
              orderItems: [
                {
                  id: o.order_id || Math.random(),
                  name: o.job_name || "คำสั่งซื้อ",
                  description: o.notes || "สร้างจาก Order",
                  quantity: 1,
                  currentStatus: o.order_status || "รอจัดซื้อส่งประเมิน",
                  statusHistory: []
                }
              ]
            } as Order;
          });
          setOrders(mappedOrders);
        }
      } catch (err) {
        console.error(err);
        toast.error("ดึงข้อมูลออเดอร์ล้มเหลว");
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrders();
  }, []);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // KPI card filter
  const [progressBubble, setProgressBubble] = useState("all"); // bubble filter

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Column header filters
  const [colFilterId, setColFilterId] = useState("");
  const [colFilterCustomer, setColFilterCustomer] = useState("");
  const [colFilterOrderDate, setColFilterOrderDate] = useState("");
  const [colFilterDueDate, setColFilterDueDate] = useState("");
  const [colFilterItem, setColFilterItem] = useState("");
  const [colFilterStatus, setColFilterStatus] = useState("all");

  // Deep search utility
  const deepSearch = useCallback((order: Order, term: string): boolean => {
    const s = term.toLowerCase();
    const searchVal = (val: any): boolean => {
      if (val == null) return false;
      if (typeof val === "string") return val.toLowerCase().includes(s);
      if (typeof val === "number") return String(val).includes(s);
      if (Array.isArray(val)) return val.some(v => searchVal(v));
      if (typeof val === "object") return Object.values(val).some(v => searchVal(v));
      return false;
    };
    return searchVal(order);
  }, []);

  // Stats
  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter(o => o.status === "pending_approval").length,
    inProduction: orders.filter(o => o.status === "in_production").length,
    readyToShip: orders.filter(o => o.status === "ready_to_ship").length,
    urgent: orders.filter(o => o.status === "urgent").length,
  }), [orders]);

  // Progress bubble counts (item-level)
  const progressCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    orders.forEach(o => o.orderItems.forEach(item => {
      const cat = getProgressCategory(item.currentStatus);
      counts[cat] = (counts[cat] || 0) + 1;
    }));
    return counts;
  }, [orders]);

  const progressCategories = ["ประเมินราคา/อนุมัติ", "ออกแบบกราฟิก", "จัดซื้อ/สั่งผลิต", "กำลังผลิต", "QC/ตรวจสอบ", "ขนส่ง", "ส่งถึงแล้ว"];
  const progressColors: Record<string, string> = {
    "ประเมินราคา/อนุมัติ": "bg-gray-100 text-gray-700 border-gray-300",
    "ออกแบบกราฟิก": "bg-purple-100 text-purple-700 border-purple-300",
    "จัดซื้อ/สั่งผลิต": "bg-amber-100 text-amber-700 border-amber-300",
    "กำลังผลิต": "bg-orange-100 text-orange-700 border-orange-300",
    "QC/ตรวจสอบ": "bg-blue-100 text-blue-700 border-blue-300",
    "ขนส่ง": "bg-cyan-100 text-cyan-700 border-cyan-300",
    "ส่งถึงแล้ว": "bg-green-100 text-green-700 border-green-300",
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Deep search
      if (searchTerm.trim() && !deepSearch(order, searchTerm)) return false;
      // KPI card filter
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      // Column filters
      if (colFilterId && !order.id.toLowerCase().includes(colFilterId.toLowerCase())) return false;
      if (colFilterCustomer && !order.customer.toLowerCase().includes(colFilterCustomer.toLowerCase())) return false;
      if (colFilterOrderDate && !order.orderDate.includes(colFilterOrderDate)) return false;
      if (colFilterDueDate && !order.dueDate.includes(colFilterDueDate)) return false;
      if (colFilterItem) {
        const t = colFilterItem.toLowerCase();
        const itemMatch = order.orderItems.some(i => i.name.toLowerCase().includes(t) || i.description.toLowerCase().includes(t));
        if (!itemMatch) return false;
      }
      if (colFilterStatus !== "all") {
        const itemMatch = order.orderItems.some(i => i.currentStatus === colFilterStatus);
        if (!itemMatch) return false;
      }
      // Progress bubble filter
      if (progressBubble !== "all") {
        const itemMatch = order.orderItems.some(i => getProgressCategory(i.currentStatus) === progressBubble);
        if (!itemMatch) return false;
      }
      return true;
    });
  }, [orders, searchTerm, statusFilter, colFilterId, colFilterCustomer, colFilterOrderDate, colFilterDueDate, colFilterItem, colFilterStatus, progressBubble, deepSearch]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, colFilterId, colFilterCustomer, colFilterOrderDate, colFilterDueDate, colFilterItem, colFilterStatus, progressBubble]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const hasAnyFilter = searchTerm || statusFilter !== "all" || progressBubble !== "all" || colFilterId || colFilterCustomer || colFilterOrderDate || colFilterDueDate || colFilterItem || colFilterStatus !== "all";

  const clearAllFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setProgressBubble("all");
    setColFilterId("");
    setColFilterCustomer("");
    setColFilterOrderDate("");
    setColFilterDueDate("");
    setColFilterItem("");
    setColFilterStatus("all");
  };

  // Export CSV
  const handleExport = () => {
    const headers = ["รหัสออเดอร์", "ลูกค้า", "วันที่สั่ง", "วันจัดส่ง", "สินค้า", "จำนวน", "สถานะ", "เบอร์โทร", "อีเมล", "มูลค่า"];
    const rows: string[][] = [];
    filteredOrders.forEach(o => {
      o.orderItems.forEach(item => {
        rows.push([o.id, o.customer, o.orderDate, o.dueDate, item.name, String(item.quantity), item.currentStatus, o.phone, o.email, String(o.value)]);
      });
    });
    const bom = "\uFEFF";
    const csv = bom + [headers.join(","), ...rows.map(r => r.map(v => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order_tracking_${format(new Date(), "yyyyMMdd_HHmmss")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`ส่งออก ${rows.length} รายการเป็นไฟล์ CSV แล้ว`);
  };

  // Highlight helper
  const highlightText = (text: string, term: string) => {
    if (!term || !text) return text;
    try {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      return text.split(regex).map((part, i) =>
        regex.test(part) ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{part}</mark> : part
      );
    } catch { return text; }
  };

  const getItemStatusBadge = (status: string) => {
    const index = getStatusIndex(status);
    const total = productStatusList.length;
    const progress = total > 0 ? ((index + 1) / total) * 100 : 0;
    let bgColor = "bg-gray-100 text-gray-800";
    if (progress >= 90) bgColor = "bg-green-100 text-green-800";
    else if (progress >= 60) bgColor = "bg-blue-100 text-blue-800";
    else if (progress >= 30) bgColor = "bg-amber-100 text-amber-800";
    return <Badge className={`${bgColor} font-medium`}>{status}</Badge>;
  };

  const deptConfig: Record<string, { bg: string; text: string; icon: typeof Palette }> = {
    "ฝ่ายกราฟฟิก": { bg: "bg-purple-100", text: "text-purple-700", icon: Palette },
    "ฝ่ายจัดซื้อ": { bg: "bg-orange-100", text: "text-orange-700", icon: ShoppingBag },
    "ฝ่ายผลิตและจัดส่ง": { bg: "bg-emerald-100", text: "text-emerald-700", icon: Factory },
  };

  const getDeptBadges = (departments?: string[]) => {
    if (!departments || departments.length === 0) return <span className="text-muted-foreground text-xs">-</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {departments.map(dept => {
          const config = deptConfig[dept];
          if (!config) return null;
          const Icon = config.icon;
          return (
            <Badge key={dept} className={`${config.bg} ${config.text} gap-1 text-[10px] px-1.5 py-0.5`}>
              <Icon className="w-3 h-3" />
              {dept.replace("ฝ่าย", "")}
            </Badge>
          );
        })}
      </div>
    );
  };

  // Unique statuses for column filter
  const allItemStatuses = useMemo(() => {
    const set = new Set<string>();
    orders.forEach(o => o.orderItems.forEach(i => set.add(i.currentStatus)));
    return Array.from(set);
  }, [orders]);

  return (
    <div className="min-h-screen bg-[#F7F7F7] p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">ติดตามคำสั่งซื้อ</h1>
            <p className="text-muted-foreground">ดูสถานะและความคืบหน้าของคำสั่งซื้อทั้งหมด</p>
          </div>
        </div>

        {/* ===== KPI Cards (clickable as filters) ===== */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { key: "all", label: "ออเดอร์ทั้งหมด", count: stats.total, icon: Package, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
            { key: "pending_approval", label: "รออนุมัติ", count: stats.pending, icon: Clock, iconBg: "bg-yellow-50", iconColor: "text-yellow-600" },
            { key: "in_production", label: "กำลังผลิต", count: stats.inProduction, icon: Package, iconBg: "bg-orange-50", iconColor: "text-orange-600" },
            { key: "ready_to_ship", label: "พร้อมส่ง", count: stats.readyToShip, icon: Truck, iconBg: "bg-green-50", iconColor: "text-green-600" },
            { key: "urgent", label: "เร่งด่วน", count: stats.urgent, icon: AlertTriangle, iconBg: "bg-red-50", iconColor: "text-red-600" },
          ].map(card => {
            const Icon = card.icon;
            const isActive = statusFilter === card.key;
            return (
              <div
                key={card.key}
                onClick={() => setStatusFilter(isActive ? "all" : card.key)}
                className={`bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-all cursor-pointer border-2 ${isActive ? "border-primary ring-2 ring-primary/20" : "border-transparent"}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${card.iconBg}`}>
                    <Icon className={`w-6 h-6 ${card.iconColor}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground mb-1">{card.label}</p>
                    <p className="text-3xl font-bold text-foreground">{card.count}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== Progress Bubble Filters ===== */}
        <div className="bg-white p-4 rounded-lg shadow-sm space-y-2">
          <p className="text-sm font-medium text-muted-foreground">สถานะความคืบหน้า</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setProgressBubble("all")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${progressBubble === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"}`}
            >
              ทั้งหมด
              <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold ${progressBubble === "all" ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted-foreground/20 text-muted-foreground"}`}>
                {orders.reduce((s, o) => s + o.orderItems.length, 0)}
              </span>
            </button>
            {progressCategories.map(cat => {
              const count = progressCounts[cat] || 0;
              if (count === 0) return null;
              const isActive = progressBubble === cat;
              const colors = progressColors[cat] || "bg-gray-100 text-gray-700 border-gray-300";
              return (
                <button
                  key={cat}
                  onClick={() => setProgressBubble(isActive ? "all" : cat)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isActive ? "ring-2 ring-primary/30 border-primary" : ""} ${colors}`}
                >
                  {cat}
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-black/10">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== Search & Export ===== */}
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Deep Search - ค้นหาทุกข้อมูล (รหัส, ลูกค้า, สินค้า, เบอร์โทร, อีเมล, ที่อยู่, วัสดุ...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-border"
            />
          </div>
          <Button variant="outline" onClick={handleExport} className="gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Export
          </Button>
          {hasAnyFilter && (
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="gap-1 text-destructive">
              <X className="w-4 h-4" /> ล้างตัวกรอง
            </Button>
          )}
        </div>

        {/* ===== Orders Table with Column Filters ===== */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center flex flex-col items-center justify-center">
              <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4"></div>
              <p className="text-muted-foreground">กำลังโหลดข้อมูลออเดอร์...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">ไม่พบออเดอร์ที่ตรงกับเงื่อนไขการค้นหา</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground">รหัสออเดอร์</TableHead>
                    <TableHead className="font-semibold text-foreground">ลูกค้า</TableHead>
                    <TableHead className="font-semibold text-foreground">วันที่สั่ง</TableHead>
                    <TableHead className="font-semibold text-foreground">วันที่จัดส่ง</TableHead>
                    <TableHead className="font-semibold text-foreground">สินค้า</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">จำนวน</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">แผนกที่ส่งงาน</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">สถานะความคืบหน้า</TableHead>
                    <TableHead className="font-semibold text-foreground text-center">จัดการ</TableHead>
                  </TableRow>
                  {/* Column filter row */}
                  <TableRow className="bg-muted/30">
                    <TableHead className="py-1">
                      <Input placeholder="กรอง..." value={colFilterId} onChange={e => setColFilterId(e.target.value)} className="h-7 text-xs" />
                    </TableHead>
                    <TableHead className="py-1">
                      <Input placeholder="กรอง..." value={colFilterCustomer} onChange={e => setColFilterCustomer(e.target.value)} className="h-7 text-xs" />
                    </TableHead>
                    <TableHead className="py-1">
                      <Input placeholder="วันที่..." value={colFilterOrderDate} onChange={e => setColFilterOrderDate(e.target.value)} className="h-7 text-xs" />
                    </TableHead>
                    <TableHead className="py-1">
                      <Input placeholder="วันที่..." value={colFilterDueDate} onChange={e => setColFilterDueDate(e.target.value)} className="h-7 text-xs" />
                    </TableHead>
                    <TableHead className="py-1">
                      <Input placeholder="กรอง..." value={colFilterItem} onChange={e => setColFilterItem(e.target.value)} className="h-7 text-xs" />
                    </TableHead>
                    <TableHead className="py-1"></TableHead>
                    <TableHead className="py-1"></TableHead>
                    <TableHead className="py-1">
                      <Select value={colFilterStatus} onValueChange={setColFilterStatus}>
                        <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">ทั้งหมด</SelectItem>
                          {allItemStatuses.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableHead>
                    <TableHead className="py-1"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order, orderIndex) => {
                    const itemCount = order.orderItems.length;
                    const isEvenOrder = orderIndex % 2 === 0;
                    const orderBgColor = isEvenOrder ? "bg-white" : "bg-slate-50/70";

                    return (
                      <React.Fragment key={order.id}>
                        {orderIndex > 0 && (
                          <TableRow>
                            <TableCell colSpan={9} className="p-0 h-1 bg-slate-200" />
                          </TableRow>
                        )}
                        {order.orderItems.map((item, itemIndex) => (
                          <TableRow
                            key={`${order.id}-${item.id}`}
                            className={`${orderBgColor} hover:bg-slate-100/50 transition-colors ${itemIndex < itemCount - 1 ? 'border-b border-dashed border-slate-200' : ''}`}
                          >
                            {itemIndex === 0 ? (
                              <>
                                <TableCell className="font-semibold align-middle py-4 border-l-4 border-l-primary" rowSpan={itemCount}>
                                  <a
                                    href={`/sales/track-orders/${order.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer"
                                  >
                                    {highlightText(order.id, searchTerm)}
                                  </a>
                                </TableCell>
                                <TableCell className="font-medium align-middle py-4" rowSpan={itemCount}>
                                  {highlightText(order.customer, searchTerm)}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground align-middle py-4" rowSpan={itemCount}>
                                  {highlightText(order.orderDate, searchTerm)}
                                </TableCell>
                                <TableCell className={`text-sm align-middle py-4 ${order.status === "urgent" ? "text-red-600 font-semibold" : "text-muted-foreground"}`} rowSpan={itemCount}>
                                  {highlightText(order.dueDate, searchTerm)}
                                </TableCell>
                              </>
                            ) : null}
                            <TableCell className="py-3">
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                                  {itemIndex + 1}
                                </span>
                                <span className="font-medium">{highlightText(item.name, searchTerm)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-center py-3">
                              <span className="text-sm font-medium">{item.quantity} ชิ้น</span>
                            </TableCell>
                            {itemIndex === 0 ? (
                              <TableCell className="align-middle py-3" rowSpan={itemCount}>
                                {getDeptBadges(order.sentDepartments)}
                              </TableCell>
                            ) : null}
                            <TableCell className="text-center py-3">
                              {getItemStatusBadge(item.currentStatus)}
                            </TableCell>
                            <TableCell className="text-center py-3">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/sales/track-orders/${order.id}?item=${item.id}`)}
                                  className="hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                                >
                                  ดูรายละเอียด
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const url = `${window.location.origin}/sales/track-orders/${order.id}?item=${item.id}`;
                                    navigator.clipboard.writeText(url).then(() => {
                                      toast.success("คัดลอกลิงก์แชร์สถานะเรียบร้อยแล้ว");
                                    }).catch(() => {
                                      toast.error("ไม่สามารถคัดลอกลิงก์ได้");
                                    });
                                  }}
                                  className="hover:bg-green-600 hover:text-white transition-colors text-xs gap-1"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  แชร์สถานะ
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>แสดง</span>
                <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-8 w-[70px] text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span>จาก {filteredOrders.length} รายการ</span>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="h-8 px-2 text-xs">«</Button>
                <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="h-8 px-3 text-xs">ก่อนหน้า</Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page: number;
                  if (totalPages <= 5) { page = i + 1; }
                  else if (currentPage <= 3) { page = i + 1; }
                  else if (currentPage >= totalPages - 2) { page = totalPages - 4 + i; }
                  else { page = currentPage - 2 + i; }
                  return (
                    <Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" onClick={() => setCurrentPage(page)} className="h-8 w-8 p-0 text-xs">
                      {page}
                    </Button>
                  );
                })}
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="h-8 px-3 text-xs">ถัดไป</Button>
                <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="h-8 px-2 text-xs">»</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
