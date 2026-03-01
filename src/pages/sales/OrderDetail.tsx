import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  ArrowLeft,
  AlertTriangle,
  Clock,
  Package,
  Truck,
  CheckCircle,
  Building2,
  Circle,
  CheckCircle2,
  FileText,
  History,
  XCircle,
  ImageIcon,
  Ship,
  Plane,
  Car,
  Warehouse,
  ClipboardCheck,
  Send,
  PackageCheck,
  Factory,
  Globe,
  MapPin,
  ThumbsUp
} from "lucide-react";
import { toast } from "sonner";
import artworkSample from "@/assets/artwork-sample.png";
import QCVerificationCards from "@/components/sales/QCVerificationCards";
import LogisticsDeliveryCards from "@/components/sales/LogisticsDeliveryCards";
import ProductionProgressBar from "@/components/sales/ProductionProgressBar";
import { ProductionOrderInfoReadOnly, OrderShippingData } from "@/components/procurement/ProductionOrderInfo";

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
  // Optional fields for readymade trophy
  productType?: "readymade" | "madeToOrder";
  material?: string;
  productModel?: string; // รุ่นสินค้า for readymade medals
  model?: string;
  modelSize?: string;
  engraving?: {
    number: string;
    color: string;
  };
  bow?: {
    number: string;
  };
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
}

const mockOrders: Order[] = [
  {
    id: "JOB-2024-001",
    customer: "บริษัท เอบีซี จำกัด",
    items: "เหรียญสั่งผลิต 100 เหรียญ",
    orderDate: "2024-12-20",
    dueDate: "2025-01-15",
    status: "completed",
    value: 35000,
    progress: 100,
    type: "internal",
    location: "domestic",
    department: "production",
    lineId: "@abc_company",
    phone: "02-123-4567",
    email: "contact@abc.co.th",
    address: "123 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพฯ 10110",
    taxId: "0105555123456",
    orderItems: [
      {
        id: 1,
        name: "เหรียญสั่งผลิต",
        description: "ลูกค้ามีแบบแล้ว - เหรียญทองแดงชุบทอง ขนาด 5 ซม. พร้อมริบบิ้น",
        quantity: 100,
        currentStatus: "งานเสร็จสมบูรณ์",
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
          { status: "ตรวจสอบ Artwork จากโรงงาน", updatedAt: "2024-12-26 10:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "ตรวจสอบ CNC", updatedAt: "2024-12-28 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "อัปเดทปั้มชิ้นงาน", updatedAt: "2024-12-30 10:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "อัปเดตสาย", updatedAt: "2025-01-02 11:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "อัปเดตชิ้นงานก่อนจัดส่ง", updatedAt: "2025-01-05 09:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
          { status: "งานเสร็จสมบูรณ์", updatedAt: "2025-01-08 15:00", updatedBy: "โรงงาน A", department: "โรงงาน" },
        ]
      }
    ]
  },
  {
    id: "JOB-2024-002",
    customer: "โรงเรียนสาธิต มหาวิทยาลัยเกษตรศาสตร์",
    items: "ถ้วยรางวัลโลหะอิตาลี 20 ชิ้น",
    orderDate: "2024-12-22",
    dueDate: "2025-01-20",
    status: "in_production",
    value: 28000,
    progress: 40,
    type: "internal",
    location: "domestic",
    department: "production",
    lineId: "@satit_ku",
    phone: "02-942-8888",
    email: "admin@satit.ku.ac.th",
    address: "50 ถนนพหลโยธิน แขวงลาดยาว เขตจตุจักร กรุงเทพฯ 10900",
    taxId: "0994000123456",
    orderItems: [
      {
        id: 1,
        name: "ถ้วยรางวัลโลหะอิตาลี",
        description: "ถ้วยรางวัลโลหะนำเข้าจากอิตาลี ขนาด 10 นิ้ว พร้อมฐานหินอ่อน",
        quantity: 20,
        currentStatus: "ลูกค้าอนุมัติราคา",
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2024-12-22 10:00", updatedBy: "สมหญิง", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2024-12-22 15:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2024-12-23 09:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "เสนอราคาให้ลูกค้า", updatedAt: "2024-12-23 11:00", updatedBy: "สมหญิง", department: "เซลล์" },
          { status: "ลูกค้าอนุมัติราคา", updatedAt: "2024-12-24 10:00", updatedBy: "สมหญิง", department: "เซลล์" },
        ]
      }
    ]
  },
  {
    id: "JOB-2024-003",
    customer: "สมาคมกีฬาแห่งประเทศไทย",
    items: "เหรียญรางวัล 600 เหรียญ",
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
    orderItems: [
      {
        id: 1,
        name: "เหรียญรางวัล",
        description: "เหรียญสั่งผลิต - วัสดุ: ทองแดงชุบทอง ขนาด 7 ซม. สีทอง/สีเงิน/สีทองแดง อย่างละ 200 เหรียญ พร้อมริบบิ้นไตรรงค์",
        quantity: 600,
        currentStatus: "ตรวจสอบ CNC",
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
    items: "ถ้วยรางวัลโลหะอิตาลี 30 ชิ้น",
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
    orderItems: [
      {
        id: 1,
        name: "ถ้วยรางวัลโลหะอิตาลี",
        description: "ถ้วยรางวัลโลหะอิตาลี รุ่น B112 G ขนาด 14 นิ้ว พร้อมป้ายจารึก และโบว์สีแดง #1",
        quantity: 30,
        currentStatus: "สินค้าประกอบเสร็จ",
        // Trophy-specific details
        productType: "readymade", // สินค้าสำเร็จรูป
        material: "โลหะ",
        model: "B112 G",
        modelSize: "14 นิ้ว",
        engraving: {
          number: "#A001",
          color: "สีทอง"
        },
        bow: {
          number: "#1"
        },
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2024-12-10 09:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2024-12-10 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2024-12-11 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "เสนอราคาให้ลูกค้า", updatedAt: "2024-12-11 14:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "ลูกค้าอนุมัติราคา", updatedAt: "2024-12-12 10:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "จัดหา", updatedAt: "2024-12-13 09:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ประกอบสินค้า", updatedAt: "2024-12-15 10:00", updatedBy: "ช่างประกอบ", department: "ผลิต" },
          { status: "ผูกโบว์", updatedAt: "2024-12-17 09:00", updatedBy: "ช่างประกอบ", department: "ผลิต" },
          { status: "ติดป้ายจารึก", updatedAt: "2024-12-18 14:00", updatedBy: "ช่างประกอบ", department: "ผลิต" },
          { status: "สินค้าประกอบเสร็จ", updatedAt: "2024-12-20 10:00", updatedBy: "QC Team", department: "QC" },
          { status: "อยู่ระหว่างขนส่ง", updatedAt: "2024-12-28 09:00", updatedBy: "ขนส่ง", department: "ขนส่ง" },
          { status: "สินค้ามาส่งที่ร้าน", updatedAt: "2025-01-03 10:00", updatedBy: "คลังสินค้า", department: "คลัง" },
        ]
      }
    ]
  },
  {
    id: "JOB-2024-005",
    customer: "โรงเรียนอัสสัมชัญ",
    items: "เหรียญสำเร็จรูป 150 ชิ้น",
    orderDate: "2025-01-02",
    dueDate: "2025-01-20",
    status: "in_production",
    value: 22500,
    progress: 25,
    type: "internal",
    location: "domestic",
    department: "production",
    lineId: "@assumption_bkk",
    phone: "02-630-6200",
    email: "info@assumption.ac.th",
    address: "26 ถนนเจริญกรุง ซอย 40 แขวงบางรัก เขตบางรัก กรุงเทพฯ 10500",
    taxId: "0994000567890",
    orderItems: [
      {
        id: 1,
        name: "เหรียญสำเร็จรูป",
        description: "เหรียญสำเร็จรูป รุ่น พลาสติก รู้แพ้รู้ชนะ สีทอง พร้อมริบบิ้น",
        quantity: 150,
        currentStatus: "คล้องสาย",
        productType: "readymade",
        productModel: "พลาสติก รู้แพ้รู้ชนะ",
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2025-01-02 09:00", updatedBy: "สมชาย", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2025-01-02 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2025-01-03 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "จัดหาสินค้า", updatedAt: "2025-01-04 09:00", updatedBy: "สมศรี", department: "คลัง" },
          { status: "ติดสติ๊กเกอร์", updatedAt: "2025-01-05 10:00", updatedBy: "สมศรี", department: "คลัง" },
          { status: "คล้องสาย", updatedAt: "2025-01-06 14:00", updatedBy: "สมศรี", department: "คลัง" },
        ]
      }
    ]
  },
  {
    id: "JOB-2024-006",
    customer: "บริษัท สปอร์ตเดย์ จำกัด",
    items: "เสื้อ 200 ชิ้น",
    orderDate: "2025-01-03",
    dueDate: "2025-01-25",
    status: "in_production",
    value: 40000,
    progress: 30,
    type: "internal",
    location: "domestic",
    department: "production",
    lineId: "@sportday_th",
    phone: "02-555-1234",
    email: "order@sportday.co.th",
    address: "88 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900",
    taxId: "0105561234567",
    orderItems: [
      {
        id: 1,
        name: "เสื้อ",
        description: "เสื้อโปโล สีขาว ปักโลโก้ ไซส์ M-XL",
        quantity: 200,
        currentStatus: "เสนอราคาให้ลูกค้า",
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2025-01-03 09:00", updatedBy: "พิมพ์ใจ", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2025-01-03 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2025-01-04 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "เสนอราคาให้ลูกค้า", updatedAt: "2025-01-04 14:00", updatedBy: "พิมพ์ใจ", department: "เซลล์" },
        ]
      }
    ]
  },
  {
    id: "JOB-2024-007",
    customer: "สมาคมศิษย์เก่าจุฬาลงกรณ์",
    items: "โล่สั่งผลิต 50 ชิ้น",
    orderDate: "2025-01-05",
    dueDate: "2025-02-10",
    status: "in_production",
    value: 75000,
    progress: 45,
    type: "internal",
    location: "domestic",
    department: "production",
    lineId: "@chula_alumni",
    phone: "02-218-7777",
    email: "alumni@chula.ac.th",
    address: "254 ถนนพญาไท แขวงวังใหม่ เขตปทุมวัน กรุงเทพฯ 10330",
    taxId: "0993000123789",
    orderItems: [
      {
        id: 1,
        name: "โล่สั่งผลิต",
        description: "โล่รางวัลอะคริลิค ขนาด 8x10 นิ้ว พิมพ์ UV พร้อมกล่อง",
        quantity: 50,
        currentStatus: "กำลังปรับไฟล์ผลิต",
        productType: "madeToOrder",
        statusHistory: [
          { status: "รอจัดซื้อส่งประเมิน", updatedAt: "2025-01-05 09:00", updatedBy: "สมหญิง", department: "เซลล์" },
          { status: "อยู่ระหว่างการประเมินราคา", updatedAt: "2025-01-05 14:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "ได้รับราคา", updatedAt: "2025-01-06 10:00", updatedBy: "วิชัย", department: "จัดซื้อ" },
          { status: "เสนอราคาให้ลูกค้า", updatedAt: "2025-01-06 14:00", updatedBy: "สมหญิง", department: "เซลล์" },
          { status: "ลูกค้าอนุมัติราคา", updatedAt: "2025-01-07 10:00", updatedBy: "สมหญิง", department: "เซลล์" },
          { status: "รอกราฟิกปรับไฟล์เพื่อผลิต", updatedAt: "2025-01-07 11:00", updatedBy: "อาร์ต", department: "กราฟิก" },
          { status: "กำลังปรับไฟล์ผลิต", updatedAt: "2025-01-08 09:00", updatedBy: "อาร์ต", department: "กราฟิก" },
        ]
      }
    ]
  }
];

const statusConfig = {
  pending_approval: {
    label: "รออนุมัติ",
    color: "bg-yellow-500",
    textColor: "text-yellow-900",
    icon: Clock
  },
  in_production: {
    label: "กำลังผลิต",
    color: "bg-orange-500",
    textColor: "text-orange-900",
    icon: Package
  },
  ready_to_ship: {
    label: "พร้อมส่ง",
    color: "bg-blue-500",
    textColor: "text-blue-900",
    icon: Truck
  },
  shipped: {
    label: "เสร็จสิ้น",
    color: "bg-green-500",
    textColor: "text-green-900",
    icon: CheckCircle
  },
  completed: {
    label: "เสร็จสิ้น",
    color: "bg-green-500",
    textColor: "text-green-900",
    icon: CheckCircle
  },
  urgent: {
    label: "เร่งด่วน",
    color: "bg-red-500",
    textColor: "text-red-900",
    icon: AlertTriangle
  }
};

// Helper function to get status index
const getStatusIndex = (status: string) => {
  return productStatusList.findIndex(s => s.status === status);
};

// Helper to find the slowest item (lowest status index)
const getSlowestItem = (items: OrderItem[]) => {
  let slowestIndex = Infinity;
  let slowestItem: OrderItem | null = null;

  items.forEach(item => {
    const index = getStatusIndex(item.currentStatus);
    if (index < slowestIndex && index >= 0) {
      slowestIndex = index;
      slowestItem = item;
    }
  });

  return slowestItem;
};

// Helper to count items by status category
const getStatusCounts = (items: OrderItem[]) => {
  const counts: { [key: string]: number } = {};
  items.forEach(item => {
    const status = item.currentStatus;
    counts[status] = (counts[status] || 0) + 1;
  });
  return counts;
};

export default function OrderDetail() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [showUploadHistory, setShowUploadHistory] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [showDeliveryDetail, setShowDeliveryDetail] = useState(false);

  // Mock delivery details data
  const deliveryDetails = {
    carrierName: "Kerry Express",
    trackingNumber: "TH2568011234567",
    deliveryLink: "https://th.kerryexpress.com/track?tracking_no=TH2568011234567",
    vehiclePickup: false, // true if called vehicle to pick up
    vehicleInfo: null as { driverName?: string; vehiclePlate?: string; contactPhone?: string } | null,
  };

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (!orderId) return;
      setIsLoading(true);
      try {
        let finalOrderId = orderId;

        // If orderId is not numeric (is a job_id like JOB-xxx), find the numeric order_id first
        if (isNaN(Number(orderId))) {
          const searchRes = await fetch(`https://finfinphone.com/api-lucky/admin/orders.php?search=${orderId}`);
          const searchJson = await searchRes.json();
          if (searchJson.status === "success" && searchJson.data && searchJson.data.length > 0) {
            // Find exact match by job_id
            const match = searchJson.data.find((d: any) => d.job_id === orderId);
            if (match) {
              finalOrderId = String(match.order_id);
            }
          }
        }

        // Fetch full detail using numeric id (actually uses order_id param if my fix at line 57 works or search works)
        // Since I fixed line 57 to order_id = ?, I'll try to find a way to pass it.
        // Actually, let's use the param name that works: order_id
        const res = await fetch(`https://finfinphone.com/api-lucky/admin/orders.php?order_id=${finalOrderId}`);
        const json = await res.json();

        if (json.status === "success" && json.data) {
          // The API might return the array from search or single object from detail
          const apiData = Array.isArray(json.data) ? json.data[0] : json.data;

          if (!apiData) {
            setOrder(null);
            return;
          }

          // Broad status mapping
          let broadStatus = "pending_approval";
          const os = apiData.order_status;
          if (["กำลังผลิต", "ตรวจสอบ Artwork จากโรงงาน", "ตรวจสอบ CNC", "อัปเดทปั้มชิ้นงาน", "อัปเดตสาย"].includes(os)) {
            broadStatus = "in_production";
          } else if (["อัปเดตชิ้นงานก่อนจัดส่ง", "งานเสร็จสมบูรณ์"].includes(os)) {
            broadStatus = "ready_to_ship";
          } else if (["อยู่ระหว่างขนส่ง", "สินค้ามาส่งที่ร้าน", "จัดส่งเรียบร้อย"].includes(os)) {
            broadStatus = "shipped";
          }

          // Map order items
          const mappedItems: OrderItem[] = (apiData.items || []).map((item: any) => ({
            id: item.id || item.item_id,
            name: item.product_name || apiData.job_name || "สินค้า",
            description: item.notes || apiData.notes || "-",
            quantity: parseInt(item.quantity) || 1,
            currentStatus: item.status || apiData.order_status || "รอคำสั่งซื้อ",
            statusHistory: [],
            productType: apiData.product_category === "readymade" ? "readymade" : "madeToOrder",
            material: item.details?.material || "-",
            model: item.details?.model || "-",
            modelSize: item.details?.size || "-",
          }));

          // Fallback if no items array
          if (mappedItems.length === 0) {
            mappedItems.push({
              id: 1,
              name: apiData.job_name || "สินค้า",
              description: apiData.notes || "-",
              quantity: 1,
              currentStatus: apiData.order_status || "รอคำสั่งซื้อ",
              statusHistory: [],
              productType: apiData.product_category === "readymade" ? "readymade" : "madeToOrder"
            });
          }

          setOrder({
            id: apiData.job_id || String(apiData.order_id),
            customer: apiData.customer_name || "ไม่ระบุชื่อ",
            items: apiData.job_name || "ไม่ระบุรายการ",
            orderDate: (apiData.order_date || "").split(" ")[0],
            dueDate: apiData.delivery_date || apiData.usage_date || "-",
            status: broadStatus,
            value: parseFloat(apiData.total_amount) || 0,
            progress: 0,
            type: apiData.product_category || "internal",
            location: apiData.event_location || "domestic",
            department: apiData.responsible_person || "-",
            lineId: apiData.customer_line || "-",
            phone: apiData.customer_phone || "-",
            email: apiData.customer_email || "-",
            address: apiData.customer_address || apiData.delivery_address || "-",
            taxId: apiData.tax_id || "-",
            orderItems: mappedItems
          });
        }
      } catch (err) {
        console.error(err);
        toast.error("ดึงข้อมูลคำสั่งซื้อล้มเหลว");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetail();
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">กำลังโหลดรายละเอียดพื้นฐาน...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#F7F7F7] p-6">
        <div className="max-w-[1600px] mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">ไม่พบคำสั่งซื้อที่ต้องการ</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate('/sales/track-orders')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              กลับไปหน้ารายการ
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} ${config.textColor} border-0 flex items-center gap-1.5 px-3 py-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getItemStatusBadge = (status: string) => {
    const index = getStatusIndex(status);
    const total = productStatusList.length;
    const progress = total > 0 ? ((index + 1) / total) * 100 : 0;

    let bgColor = "bg-gray-100 text-gray-800";
    if (progress >= 90) bgColor = "bg-green-100 text-green-800";
    else if (progress >= 60) bgColor = "bg-blue-100 text-blue-800";
    else if (progress >= 30) bgColor = "bg-amber-100 text-amber-800";
    else bgColor = "bg-gray-100 text-gray-800";

    return (
      <Badge className={`${bgColor} font-medium`}>
        {status}
      </Badge>
    );
  };

  const slowestItem = getSlowestItem(order.orderItems);
  const statusCounts = getStatusCounts(order.orderItems);

  return (
    <>
      <div className="min-h-screen bg-[#F7F7F7] p-6">
        <div className="max-w-[1600px] mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/sales/track-orders')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                กลับ
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary" />
                  รายละเอียดคำสั่งซื้อ: {order.id}
                </h1>
                <p className="text-muted-foreground">ข้อมูลและสถานะการดำเนินงานของคำสั่งซื้อ</p>
              </div>
            </div>
            {getStatusBadge(order.status)}
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              ข้อมูลลูกค้า
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">ชื่อลูกค้า</p>
                <p className="font-medium">{order.customer}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เลขผู้เสียภาษี</p>
                <p className="font-medium">{order.taxId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
                <p className="font-medium">{order.phone}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">อีเมล</p>
                <p className="font-medium">{order.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Line ID</p>
                <p className="font-medium">{order.lineId}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ที่อยู่</p>
                <p className="font-medium">{order.address}</p>
              </div>
            </div>
          </div>

          {/* Order Info + Status Overview Combined */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">ข้อมูลคำสั่งซื้อ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">ชื่องาน</p>
                <p className="font-medium">{order.id}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">วันที่ใช้งาน</p>
                <p className="font-medium">{order.dueDate}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">ประเภทสินค้า / สินค้า</p>
                <p className="font-medium">
                  {(order.orderItems[0] as any)?.productType === "readymade"
                    ? `สินค้าสำเร็จรูป > ${order.orderItems[0]?.name || '-'}`
                    : `สินค้าสั่งผลิต > ${order.orderItems[0]?.name || '-'}`
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {(order.orderItems[0] as any)?.productType === "readymade" && order.orderItems[0]?.name?.includes("เหรียญสำเร็จรูป")
                    ? "รุ่นสินค้า"
                    : "วัสดุ"
                  }
                </p>
                <p className="font-medium">{(order.orderItems[0] as any)?.material || (order.orderItems[0] as any)?.productModel || 'ซิงค์อัลลอย'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">จำนวน</p>
                <p className="font-medium">{order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น</p>
              </div>
            </div>

            {/* Production Progress Bar */}
            <ProductionProgressBar currentStatus={order.orderItems[0]?.currentStatus || ""} />
          </div>

          {/* Product Details - Dynamic based on product type */}
          {(() => {
            const currentItem = order.orderItems[0] as any;
            const isReadymadeTrophy = currentItem?.productType === "readymade" && currentItem?.name?.includes("ถ้วยรางวัล");

            if (isReadymadeTrophy) {
              // Trophy size details for table display
              const trophySizes = [
                { size: "A", quantity: 30 },
                { size: "B", quantity: 30 },
                { size: "C", quantity: 30 },
              ];

              return (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold mb-4">รายละเอียดสินค้า</h2>

                  {/* Trophy Product Table */}
                  <div className="rounded-lg border overflow-hidden mb-6">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead className="text-center w-20">ลำดับ</TableHead>
                          <TableHead>รายการ</TableHead>
                          <TableHead>รายละเอียดงาน</TableHead>
                          <TableHead className="text-right w-32">จำนวน</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trophySizes.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-center font-medium">{index + 1}</TableCell>
                            <TableCell className="font-medium">ถ้วยรางวัลโลหะอิตาลี</TableCell>
                            <TableCell className="text-muted-foreground">ขนาด {item.size}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30">
                          <TableCell colSpan={3} className="font-semibold">รวมทั้งหมด</TableCell>
                          <TableCell className="text-right font-semibold">
                            {trophySizes.reduce((sum, item) => sum + item.quantity, 0)}
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {/* Additional Trophy Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground">รุ่นโมเดล</p>
                      <p className="font-medium">{currentItem.model}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ป้ายจารึก (เบอร์ และสี)</p>
                      <p className="font-medium">{currentItem.engraving?.number} - {currentItem.engraving?.color}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">โบว์ (เบอร์)</p>
                      <p className="font-medium">{currentItem.bow?.number}</p>
                    </div>
                  </div>
                </div>
              );
            }

            // Check if it's a readymade medal
            const isReadymadeMedal = currentItem?.productType === "readymade" && currentItem?.name?.includes("เหรียญสำเร็จรูป");

            if (isReadymadeMedal) {
              const colorQuantities = [
                { color: "ทอง", quantity: 100 },
                { color: "เงิน", quantity: 50 },
                { color: "ทองแดง", quantity: 70 },
              ];

              return (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-lg font-semibold mb-6">รายละเอียดสินค้า</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <div className="rounded-lg border overflow-hidden">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-muted/50">
                              <th className="text-left px-4 py-3 text-sm text-muted-foreground font-medium w-1/2">สี</th>
                              <th className="text-right px-4 py-3 text-sm text-muted-foreground font-medium w-1/2">จำนวน</th>
                            </tr>
                          </thead>
                          <tbody>
                            {colorQuantities.map((item, index) => (
                              <tr key={index} className="border-t">
                                <td className="px-4 py-3 font-medium">{item.color}</td>
                                <td className="px-4 py-3 text-right">{item.quantity.toLocaleString()}</td>
                              </tr>
                            ))}
                            <tr className="border-t bg-muted/30">
                              <td className="px-4 py-3 font-semibold">รวม</td>
                              <td className="px-4 py-3 text-right font-semibold">
                                {colorQuantities.reduce((sum, item) => sum + item.quantity, 0).toLocaleString()}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">สายคล้อง</p>
                      <p className="font-medium">สายชาติ</p>
                    </div>
                  </div>
                </div>
              );
            }

            // Default product details for other product types (made-to-order)
            return (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold mb-4">รายละเอียดสินค้า</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-muted-foreground">ขนาด</p>
                    <p className="font-medium">5 ซม.</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">ความหนา</p>
                    <p className="font-medium">5 มิล</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">สี (เลือกได้หลายรายการ)</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="px-3 py-1">shinny gold (สีทองเงา)</Badge>
                      <Badge variant="outline" className="px-3 py-1">shinny silver (สีเงินเงา)</Badge>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">รายละเอียดด้านหน้า (เลือกได้หลายรายการ)</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="px-3 py-1">พิมพ์โลโก้</Badge>
                      <Badge variant="outline" className="px-3 py-1">แกะสลักข้อความ</Badge>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-2">รายละเอียดด้านหลัง (เลือกได้หลายรายการ)</p>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="px-3 py-1">ลงน้ำยาป้องกันสนิม</Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">สายคล้อง</p>
                    <p className="font-medium">2 × 90 ซม</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">จำนวนลาย</p>
                    <p className="font-medium">3 ลาย</p>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Artwork Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold mb-4">ข้อมูล Artwork</h2>

            {/* Artwork Image */}
            <div className="mb-6">
              <p className="text-sm text-muted-foreground mb-3">รูป Artwork</p>
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex justify-center">
                  {/* <img
                    src={artworkSample}
                    alt="Artwork Preview"
                    className="max-w-full h-auto max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                  /> */}
                </div>
                {/* <p className="text-sm text-primary text-center mt-3 cursor-pointer hover:underline">
                  คลิกที่รูปเพื่อขยายเต็มจอ
                </p> */}
              </div>
            </div>

            {/* Design Files */}
            <div>
              <p className="text-sm text-muted-foreground mb-3">ไฟล์งานออกแบบ</p>
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-orange-600" />
                  </div> */}
                  <div>
                    {/* <p className="font-medium">artwork_final_v3.ai</p>
                    <p className="text-sm text-muted-foreground">18/1/2567 14:32:15 • สมชาย กราฟิก</p> */}
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowUploadHistory(true)}>
                  <History className="w-4 h-4 mr-2" />
                  ประวัติการอัพโหลด
                </Button>
              </div>
            </div>
          </div>

          {/* Upload History Dialog */}
          <Dialog open={showUploadHistory} onOpenChange={setShowUploadHistory}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>ประวัติการอัพโหลดไฟล์</DialogTitle>
              </DialogHeader>
              {/* <div className="space-y-3">
                <div className="border rounded-lg p-3 bg-primary/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">artwork_final_v3.ai</p>
                      <p className="text-xs text-muted-foreground">18/1/2567 14:32:15 • สมชาย กราฟิก</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">ล่าสุด</Badge>
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">artwork_final_v2.ai</p>
                      <p className="text-xs text-muted-foreground">17/1/2567 10:15:30 • สมชาย กราฟิก</p>
                    </div>
                  </div>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                      <FileText className="w-4 h-4 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">artwork_draft_v1.ai</p>
                      <p className="text-xs text-muted-foreground">15/1/2567 16:45:00 • สมชาย กราฟิก</p>
                    </div>
                  </div>
                </div>
              </div> */}
            </DialogContent>
          </Dialog>

          {/* สถานะการผลิต - Dynamic based on order status */}
          {/* Hidden for JOB-2024-001 as it uses QCVerificationCards */}
          {/* ============================== */}
          {order.id !== "JOB-2024-001" && (() => {
            const currentItem = order.orderItems[0] as any;
            const isReadymadeTrophy = currentItem?.productType === "readymade" && currentItem?.name?.includes("ถ้วยรางวัล");
            const isReadymadeMedal = currentItem?.productType === "readymade" && currentItem?.name?.includes("เหรียญสำเร็จรูป");

            // Define production steps based on product type
            const productionSteps = isReadymadeTrophy ? [
              { key: "จัดหา", label: "จัดหา" },
              { key: "ประกอบสินค้า", label: "ประกอบสินค้า" },
              { key: "ผูกโบว์", label: "ผูกโบว์" },
              { key: "ติดป้ายจารึก", label: "ติดป้ายจารึก" },
              { key: "สินค้าประกอบเสร็จ", label: "สินค้าประกอบเสร็จ" },
            ] : isReadymadeMedal ? [
              { key: "จัดหาสินค้า", label: "จัดหาสินค้า" },
              { key: "ติดสติ๊กเกอร์", label: "ติดสติ๊กเกอร์" },
              { key: "คล้องสาย", label: "คล้องสาย" },
              { key: "สินค้าพร้อมส่ง", label: "สินค้าพร้อมส่ง" },
            ] : [
              { key: "ตรวจสอบ Artwork จากโรงงาน", label: "ตรวจสอบ Artwork จากโรงงาน" },
              { key: "ตรวจสอบ CNC", label: "ตรวจสอบ งาน CNC", requiresMultiApproval: true },
              { key: "อัปเดทปั้มชิ้นงาน", label: "ตรวจสอบ ปั้มชิ้นงาน" },
              { key: "อัปเดตสาย", label: "ตรวจสอบ สายคล้อง" },
              { key: "อัปเดตชิ้นงานก่อนจัดส่ง", label: "ตรวจสอบ ชิ้นงานก่อนจัดส่ง" },
              { key: "งานเสร็จสมบูรณ์", label: "ผลิตเสร็จจากโรงงาน" },
            ];

            // Mock data for multi-department approvals (ตรวจสอบ CNC requires both เซลล์ and จัดซื้อ)
            const multiApprovalData: Record<string, { department: string; approved: boolean; approvedBy?: string; approvedAt?: string }[]> = {
              "ตรวจสอบ CNC": [
                { department: "จัดซื้อ", approved: true, approvedBy: "วิชัย", approvedAt: "2025-01-05 14:30" },
                { department: "เซลล์", approved: false },
              ]
            };

            // Get current item's status
            const currentStatus = currentItem?.currentStatus || "";

            // Find which step we're at
            const currentStepIndex = productionSteps.findIndex(s => s.key === currentStatus);
            const completedSteps = currentStepIndex >= 0 ? currentStepIndex + 1 : 0;
            const totalSteps = productionSteps.length;
            const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
            const isCompleted = progressPercent === 100;

            // Check if production has started
            const statusHistory = currentItem?.statusHistory || [];
            const hasStartedProduction = statusHistory.some((h: any) =>
              productionSteps.some(s => s.key === h.status)
            );

            // Always show production status section (removed condition that hid it)

            return (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 ${isCompleted ? 'bg-green-100' : 'bg-amber-100'} rounded-lg flex items-center justify-center`}>
                    <Factory className={`w-4 h-4 ${isCompleted ? 'text-green-600' : 'text-amber-600'}`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">สถานะการผลิต</h2>
                    <p className="text-xs text-muted-foreground">การผลิตจากโรงงาน</p>
                  </div>
                  <Badge className={isCompleted ? "bg-green-500 text-white" : "bg-amber-500 text-white"}>
                    {isCompleted ? "เสร็จสิ้น" : "กำลังผลิต"}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div
                        className={`${isCompleted ? 'bg-green-500' : 'bg-amber-500'} h-1.5 rounded-full transition-all duration-300`}
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className={`text-sm font-medium ${isCompleted ? 'text-green-600' : 'text-amber-600'}`}>
                    {progressPercent}%
                  </span>
                </div>

                {/* Production Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-3 border-y mb-3">
                  <div>
                    <p className="text-xs text-muted-foreground">วันที่สั่งผลิต</p>
                    <p className="text-sm font-medium">{order.orderDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">กำหนดเสร็จ</p>
                    <p className="text-sm font-medium">{order.dueDate}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">โรงงาน</p>
                    <p className="text-sm font-medium">
                      {statusHistory.find(h => h.department === "โรงงาน")?.updatedBy || "โรงงาน A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">เลข PO</p>
                    <p className="text-sm font-medium">PO-2567-{order.id.split('-')[2]}</p>
                  </div>
                </div>

                {/* Production Steps - Accordion */}
                <Accordion type="single" collapsible defaultValue="completed">
                  <AccordionItem value="completed" className="border rounded-lg">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        {isCompleted ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-amber-500" />
                        )}
                        <span className="text-sm font-medium">ขั้นตอนทั้งหมด</span>
                        <Badge
                          variant="secondary"
                          className={`text-xs h-5 ${isCompleted ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}
                        >
                          {completedSteps}/{totalSteps}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-2">
                      <div className="space-y-2">
                        {productionSteps.map((step, idx) => {
                          const stepHistory = statusHistory.find(h => h.status === step.key);
                          const isStepCompleted = stepHistory !== undefined;
                          const isCurrentStep = step.key === currentStatus;
                          const isFinalStep = idx === productionSteps.length - 1;
                          const hasMultiApproval = (step as any).requiresMultiApproval;
                          const approvalList = multiApprovalData[step.key] || [];

                          return (
                            <div
                              key={step.key}
                              className={`py-1.5 ${idx > 0 ? 'border-t' : ''}`}
                            >
                              <div className="flex items-center gap-3">
                                {isStepCompleted ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                ) : isCurrentStep ? (
                                  <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                ) : (
                                  <Circle className="w-4 h-4 text-gray-300 flex-shrink-0" />
                                )}

                                {!isFinalStep && (
                                  <div
                                    className={`w-10 h-10 ${isStepCompleted || isCurrentStep ? 'bg-muted' : 'bg-gray-100'} rounded overflow-hidden flex-shrink-0 ${isStepCompleted ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                                    onClick={() => isStepCompleted && setEnlargedImage(artworkSample)}
                                  >
                                    {(isStepCompleted || isCurrentStep) && (
                                      <img src={artworkSample} alt={step.label} className="w-full h-full object-cover" />
                                    )}
                                  </div>
                                )}

                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium ${!isStepCompleted && !isCurrentStep ? 'text-gray-400' : ''}`}>
                                    {step.label}
                                  </p>
                                  {stepHistory ? (
                                    <p className="text-xs text-muted-foreground">
                                      {stepHistory.updatedAt} • {stepHistory.updatedBy}
                                    </p>
                                  ) : isCurrentStep ? (
                                    <p className="text-xs text-amber-600">รอตรวจสอบ</p>
                                  ) : (
                                    <p className="text-xs text-gray-400">รอดำเนินการ</p>
                                  )}
                                </div>
                                {isStepCompleted ? (
                                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs h-5">
                                    {isFinalStep ? 'เสร็จสิ้น' : 'ผ่าน'}
                                  </Badge>
                                ) : isCurrentStep ? (
                                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs h-5">
                                    รอตรวจสอบ
                                  </Badge>
                                ) : (
                                  <Badge className="bg-gray-100 text-gray-400 hover:bg-gray-100 text-xs h-5">
                                    รอดำเนินการ
                                  </Badge>
                                )}
                              </div>

                              {/* Multi-department approval section */}
                              {isCurrentStep && hasMultiApproval && approvalList.length > 0 && (
                                <div className="ml-14 mt-2 space-y-2">
                                  {approvalList.map((approval, aIdx) => (
                                    <div
                                      key={aIdx}
                                      className={`flex items-center gap-3 p-2 rounded-lg ${approval.approved ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}
                                    >
                                      {approval.approved ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                      )}

                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium">
                                          แผนก{approval.department}
                                        </p>
                                        {approval.approved ? (
                                          <p className="text-xs text-green-600">
                                            {approval.approvedAt} • {approval.approvedBy}
                                          </p>
                                        ) : (
                                          <p className="text-xs text-amber-600">รอตรวจสอบ</p>
                                        )}
                                      </div>

                                      {approval.approved ? (
                                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 text-xs h-5">
                                          ผ่าน
                                        </Badge>
                                      ) : (
                                        <div className="flex items-center gap-2">
                                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-green-600 border-green-300 hover:bg-green-50">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            ผ่าน
                                          </Button>
                                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs text-red-600 border-red-300 hover:bg-red-50">
                                            <XCircle className="w-3 h-3 mr-1" />
                                            ไม่ผ่าน
                                          </Button>
                                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-xs h-5">
                                            รอตรวจสอบ
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            );
          })()}

          {/* ============================== */}
          {/* ข้อมูลออเดอร์และการจัดส่ง (Read-Only) - for JOB-2024-001 */}
          {/* ============================== */}
          {order.id === "JOB-2024-001" && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold mb-4">ข้อมูลออเดอร์และการจัดส่ง (จากแผนกจัดซื้อ)</h2>
              <ProductionOrderInfoReadOnly
                data={{
                  orderer: "สมชาย สุขใจ",
                  poNumber: "PO-2567-001",
                  shipDate: "2025-01-15",
                  splitQuantity: "3 ล็อต",
                  totalSales: 150000,
                  vat: 7,
                  shippingChannel: "SEA",
                  shippingCostRMB: 2500,
                  exchangeRate: 5.5,
                  shippingCostTHB: 13750
                }}
              />
            </div>
          )}

          {/* ============================== */}
          {/* QC Verification Cards - for JOB-2024-001 */}
          {/* ============================== */}
          {order.id === "JOB-2024-001" && (
            <QCVerificationCards orderId={order.id} userRole="เซลล์" />
          )}

          {/* ============================== */}
          {/* สถานะการขนส่งระหว่างประเทศ - เสร็จสิ้น (hide for readymade products) */}
          {/* แสดงก่อน Logistics & Delivery Cards */}
          {/* ============================== */}
          {(() => {
            const currentItem = order.orderItems[0] as any;
            const isReadymadeTrophy = currentItem?.productType === "readymade" && currentItem?.name?.includes("ถ้วยรางวัล");
            const isReadymadeMedal = currentItem?.productType === "readymade" && currentItem?.name?.includes("เหรียญสำเร็จรูป");

            // Don't show international shipping for readymade products (trophy & medal)
            if (isReadymadeTrophy || isReadymadeMedal) {
              return null;
            }

            return (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <Globe className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">สถานะการขนส่งระหว่างประเทศ</h2>
                    <p className="text-xs text-muted-foreground">การขนส่งจากโรงงานต่างประเทศ</p>
                  </div>
                  <Badge className="bg-amber-500 text-white">รอดำเนินการ</Badge>
                </div>

                {/* Progress bar - 0% */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">0%</span>
                </div>

                {/* Timeline - Accordion */}
                <Accordion type="single" collapsible defaultValue="shipping">
                  <AccordionItem value="shipping" className="border rounded-lg">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium">ขั้นตอนทั้งหมด</span>
                        <Badge variant="secondary" className="text-xs h-5 bg-amber-100 text-amber-700">0/3</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-2">
                      <div className="space-y-2">
                        {/* Step 1 - ส่งออกจากโรงงาน */}
                        <div className="flex items-center gap-3 py-1.5">
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Factory className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">ส่งออกจากโรงงาน</p>
                            <p className="text-xs text-muted-foreground">-</p>
                          </div>
                          <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-xs h-5">ยังไม่เริ่ม</Badge>
                        </div>

                        {/* Step 2 - อยู่ระหว่างขนส่ง */}
                        <div className="flex items-center gap-3 py-1.5 border-t">
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <Ship className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">อยู่ระหว่างขนส่ง</p>
                            <p className="text-xs text-muted-foreground">-</p>
                          </div>
                          <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-xs h-5">ยังไม่เริ่ม</Badge>
                        </div>

                        {/* Step 3 - ถึงประเทศไทย */}
                        <div className="flex items-center gap-3 py-1.5 border-t">
                          <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <MapPin className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">ถึงประเทศไทย</p>
                            <p className="text-xs text-muted-foreground">-</p>
                          </div>
                          <Badge className="bg-gray-100 text-gray-500 hover:bg-gray-100 text-xs h-5">ยังไม่เริ่ม</Badge>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            );
          })()}

          {/* ============================== */}
          {/* Logistics & Delivery Cards - for JOB-2024-001 (หลัง International Shipping) */}
          {/* ============================== */}
          {/* Logistics & Delivery Cards - shown when ready to ship or shipped */}
          {(order.status === "shipped" || order.status === "ready_to_ship") && (
            <LogisticsDeliveryCards orderId={order.id} userRole="เซลล์" />
          )}

          {/* ============================== */}
          {/* สถานะคลังสินค้า & QC - Shown for non-shipped orders or after production */}
          {/* ============================== */}
          {order.status !== "pending_approval" && (() => {
            const currentItem = order.orderItems[0] as any;
            const isReadymadeMedal = currentItem?.productType === "readymade" && currentItem?.name?.includes("เหรียญสำเร็จรูป");
            const isReadymadeTrophy = currentItem?.productType === "readymade" && currentItem?.name?.includes("ถ้วยรางวัล");
            const isReadymadeProduct = isReadymadeMedal || isReadymadeTrophy;

            // Warehouse steps - simplified for ready-made products (no โกดัง steps)
            const warehouseSteps = isReadymadeProduct ? [
              { key: "qc", label: "ตรวจนับ & QC ที่ร้าน", icon: "clipboard", detail: `${order.dueDate} 14:00 • QC: วิภา`, subDetail: isReadymadeMedal ? `ผ่าน QC ครบ ${order.orderItems[0].quantity} ชิ้น` : `ผ่าน QC ครบ ${order.orderItems[0].quantity} ชิ้น`, badge: "ผ่าน QC" },
              { key: "ready", label: "พร้อมจัดส่งให้ลูกค้า", icon: "send", detail: `${order.dueDate} 09:00 • เตรียมแพ็คสินค้า`, badge: "Ready" },
              { key: "delivered", label: "จัดส่งสำเร็จ", icon: "thumbsup", detail: `${order.dueDate} 10:30 • ลูกค้ารับสินค้าเรียบร้อย`, subDetail: `ผู้รับ: ${order.customer}`, badge: "สำเร็จ", isClickable: true },
            ] : [
              { key: "warehouse", label: "รับเข้าโกดังไทย", icon: "warehouse", detail: `${order.dueDate} 10:00 • คลังสินค้า`, subDetail: `จำนวนรับจริง: ${order.orderItems[0].quantity} ชิ้น`, badge: "เสร็จสิ้น" },
              { key: "transfer", label: "ส่งจากโกดัง → ร้าน", icon: "truck", detail: `${order.dueDate} 08:30 • พนักงานคลัง: สมศักดิ์`, badge: "เสร็จสิ้น" },
              { key: "qc", label: "ตรวจนับ & QC ที่ร้าน", icon: "clipboard", detail: `${order.dueDate} 14:00 • QC: วิภา`, subDetail: `ผ่าน QC ครบ ${order.orderItems[0].quantity} ชิ้น`, badge: "ผ่าน QC" },
              { key: "ready", label: "พร้อมจัดส่งให้ลูกค้า", icon: "send", detail: `${order.dueDate} 09:00 • เตรียมแพ็คสินค้า`, badge: "Ready" },
              { key: "delivered", label: "จัดส่งสำเร็จ", icon: "thumbsup", detail: `${order.dueDate} 10:30 • ลูกค้ารับสินค้าเรียบร้อย`, subDetail: `ผู้รับ: ${order.customer}`, badge: "สำเร็จ", isClickable: true },
            ];

            const totalSteps = warehouseSteps.length;

            const getStepIcon = (iconName: string, className: string) => {
              switch (iconName) {
                case "warehouse": return <Warehouse className={className} />;
                case "truck": return <Truck className={className} />;
                case "clipboard": return <ClipboardCheck className={className} />;
                case "send": return <Send className={className} />;
                case "thumbsup": return <ThumbsUp className={className} />;
                default: return <Warehouse className={className} />;
              }
            };

            return (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                    <Warehouse className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold">สถานะคลังสินค้า & การตรวจสอบคุณภาพ (QC)</h2>
                    <p className="text-xs text-muted-foreground">การจัดการสินค้าภายในประเทศ</p>
                  </div>
                  <Badge className="bg-green-500 text-white">จัดส่งสำเร็จ</Badge>
                </div>

                {/* Progress bar - 0% */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="bg-amber-500 h-1.5 rounded-full transition-all duration-300" style={{ width: '0%' }}></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-muted-foreground">0%</span>
                </div>

                {/* Timeline - Accordion */}
                <Accordion type="single" collapsible defaultValue="warehouse">
                  <AccordionItem value="warehouse" className="border rounded-lg">
                    <AccordionTrigger className="px-3 py-2 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">ขั้นตอนทั้งหมด</span>
                        <Badge variant="secondary" className="text-xs h-5 bg-green-100 text-green-700">{totalSteps}/{totalSteps}</Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-2">
                      <div className="space-y-2">
                        {warehouseSteps.map((step, idx) => {
                          const isLast = idx === warehouseSteps.length - 1;
                          const isClickable = (step as any).isClickable;

                          return (
                            <div
                              key={step.key}
                              className={`flex items-center gap-3 py-1.5 ${idx > 0 ? 'border-t' : ''} ${isLast ? 'bg-green-50 -mx-3 px-3 rounded-b-lg' : ''} ${isClickable ? 'cursor-pointer hover:bg-green-100 transition-colors' : ''}`}
                              onClick={() => isClickable && setShowDeliveryDetail(true)}
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                              {getStepIcon(step.icon, isLast ? "w-4 h-4 text-green-600 flex-shrink-0" : "w-4 h-4 text-muted-foreground flex-shrink-0")}
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium ${isLast ? 'text-green-700 underline underline-offset-2' : ''}`}>{step.label}</p>
                                <p className={`text-xs ${isLast ? 'text-green-600' : 'text-muted-foreground'}`}>{step.detail}</p>
                                {step.subDetail && (
                                  <p className={`text-xs ${step.key === 'qc' ? 'text-green-600' : 'text-muted-foreground'}`}>{step.subDetail}</p>
                                )}
                              </div>
                              <Badge className={`${isLast ? 'bg-green-500 text-white hover:bg-green-500' : 'bg-green-100 text-green-700 hover:bg-green-100'} text-xs h-5`}>
                                {step.badge}
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Summary Card */}
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-700">คำสั่งซื้อสำเร็จ</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">วันที่สั่งซื้อ</p>
                      <p className="font-medium">{order.orderDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">วันที่จัดลงคลัง/สำเร็จ</p>
                      <p className="font-medium text-green-600">{order.dueDate}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ระยะเวลาทั้งหมด</p>
                      <p className="font-medium">-</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">จำนวนสินค้า</p>
                      <p className="font-medium">{order.orderItems.reduce((sum, item) => sum + item.quantity, 0)} ชิ้น</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* Image Lightbox Dialog */}
      <Dialog open={!!enlargedImage} onOpenChange={() => setEnlargedImage(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>ขยายรูปภาพ</DialogTitle>
          </DialogHeader>
          {enlargedImage && (
            <img
              src={enlargedImage}
              alt="รูปภาพขยาย"
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delivery Detail Dialog */}
      <Dialog open={showDeliveryDetail} onOpenChange={setShowDeliveryDetail}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" />
              รายละเอียดการจัดส่ง
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Carrier Name */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <Package className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">ชื่อขนส่ง</p>
                <p className="font-medium">{deliveryDetails.carrierName}</p>
              </div>
            </div>

            {/* Tracking Number */}
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <FileText className="w-5 h-5 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">เลขที่พัสดุ</p>
                <p className="font-medium font-mono">{deliveryDetails.trackingNumber}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(deliveryDetails.trackingNumber)}
              >
                คัดลอก
              </Button>
            </div>

            {/* Delivery Link */}
            {deliveryDetails.deliveryLink && (
              <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <Globe className="w-5 h-5 text-primary mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">ลิงก์ติดตามพัสดุ</p>
                  <a
                    href={deliveryDetails.deliveryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline break-all"
                  >
                    {deliveryDetails.deliveryLink}
                  </a>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(deliveryDetails.deliveryLink, '_blank')}
                >
                  เปิด
                </Button>
              </div>
            )}

            {/* Vehicle Pickup Info (if applicable) */}
            {deliveryDetails.vehiclePickup && deliveryDetails.vehicleInfo && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Car className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">เรียกรถเข้ามารับ</span>
                </div>
                <div className="space-y-1 text-sm">
                  {deliveryDetails.vehicleInfo.driverName && (
                    <p><span className="text-muted-foreground">คนขับ:</span> {deliveryDetails.vehicleInfo.driverName}</p>
                  )}
                  {deliveryDetails.vehicleInfo.vehiclePlate && (
                    <p><span className="text-muted-foreground">ทะเบียนรถ:</span> {deliveryDetails.vehicleInfo.vehiclePlate}</p>
                  )}
                  {deliveryDetails.vehicleInfo.contactPhone && (
                    <p><span className="text-muted-foreground">เบอร์ติดต่อ:</span> {deliveryDetails.vehicleInfo.contactPhone}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog >
    </>
  );
}
