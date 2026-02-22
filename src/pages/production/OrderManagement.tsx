import { useState, useMemo } from "react";
import sampleArtwork from "@/assets/sample-artwork.png";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ClipboardList, Truck, Package, CheckCircle, Clock, Search, AlertCircle, Filter, X, Ribbon, Check } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductionWorkspace } from "@/components/production/ProductionWorkspace";

// Mock data for production orders - using JOB-YYYY-XXX format
const mockOrders = [
  {
    id: "JOB-2024-001",
    orderDate: "2024-01-15",
    lineName: "customer_line_1",
    customerName: "บริษัท ABC จำกัด",
    product: "เหรียญสั่งผลิต",
    deliveryDate: "2024-01-25",
    status: "รอผลิต",
    statusOrder: 1,
    quotation: "Q-2024-001",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "นภา สวยงาม",
    assignedEmployee: "วิชัย ผลิตดี",
    jobType: "งานสั่งผลิต",
    quantity: 500,
    isAccepted: false,
    phone: "02-123-4567",
    address: "123/45 ถนนสุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110",
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "มารับเอง",
    hasEngravingTag: true,
    hasRibbon: true,
    trackingNumber: "",
    productDetails: [
      { name: "สินค้า A", model: "รุ่นมาตรฐาน", color: "ทอง", orderedQty: 500, countedQty: 0 },
    ],
    paymentInfo: {
      status: "full" as const,
      amount: 25000,
      proof: "#",
      bank: "กสิกรไทย",
      receivedDate: "2024-01-15",
      netTotal: 25000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "มารับเอง",
      shippingFee: 0,
      usageDate: "2024-01-28",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "นภา สวยงาม",
      status: "กำลังผลิต",
      statusDate: "2024-01-16 09:30",
    },
    ribbonInfo: {
      accepted: true,
      color: "#FF0000",
      number: "เบอร์ 5",
    },
  },
  {
    id: "JOB-2024-002",
    orderDate: "2024-01-16",
    lineName: "customer_line_2",
    customerName: "ห้างหุ้นส่วน XYZ",
    product: "เหรียญสั่งผลิต",
    deliveryDate: "2024-01-28",
    status: "กำลังผลิต",
    statusOrder: 2,
    quotation: "Q-2024-002",
    responsiblePerson: "วิชัย ขยัน",
    graphicDesigner: "สมหญิง รักงาน",
    assignedEmployee: "มานะ ทำงาน",
    jobType: "งานสั่งผลิต",
    quantity: 1250,
    isAccepted: true,
    phone: "02-234-5678",
    address: "456 ถนนพระราม 4 แขวงสุริยวงศ์ เขตบางรัก กรุงเทพฯ 10500",
    hasIssue: true,
    issueDetail: "สินค้ามีรอยขีดข่วน ต้องผลิตใหม่",
    paymentStatus: "มัดจำ",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: true,
    hasRibbon: false,
    trackingNumber: "",
    productDetails: [
      { name: "สินค้า A", model: "รุ่นมาตรฐาน", color: "ทอง", orderedQty: 500, countedQty: 495 },
      { name: "สินค้า B", model: "รุ่นพิเศษ", color: "เงิน", orderedQty: 750, countedQty: 750 },
    ],
    paymentInfo: {
      status: "deposit" as const,
      amount: 15000,
      proof: "#",
      bank: "ไทยพาณิชย์",
      receivedDate: "2024-01-16",
      netTotal: 45000,
    },
    shippingInfo: {
      province: "เชียงใหม่",
      channel: "จัดส่ง",
      shippingFee: 350,
      usageDate: "2024-01-30",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "สมหญิง รักงาน",
      status: "รอแก้ไข",
      statusDate: "2024-01-17 14:00",
    },
    ribbonInfo: {
      accepted: false,
    },
  },
  {
    id: "JOB-2024-003",
    orderDate: "2024-01-10",
    lineName: "customer_line_3",
    customerName: "ร้านของขวัญ DEF",
    product: "เหรียญสำเร็จรูป",
    deliveryDate: "2024-01-20",
    status: "พร้อมจัดส่ง",
    statusOrder: 3,
    quotation: "Q-2024-003",
    responsiblePerson: "มานะ ทำงาน",
    graphicDesigner: "ประดิษฐ์ สร้างสรรค์",
    assignedEmployee: "สุชาติ ดีงาม",
    jobType: "งานสำเร็จรูป",
    quantity: 150,
    isAccepted: true,
    phone: "081-234-5678",
    address: "789 ถนนสีลม แขวงสีลม เขตบางรัก กรุงเทพฯ 10500",
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: false,
    hasRibbon: true,
    trackingNumber: "TH123456789",
    productDetails: [],
    paymentInfo: {
      status: "full" as const,
      amount: 8500,
      proof: "#",
      bank: "กรุงเทพ",
      receivedDate: "2024-01-10",
      netTotal: 8500,
    },
    shippingInfo: {
      province: "ภูเก็ต",
      channel: "Flash Express",
      shippingFee: 150,
      usageDate: "2024-01-22",
    },
    engravingInfo: {
      accepted: false,
    },
    ribbonInfo: {
      accepted: true,
      color: "#0000FF",
      number: "เบอร์ 3",
    },
  },
  {
    id: "JOB-2024-004",
    orderDate: "2024-01-05",
    lineName: "customer_line_4",
    customerName: "องค์กร GHI",
    product: "โล่สั่งผลิต",
    deliveryDate: "2024-01-15",
    status: "รอผลิต",
    statusOrder: 1,
    quotation: "Q-2024-004",
    responsiblePerson: "สุชาติ ดีงาม",
    graphicDesigner: "วิภา ศิลป์",
    assignedEmployee: "วิชัย ผลิตดี",
    jobType: "งานสั่งผลิต",
    quantity: 2000,
    isAccepted: true,
    phone: "089-876-5432",
    address: "321 ถนนเพชรบุรี แขวงทุ่งพญาไท เขตราชเทวี กรุงเทพฯ 10400",
    hasIssue: false,
    paymentStatus: "มัดจำ",
    deliveryChannel: "มารับเอง",
    hasEngravingTag: true,
    hasRibbon: true,
    trackingNumber: "",
    productDetails: [
      { name: "สินค้า A", model: "รุ่นมาตรฐาน", color: "ทอง", orderedQty: 500, countedQty: 500 },
      { name: "สินค้า B", model: "รุ่นพิเศษ", color: "เงิน", orderedQty: 750, countedQty: 748 },
      { name: "สินค้า C", model: "รุ่นพรีเมียม", color: "ทองแดง", orderedQty: 750, countedQty: 750 },
    ],
    paymentInfo: {
      status: "deposit" as const,
      amount: 50000,
      proof: "#",
      bank: "กสิกรไทย",
      receivedDate: "2024-01-05",
      netTotal: 120000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "มารับเอง",
      shippingFee: 0,
      usageDate: "2024-01-20",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "วิภา ศิลป์",
      status: "เสร็จสิ้น",
      statusDate: "2024-01-08 16:45",
    },
    ribbonInfo: {
      accepted: true,
      color: "#FFD700",
      number: "เบอร์ 7",
    },
  },
  {
    id: "JOB-2024-005",
    orderDate: "2024-01-18",
    lineName: "customer_line_5",
    customerName: "บริษัท สยามทอง จำกัด",
    product: "ถ้วยรางวัล",
    deliveryDate: "2024-01-30",
    status: "รอผลิต",
    statusOrder: 1,
    quotation: "Q-2024-005",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "นภา สวยงาม",
    assignedEmployee: "มานะ ทำงาน",
    jobType: "งานสำเร็จรูป",
    quantity: 50,
    isAccepted: false,
    phone: "02-567-8901",
    address: "555 ถนนลาดพร้าว แขวงจอมพล เขตจตุจักร กรุงเทพฯ 10900",
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: false,
    hasRibbon: false,
    trackingNumber: "",
    productDetails: [],
    paymentInfo: {
      status: "full" as const,
      amount: 15000,
      proof: "#",
      bank: "ไทยพาณิชย์",
      receivedDate: "2024-01-18",
      netTotal: 15000,
    },
    shippingInfo: {
      province: "ขอนแก่น",
      channel: "Kerry Express",
      shippingFee: 200,
      usageDate: "2024-02-01",
    },
    engravingInfo: {
      accepted: false,
    },
    ribbonInfo: {
      accepted: false,
    },
  },
  {
    id: "JOB-2024-006",
    orderDate: "2024-01-20",
    lineName: "customer_line_6",
    customerName: "โรงเรียนมัธยมศึกษา ABC",
    product: "เสื้อ",
    deliveryDate: "2024-02-05",
    status: "กำลังผลิต",
    statusOrder: 2,
    quotation: "Q-2024-006",
    responsiblePerson: "วิชัย ขยัน",
    graphicDesigner: "สมหญิง รักงาน",
    assignedEmployee: "มานะ ทำงาน",
    jobType: "งานสิ่งทอ",
    quantity: 200,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "มัดจำ",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: false,
    hasRibbon: false,
    trackingNumber: "",
    productDetails: [],
    paymentInfo: {
      status: "deposit" as const,
      amount: 10000,
      proof: "#",
      bank: "กรุงเทพ",
      receivedDate: "2024-01-20",
      netTotal: 35000,
    },
    shippingInfo: {
      province: "นครราชสีมา",
      channel: "J&T Express",
      shippingFee: 250,
      usageDate: "2024-02-08",
    },
    engravingInfo: {
      accepted: false,
    },
    ribbonInfo: {
      accepted: false,
    },
  },
  {
    id: "JOB-2024-007",
    orderDate: "2024-01-22",
    lineName: "customer_line_7",
    customerName: "สมาคมกีฬา XYZ",
    product: "เหรียญรางวัล",
    deliveryDate: "2024-02-10",
    status: "กำลังผลิต",
    statusOrder: 2,
    quotation: "Q-2024-007",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "นภา สวยงาม",
    assignedEmployee: "สุชาติ ดีงาม",
    jobType: "งานสั่งผลิต",
    quantity: 300,
    isAccepted: true,
    hasIssue: true,
    issueDetail: "ป้ายจารึกพิมพ์ผิด",
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "มารับเอง",
    hasEngravingTag: true,
    hasRibbon: true,
    trackingNumber: "",
    productDetails: [],
    paymentInfo: {
      status: "full" as const,
      amount: 18000,
      proof: "#",
      bank: "กสิกรไทย",
      receivedDate: "2024-01-22",
      netTotal: 18000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "มารับเอง",
      shippingFee: 0,
      usageDate: "2024-02-12",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "นภา สวยงาม",
      status: "รอแก้ไข",
      statusDate: "2024-01-23 10:15",
    },
    ribbonInfo: {
      accepted: true,
      color: "#008000",
      number: "เบอร์ 4",
    },
  },
  {
    id: "JOB-2024-008",
    orderDate: "2024-01-08",
    lineName: "customer_line_8",
    customerName: "สมาคมนักธุรกิจไทย-อิตาลี",
    product: "ถ้วยรางวัลโลหะอิตาลี",
    deliveryDate: "2024-01-20",
    status: "จัดส่งแล้ว",
    statusOrder: 4,
    quotation: "Q-2024-008",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "นภา สวยงาม",
    assignedEmployee: "วิชัย ผลิตดี",
    jobType: "งานสำเร็จรูป",
    quantity: 25,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: true,
    hasRibbon: false,
    trackingNumber: "TH987654321",
    productDetails: [
      { name: "ถ้วยทอง Size A", model: "Size A (12 นิ้ว)", color: "ทอง", orderedQty: 5, countedQty: 5 },
      { name: "ถ้วยทอง Size B", model: "Size B (10 นิ้ว)", color: "ทอง", orderedQty: 10, countedQty: 10 },
      { name: "ถ้วยทอง Size C", model: "Size C (8 นิ้ว)", color: "ทอง", orderedQty: 10, countedQty: 10 },
    ],
    paymentInfo: {
      status: "full" as const,
      amount: 45000,
      proof: "#",
      bank: "ไทยพาณิชย์",
      receivedDate: "2024-01-08",
      netTotal: 45000,
    },
    shippingInfo: {
      province: "สมุทรปราการ",
      channel: "Flash Express",
      shippingFee: 180,
      usageDate: "2024-01-22",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "นภา สวยงาม",
      status: "เสร็จสิ้น",
      statusDate: "2024-01-12 14:30",
    },
    ribbonInfo: {
      accepted: false,
    },
  },
  {
    id: "JOB-2024-009",
    orderDate: "2024-01-05",
    lineName: "customer_line_9",
    customerName: "บริษัท สยามสปอร์ต จำกัด",
    product: "เหรียญรางวัลวิ่งมาราธอน",
    deliveryDate: "2024-01-20",
    status: "จัดส่งแล้ว",
    statusOrder: 4,
    quotation: "Q-2024-009",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "สมหญิง รักงาน",
    assignedEmployee: "มานะ ทำงาน",
    jobType: "งานสั่งทำ",
    quantity: 200,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: true,
    hasRibbon: true,
    trackingNumber: "TH999888777",
    productDetails: [
      { name: "เหรียญทอง", model: "ขนาด 5 ซม.", color: "ทอง", orderedQty: 50, countedQty: 50 },
      { name: "เหรียญเงิน", model: "ขนาด 5 ซม.", color: "เงิน", orderedQty: 75, countedQty: 75 },
      { name: "เหรียญทองแดง", model: "ขนาด 5 ซม.", color: "ทองแดง", orderedQty: 75, countedQty: 75 },
    ],
    paymentInfo: {
      status: "full" as const,
      amount: 85000,
      proof: "#",
      bank: "กรุงเทพ",
      receivedDate: "2024-01-05",
      netTotal: 85000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "Kerry Express",
      shippingFee: 250,
      usageDate: "2024-01-22",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "สมหญิง รักงาน",
      status: "เสร็จสิ้น",
      statusDate: "2024-01-10 09:00",
    },
    ribbonInfo: {
      accepted: true,
      color: "#FFD700",
      number: "เบอร์ 5",
    },
    // Production workflow - all steps completed
    productionWorkflow: {
      procurement: { status: "complete", remark: "รับวัตถุดิบครบ", updatedAt: "2024-01-06 10:00", updatedBy: "สมศักดิ์ จัดซื้อ" },
      assembly: { status: "complete", remark: "ประกอบเสร็จเรียบร้อย", updatedAt: "2024-01-08 14:00", updatedBy: "มานะ ทำงาน" },
      ribbon: { status: "complete", remark: "ผูกโบว์ครบทุกชิ้น", updatedAt: "2024-01-09 11:00", updatedBy: "สุดา ผูกโบว์" },
      labeling: { status: "complete", remark: "ติดป้ายจารึกครบ 200 ชิ้น", updatedAt: "2024-01-10 09:00", updatedBy: "สมหญิง รักงาน" },
      qc: { status: "complete", remark: "ผ่าน QC ทั้งหมด คุณภาพดี", updatedAt: "2024-01-12 15:00", updatedBy: "วิชัย ตรวจสอบ", imagePreviews: [sampleArtwork] },
      packing: { status: "complete", remark: "แพ็กเสร็จ 10 กล่อง", updatedAt: "2024-01-14 10:00", updatedBy: "มานี แพ็กของ", boxCount: 10 },
      delivery_slip: { status: "complete", remark: "พิมพ์ใบส่งของแล้ว", updatedAt: "2024-01-15 09:00", updatedBy: "สมชาย ใจดี" },
      shipping: { status: "complete", remark: "จัดส่งแล้ว Kerry Express", updatedAt: "2024-01-16 14:00", updatedBy: "ขนส่ง ดีเลิศ", carrierName: "Kerry Express", trackingNumber: "TH999888777" },
    },
  },
  // --- กำลังผลิต: อยู่ระหว่างประกอบสินค้า (Step 2) ---
  {
    id: "JOB-2024-010",
    orderDate: "2024-01-25",
    lineName: "customer_line_10",
    customerName: "บริษัท เอ็นจอย สปอร์ต จำกัด",
    product: "ถ้วยรางวัลคริสตัล",
    deliveryDate: "2026-02-20",
    status: "รอประกอบ",
    statusOrder: 2,
    quotation: "Q-2024-010",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "นภา สวยงาม",
    assignedEmployee: "วิชัย ผลิตดี",
    jobType: "งานสั่งผลิต",
    quantity: 80,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "มารับเอง",
    hasEngravingTag: true,
    hasRibbon: true,
    trackingNumber: "",
    productDetails: [
      { name: "ถ้วยคริสตัล 10 นิ้ว", model: "CRY-L", color: "ใส", orderedQty: 30, countedQty: 30 },
      { name: "ถ้วยคริสตัล 8 นิ้ว", model: "CRY-M", color: "ใส", orderedQty: 50, countedQty: 50 },
    ],
    paymentInfo: {
      status: "full" as const,
      amount: 56000,
      proof: "#",
      bank: "กสิกรไทย",
      receivedDate: "2024-01-25",
      netTotal: 56000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "มารับเอง",
      shippingFee: 0,
      usageDate: "2026-02-22",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "นภา สวยงาม",
      status: "กำลังผลิต",
      statusDate: "2024-01-26 10:00",
    },
    ribbonInfo: {
      accepted: true,
      color: "#C0C0C0",
      number: "เบอร์ 3",
    },
    productionWorkflow: {
      procurement: { status: "complete", remark: "รับวัตถุดิบครบถ้วน", updatedAt: "2024-01-27 09:00", updatedBy: "สมศักดิ์ จัดซื้อ" },
      assembly: { status: "in_progress", remark: "กำลังประกอบ ทำแล้ว 40/80 ชิ้น", updatedAt: "2024-01-29 14:00", updatedBy: "วิชัย ผลิตดี" },
    },
  },
  // --- กำลังผลิต: ผ่าน QC แล้ว รอแพ็ก (Step 5→6) ---
  {
    id: "JOB-2024-011",
    orderDate: "2024-01-12",
    lineName: "customer_line_11",
    customerName: "มหาวิทยาลัยราชภัฏ",
    product: "โล่ไม้สั่งทำ",
    deliveryDate: "2026-02-15",
    status: "ผ่าน QC - รอแพ็ก",
    statusOrder: 3,
    quotation: "Q-2024-011",
    responsiblePerson: "วิชัย ขยัน",
    graphicDesigner: "ประดิษฐ์ สร้างสรรค์",
    assignedEmployee: "สุชาติ ดีงาม",
    jobType: "งานสั่งผลิต",
    quantity: 120,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: true,
    hasRibbon: false,
    trackingNumber: "",
    productDetails: [
      { name: "โล่ไม้ 14 นิ้ว", model: "WD-XL", color: "ธรรมชาติ", orderedQty: 40, countedQty: 40 },
      { name: "โล่ไม้ 12 นิ้ว", model: "WD-L", color: "ธรรมชาติ", orderedQty: 80, countedQty: 80 },
    ],
    paymentInfo: {
      status: "full" as const,
      amount: 72000,
      proof: "#",
      bank: "กรุงเทพ",
      receivedDate: "2024-01-12",
      netTotal: 72000,
    },
    shippingInfo: {
      province: "เชียงราย",
      channel: "Kerry Express",
      shippingFee: 350,
      usageDate: "2026-02-18",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "ประดิษฐ์ สร้างสรรค์",
      status: "เสร็จสิ้น",
      statusDate: "2024-01-18 11:30",
    },
    ribbonInfo: { accepted: false },
    productionWorkflow: {
      procurement: { status: "complete", remark: "รับไม้ครบแล้ว", updatedAt: "2024-01-14 10:00", updatedBy: "สมศักดิ์ จัดซื้อ" },
      assembly: { status: "complete", remark: "ประกอบเสร็จ 120 ชิ้น", updatedAt: "2024-01-17 16:00", updatedBy: "สุชาติ ดีงาม" },
      ribbon: { status: "complete", remark: "ไม่มีโบว์ - ข้ามขั้นตอน", updatedAt: "2024-01-17 16:30", updatedBy: "ระบบ" },
      labeling: { status: "complete", remark: "ติดป้ายจารึกครบ", updatedAt: "2024-01-19 09:00", updatedBy: "ประดิษฐ์ สร้างสรรค์" },
      qc: { status: "complete", remark: "ผ่าน QC 120/120 ชิ้น ไม่มีตำหนิ", updatedAt: "2024-01-20 14:00", updatedBy: "วิชัย ตรวจสอบ", imagePreviews: [sampleArtwork] },
      packing: { status: "in_progress", remark: "กำลังแพ็ก", updatedAt: "2024-01-21 08:00", updatedBy: "มานี แพ็กของ" },
    },
  },
  // --- มีปัญหา: QC ไม่ผ่าน ---
  {
    id: "JOB-2024-012",
    orderDate: "2024-01-20",
    lineName: "customer_line_12",
    customerName: "บริษัท แกรนด์ อีเวนท์ จำกัด",
    product: "เหรียญที่ระลึกทองคำ",
    deliveryDate: "2026-02-10",
    status: "QC ไม่ผ่าน - แก้ไข",
    statusOrder: 2,
    quotation: "Q-2024-012",
    responsiblePerson: "มานะ ทำงาน",
    graphicDesigner: "วิภา ศิลป์",
    assignedEmployee: "วิชัย ผลิตดี",
    jobType: "งานสั่งผลิต",
    quantity: 500,
    isAccepted: true,
    hasIssue: true,
    issueDetail: "QC พบสีไม่สม่ำเสมอ 50 ชิ้น ต้องชุบใหม่",
    paymentStatus: "มัดจำ",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: true,
    hasRibbon: true,
    trackingNumber: "",
    productDetails: [
      { name: "เหรียญทองคำ 7 ซม.", model: "GLD-70", color: "ทอง", orderedQty: 300, countedQty: 295 },
      { name: "เหรียญทองคำ 5 ซม.", model: "GLD-50", color: "ทอง", orderedQty: 200, countedQty: 200 },
    ],
    paymentInfo: {
      status: "deposit" as const,
      amount: 80000,
      proof: "#",
      bank: "กสิกรไทย",
      receivedDate: "2024-01-20",
      netTotal: 250000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "Flash Express",
      shippingFee: 200,
      usageDate: "2026-02-12",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "วิภา ศิลป์",
      status: "เสร็จสิ้น",
      statusDate: "2024-01-25 15:00",
    },
    ribbonInfo: {
      accepted: true,
      color: "#FFD700",
      number: "เบอร์ 5",
    },
    productionWorkflow: {
      procurement: { status: "complete", remark: "รับทองคำครบ", updatedAt: "2024-01-22 10:00", updatedBy: "สมศักดิ์ จัดซื้อ" },
      assembly: { status: "complete", remark: "ประกอบเสร็จ", updatedAt: "2024-01-25 14:00", updatedBy: "วิชัย ผลิตดี" },
      ribbon: { status: "complete", remark: "ผูกโบว์ครบ", updatedAt: "2024-01-26 10:00", updatedBy: "สุดา ผูกโบว์" },
      labeling: { status: "complete", remark: "ติดป้ายครบ", updatedAt: "2024-01-27 09:00", updatedBy: "วิภา ศิลป์" },
      qc: { status: "issue", remark: "พบสีไม่สม่ำเสมอ 50 ชิ้น ต้องส่งกลับชุบใหม่", updatedAt: "2024-01-28 16:00", updatedBy: "วิชัย ตรวจสอบ" },
    },
  },
  // --- พร้อมจัดส่ง: แพ็กเสร็จ รอพิมพ์ใบส่ง (Step 6→7) ---
  {
    id: "JOB-2024-013",
    orderDate: "2024-01-08",
    lineName: "customer_line_13",
    customerName: "สโมสรฟุตบอลเมืองทอง",
    product: "ถ้วยรางวัลฟุตบอล",
    deliveryDate: "2026-02-14",
    status: "แพ็กเสร็จ - รอพิมพ์ใบส่งของ",
    statusOrder: 3,
    quotation: "Q-2024-013",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "สมหญิง รักงาน",
    assignedEmployee: "มานะ ทำงาน",
    jobType: "งานสั่งผลิต",
    quantity: 15,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: true,
    hasRibbon: true,
    trackingNumber: "",
    productDetails: [
      { name: "ถ้วยทอง 16 นิ้ว", model: "FT-XL", color: "ทอง", orderedQty: 1, countedQty: 1 },
      { name: "ถ้วยเงิน 14 นิ้ว", model: "FT-L", color: "เงิน", orderedQty: 2, countedQty: 2 },
      { name: "ถ้วยทองแดง 12 นิ้ว", model: "FT-M", color: "ทองแดง", orderedQty: 12, countedQty: 12 },
    ],
    paymentInfo: {
      status: "full" as const,
      amount: 95000,
      proof: "#",
      bank: "ไทยพาณิชย์",
      receivedDate: "2024-01-08",
      netTotal: 95000,
    },
    shippingInfo: {
      province: "ปทุมธานี",
      channel: "Kerry Express",
      shippingFee: 300,
      usageDate: "2026-02-16",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "สมหญิง รักงาน",
      status: "เสร็จสิ้น",
      statusDate: "2024-01-12 10:00",
    },
    ribbonInfo: {
      accepted: true,
      color: "#FF0000",
      number: "เบอร์ 7",
    },
    productionWorkflow: {
      procurement: { status: "complete", remark: "รับของครบ", updatedAt: "2024-01-10 09:00", updatedBy: "สมศักดิ์ จัดซื้อ" },
      assembly: { status: "complete", remark: "ประกอบเสร็จ 15 ถ้วย", updatedAt: "2024-01-14 15:00", updatedBy: "มานะ ทำงาน" },
      ribbon: { status: "complete", remark: "ผูกโบว์สีแดงครบ", updatedAt: "2024-01-15 10:00", updatedBy: "สุดา ผูกโบว์" },
      labeling: { status: "complete", remark: "ติดป้ายจารึกครบ", updatedAt: "2024-01-16 11:00", updatedBy: "สมหญิง รักงาน" },
      qc: { status: "complete", remark: "ผ่าน QC ครบ 15 ชิ้น สวยงาม", updatedAt: "2024-01-17 14:00", updatedBy: "วิชัย ตรวจสอบ", imagePreviews: [sampleArtwork] },
      packing: { status: "complete", remark: "แพ็กเสร็จ 3 กล่อง", updatedAt: "2024-01-18 10:00", updatedBy: "มานี แพ็กของ", boxCount: 3 },
      delivery_slip: { status: "in_progress", remark: "กำลังเตรียมเอกสาร", updatedAt: "2024-01-19 08:00", updatedBy: "สมชาย ใจดี" },
    },
  },
  // --- กำลังผลิต: อยู่ระหว่างผูกโบว์ (Step 3) ---
  {
    id: "JOB-2024-014",
    orderDate: "2024-01-28",
    lineName: "customer_line_14",
    customerName: "โรงพยาบาลศิริราช",
    product: "เหรียญเชิดชูเกียรติ",
    deliveryDate: "2026-02-28",
    status: "รอผูกโบว์",
    statusOrder: 2,
    quotation: "Q-2024-014",
    responsiblePerson: "มานะ ทำงาน",
    graphicDesigner: "นภา สวยงาม",
    assignedEmployee: "สุชาติ ดีงาม",
    jobType: "งานสั่งผลิต",
    quantity: 200,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "มารับเอง",
    hasEngravingTag: true,
    hasRibbon: true,
    trackingNumber: "",
    productDetails: [
      { name: "เหรียญเชิดชูเกียรติ 6 ซม.", model: "HON-60", color: "ทอง", orderedQty: 200, countedQty: 200 },
    ],
    paymentInfo: {
      status: "full" as const,
      amount: 120000,
      proof: "#",
      bank: "กรุงเทพ",
      receivedDate: "2024-01-28",
      netTotal: 120000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "มารับเอง",
      shippingFee: 0,
      usageDate: "2026-03-01",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "นภา สวยงาม",
      status: "กำลังผลิต",
      statusDate: "2024-01-30 09:00",
    },
    ribbonInfo: {
      accepted: true,
      color: "#800080",
      number: "เบอร์ 5",
    },
    productionWorkflow: {
      procurement: { status: "complete", remark: "รับวัตถุดิบครบ", updatedAt: "2024-01-30 10:00", updatedBy: "สมศักดิ์ จัดซื้อ" },
      assembly: { status: "complete", remark: "ประกอบเสร็จ 200 ชิ้น", updatedAt: "2024-02-02 16:00", updatedBy: "สุชาติ ดีงาม" },
      ribbon: { status: "in_progress", remark: "ผูกโบว์แล้ว 120/200 ชิ้น", updatedAt: "2024-02-04 11:00", updatedBy: "สุดา ผูกโบว์" },
    },
  },
  // --- มีปัญหา: จัดหาวัตถุดิบล่าช้า ---
  {
    id: "JOB-2024-015",
    orderDate: "2024-02-01",
    lineName: "customer_line_15",
    customerName: "การไฟฟ้าส่วนภูมิภาค",
    product: "โล่อะคริลิค",
    deliveryDate: "2026-02-13",
    status: "รอผลิต",
    statusOrder: 1,
    quotation: "Q-2024-015",
    responsiblePerson: "สุชาติ ดีงาม",
    graphicDesigner: "วิภา ศิลป์",
    assignedEmployee: "วิชัย ผลิตดี",
    jobType: "งานสั่งผลิต",
    quantity: 50,
    isAccepted: true,
    hasIssue: true,
    issueDetail: "อะคริลิคหมดสต๊อก รอนำเข้า 3 วัน",
    paymentStatus: "มัดจำ",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: true,
    hasRibbon: false,
    trackingNumber: "",
    productDetails: [
      { name: "โล่อะคริลิค 10 นิ้ว", model: "ACR-L", color: "ใส/ทอง", orderedQty: 50, countedQty: 0 },
    ],
    paymentInfo: {
      status: "deposit" as const,
      amount: 15000,
      proof: "#",
      bank: "กสิกรไทย",
      receivedDate: "2024-02-01",
      netTotal: 45000,
    },
    shippingInfo: {
      province: "นครปฐม",
      channel: "Flash Express",
      shippingFee: 150,
      usageDate: "2026-02-15",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "วิภา ศิลป์",
      status: "รอแก้ไข",
      statusDate: "2024-02-02 14:00",
    },
    ribbonInfo: { accepted: false },
    productionWorkflow: {
      procurement: { status: "issue", remark: "อะคริลิคหมดสต๊อก รอนำเข้าจากซัพพลายเออร์ คาด 3 วัน", updatedAt: "2024-02-03 09:00", updatedBy: "สมศักดิ์ จัดซื้อ" },
    },
  },
  // --- พร้อมจัดส่ง: พิมพ์ใบส่งของแล้ว รอจัดส่ง (Step 7→8) ---
  {
    id: "JOB-2024-016",
    orderDate: "2024-01-10",
    lineName: "customer_line_16",
    customerName: "บริษัท ไทยเบฟเวอเรจ จำกัด",
    product: "เหรียญที่ระลึก 50 ปี",
    deliveryDate: "2026-02-14",
    status: "พิมพ์เอกสารแล้ว - รอจัดส่ง",
    statusOrder: 3,
    quotation: "Q-2024-016",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "นภา สวยงาม",
    assignedEmployee: "มานะ ทำงาน",
    jobType: "งานสั่งผลิต",
    quantity: 1000,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: true,
    hasRibbon: true,
    trackingNumber: "",
    productDetails: [
      { name: "เหรียญที่ระลึก 5 ซม.", model: "CM-50Y", color: "ทอง", orderedQty: 500, countedQty: 500 },
      { name: "เหรียญที่ระลึก 5 ซม.", model: "CM-50Y", color: "เงิน", orderedQty: 500, countedQty: 500 },
    ],
    paymentInfo: {
      status: "full" as const,
      amount: 350000,
      proof: "#",
      bank: "กสิกรไทย",
      receivedDate: "2024-01-10",
      netTotal: 350000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "Kerry Express",
      shippingFee: 500,
      usageDate: "2026-02-16",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "นภา สวยงาม",
      status: "เสร็จสิ้น",
      statusDate: "2024-01-15 16:00",
    },
    ribbonInfo: {
      accepted: true,
      color: "#000080",
      number: "เบอร์ 7",
    },
    productionWorkflow: {
      procurement: { status: "complete", remark: "รับวัตถุดิบครบ", updatedAt: "2024-01-12 10:00", updatedBy: "สมศักดิ์ จัดซื้อ" },
      assembly: { status: "complete", remark: "ประกอบเสร็จ 1,000 ชิ้น", updatedAt: "2024-01-18 16:00", updatedBy: "มานะ ทำงาน" },
      ribbon: { status: "complete", remark: "ผูกโบว์ครบ", updatedAt: "2024-01-20 11:00", updatedBy: "สุดา ผูกโบว์" },
      labeling: { status: "complete", remark: "ติดป้ายจารึกครบ 1,000 ชิ้น", updatedAt: "2024-01-22 09:00", updatedBy: "นภา สวยงาม" },
      qc: { status: "complete", remark: "ผ่าน QC 100%", updatedAt: "2024-01-24 14:00", updatedBy: "วิชัย ตรวจสอบ", imagePreviews: [sampleArtwork] },
      packing: { status: "complete", remark: "แพ็กเสร็จ 20 กล่อง", updatedAt: "2024-01-26 10:00", updatedBy: "มานี แพ็กของ", boxCount: 20 },
      delivery_slip: { status: "complete", remark: "พิมพ์ใบส่งของ + ใบกำกับภาษีแล้ว", updatedAt: "2024-01-27 09:00", updatedBy: "สมชาย ใจดี" },
      shipping: { status: "in_progress", remark: "รอรถขนส่งมารับ วันพรุ่งนี้", updatedAt: "2024-01-27 15:00", updatedBy: "ขนส่ง ดีเลิศ" },
    },
  },
  // --- กำลังผลิต: รอติดป้ายจารึก (Step 4) ---
  {
    id: "JOB-2024-017",
    orderDate: "2024-01-22",
    lineName: "customer_line_17",
    customerName: "สำนักงานตำรวจแห่งชาติ",
    product: "เหรียญกล้าหาญ",
    deliveryDate: "2026-03-01",
    status: "รอติดป้ายจารึก",
    statusOrder: 2,
    quotation: "Q-2024-017",
    responsiblePerson: "วิชัย ขยัน",
    graphicDesigner: "สมหญิง รักงาน",
    assignedEmployee: "สุชาติ ดีงาม",
    jobType: "งานสั่งผลิต",
    quantity: 100,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "มารับเอง",
    hasEngravingTag: true,
    hasRibbon: true,
    trackingNumber: "",
    productDetails: [
      { name: "เหรียญกล้าหาญ 7 ซม.", model: "BRV-70", color: "ทอง", orderedQty: 100, countedQty: 100 },
    ],
    paymentInfo: {
      status: "full" as const,
      amount: 85000,
      proof: "#",
      bank: "ไทยพาณิชย์",
      receivedDate: "2024-01-22",
      netTotal: 85000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "มารับเอง",
      shippingFee: 0,
      usageDate: "2026-03-05",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "สมหญิง รักงาน",
      status: "กำลังผลิต",
      statusDate: "2024-01-28 10:00",
    },
    ribbonInfo: {
      accepted: true,
      color: "#006400",
      number: "เบอร์ 5",
    },
    productionWorkflow: {
      procurement: { status: "complete", remark: "รับวัตถุดิบครบ", updatedAt: "2024-01-24 10:00", updatedBy: "สมศักดิ์ จัดซื้อ" },
      assembly: { status: "complete", remark: "ประกอบเสร็จ 100 ชิ้น", updatedAt: "2024-01-27 14:00", updatedBy: "สุชาติ ดีงาม" },
      ribbon: { status: "complete", remark: "ผูกโบว์สีเขียวครบ", updatedAt: "2024-01-28 10:00", updatedBy: "สุดา ผูกโบว์" },
      labeling: { status: "in_progress", remark: "กำลังติดป้ายจารึก ทำแล้ว 60/100", updatedAt: "2024-01-30 14:00", updatedBy: "สมหญิง รักงาน" },
    },
  },
  // --- จัดส่งแล้ว: เสร็จสิ้นทั้งหมด พร้อมเลขพัสดุ ---
  {
    id: "JOB-2024-018",
    orderDate: "2024-01-02",
    lineName: "customer_line_18",
    customerName: "สมาคมแพทย์แห่งประเทศไทย",
    product: "โล่เกียรติคุณแพทย์ดีเด่น",
    deliveryDate: "2024-01-25",
    status: "จัดส่งแล้ว",
    statusOrder: 4,
    quotation: "Q-2024-018",
    responsiblePerson: "มานะ ทำงาน",
    graphicDesigner: "ประดิษฐ์ สร้างสรรค์",
    assignedEmployee: "วิชัย ผลิตดี",
    jobType: "งานสั่งผลิต",
    quantity: 10,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: true,
    hasRibbon: false,
    trackingNumber: "TH555666777",
    productDetails: [
      { name: "โล่เกียรติคุณ 16 นิ้ว", model: "HNR-XL", color: "ทอง/ไม้มะฮอกกานี", orderedQty: 10, countedQty: 10 },
    ],
    paymentInfo: {
      status: "full" as const,
      amount: 65000,
      proof: "#",
      bank: "กรุงเทพ",
      receivedDate: "2024-01-02",
      netTotal: 65000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "Flash Express",
      shippingFee: 200,
      usageDate: "2024-01-28",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "ประดิษฐ์ สร้างสรรค์",
      status: "เสร็จสิ้น",
      statusDate: "2024-01-08 09:00",
    },
    ribbonInfo: { accepted: false },
    productionWorkflow: {
      procurement: { status: "complete", remark: "รับวัตถุดิบครบ", updatedAt: "2024-01-04 10:00", updatedBy: "สมศักดิ์ จัดซื้อ" },
      assembly: { status: "complete", remark: "ประกอบเสร็จ", updatedAt: "2024-01-08 14:00", updatedBy: "วิชัย ผลิตดี" },
      ribbon: { status: "complete", remark: "ไม่มีโบว์", updatedAt: "2024-01-08 14:30", updatedBy: "ระบบ" },
      labeling: { status: "complete", remark: "ติดป้ายจารึกครบ", updatedAt: "2024-01-10 09:00", updatedBy: "ประดิษฐ์ สร้างสรรค์" },
      qc: { status: "complete", remark: "ผ่าน QC ทุกชิ้น", updatedAt: "2024-01-12 14:00", updatedBy: "วิชัย ตรวจสอบ", imagePreviews: [sampleArtwork] },
      packing: { status: "complete", remark: "แพ็กเสร็จ 2 กล่อง", updatedAt: "2024-01-14 10:00", updatedBy: "มานี แพ็กของ", boxCount: 2 },
      delivery_slip: { status: "complete", remark: "พิมพ์ใบส่งของแล้ว", updatedAt: "2024-01-15 09:00", updatedBy: "มานะ ทำงาน" },
      shipping: { status: "complete", remark: "จัดส่ง Flash Express", updatedAt: "2024-01-16 14:00", updatedBy: "ขนส่ง ดีเลิศ", carrierName: "Flash Express", trackingNumber: "TH555666777" },
    },
  },
  // --- รอผลิต: ยังไม่เริ่มขั้นตอนใดๆ (ใกล้กำหนดส่ง) ---
  {
    id: "JOB-2024-019",
    orderDate: "2024-02-05",
    lineName: "customer_line_19",
    customerName: "ธนาคารกรุงไทย",
    product: "เหรียญที่ระลึกพนักงานดีเด่น",
    deliveryDate: "2026-02-14",
    status: "รอผลิต",
    statusOrder: 1,
    quotation: "Q-2024-019",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "วิภา ศิลป์",
    assignedEmployee: "มานะ ทำงาน",
    jobType: "งานสั่งผลิต",
    quantity: 30,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "เต็มจำนวน",
    deliveryChannel: "มารับเอง",
    hasEngravingTag: true,
    hasRibbon: true,
    trackingNumber: "",
    productDetails: [
      { name: "เหรียญพนักงานดีเด่น 6 ซม.", model: "EMP-60", color: "ทอง", orderedQty: 30, countedQty: 0 },
    ],
    paymentInfo: {
      status: "full" as const,
      amount: 22000,
      proof: "#",
      bank: "กรุงไทย",
      receivedDate: "2024-02-05",
      netTotal: 22000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "มารับเอง",
      shippingFee: 0,
      usageDate: "2026-02-16",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "วิภา ศิลป์",
      status: "รอเริ่ม",
      statusDate: "2024-02-05 10:00",
    },
    ribbonInfo: {
      accepted: true,
      color: "#1E90FF",
      number: "เบอร์ 3",
    },
  },
  // --- กำลังผลิต: ตรวจ QC อยู่ (Step 5) ---
  {
    id: "JOB-2024-020",
    orderDate: "2024-01-15",
    lineName: "customer_line_20",
    customerName: "บริษัท ปตท. จำกัด (มหาชน)",
    product: "โล่ที่ระลึก 30 ปี",
    deliveryDate: "2026-02-18",
    status: "รอตรวจ QC",
    statusOrder: 2,
    quotation: "Q-2024-020",
    responsiblePerson: "วิชัย ขยัน",
    graphicDesigner: "ประดิษฐ์ สร้างสรรค์",
    assignedEmployee: "สุชาติ ดีงาม",
    jobType: "งานสั่งผลิต",
    quantity: 60,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "มัดจำ",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: true,
    hasRibbon: false,
    trackingNumber: "",
    productDetails: [
      { name: "โล่ที่ระลึก 14 นิ้ว", model: "PTT-L", color: "ทอง/น้ำเงิน", orderedQty: 30, countedQty: 30 },
      { name: "โล่ที่ระลึก 12 นิ้ว", model: "PTT-M", color: "ทอง/น้ำเงิน", orderedQty: 30, countedQty: 30 },
    ],
    paymentInfo: {
      status: "deposit" as const,
      amount: 40000,
      proof: "#",
      bank: "กรุงไทย",
      receivedDate: "2024-01-15",
      netTotal: 98000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "Kerry Express",
      shippingFee: 350,
      usageDate: "2026-02-20",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "ประดิษฐ์ สร้างสรรค์",
      status: "เสร็จสิ้น",
      statusDate: "2024-01-20 16:00",
    },
    ribbonInfo: { accepted: false },
    productionWorkflow: {
      procurement: { status: "complete", remark: "รับวัตถุดิบครบ", updatedAt: "2024-01-17 10:00", updatedBy: "สมศักดิ์ จัดซื้อ" },
      assembly: { status: "complete", remark: "ประกอบเสร็จ 60 ชิ้น", updatedAt: "2024-01-22 16:00", updatedBy: "สุชาติ ดีงาม" },
      ribbon: { status: "complete", remark: "ไม่มีโบว์ - ข้าม", updatedAt: "2024-01-22 16:30", updatedBy: "ระบบ" },
      labeling: { status: "complete", remark: "ติดป้ายจารึกครบ 60 ชิ้น", updatedAt: "2024-01-24 09:00", updatedBy: "ประดิษฐ์ สร้างสรรค์" },
      qc: { status: "in_progress", remark: "ตรวจแล้ว 40/60 ชิ้น", updatedAt: "2024-01-25 14:00", updatedBy: "วิชัย ตรวจสอบ" },
    },
  },
  // --- สถานะ โรงงานส่งออก: สินค้าจากจัดซื้อ ผลิตจากโรงงานจีน ---
  {
    id: "JOB-2024-021",
    orderDate: "2024-01-10",
    lineName: "customer_line_21",
    customerName: "สมาคมกีฬากรุงเทพมหานคร",
    product: "เหรียญรางวัล Bangkok Marathon 2024",
    deliveryDate: "2026-03-15",
    status: "โรงงานส่งออก",
    statusOrder: 2,
    quotation: "Q-2024-021",
    responsiblePerson: "สมชาย ใจดี",
    graphicDesigner: "นภา สวยงาม",
    assignedEmployee: "วิชัย ผลิตดี",
    jobType: "งานสั่งผลิต",
    quantity: 5000,
    isAccepted: true,
    hasIssue: false,
    paymentStatus: "มัดจำ",
    deliveryChannel: "จัดส่ง",
    hasEngravingTag: false,
    hasRibbon: false,
    trackingNumber: "",
    productDetails: [
      { name: "เหรียญทอง 5 ซม.", model: "MRT-G", color: "ทอง", orderedQty: 1100, countedQty: 0 },
      { name: "เหรียญเงิน 5 ซม.", model: "MRT-S", color: "เงิน", orderedQty: 2200, countedQty: 0 },
      { name: "เหรียญทองแดง 5 ซม.", model: "MRT-C", color: "ทองแดง", orderedQty: 1700, countedQty: 0 },
    ],
    paymentInfo: {
      status: "deposit" as const,
      amount: 100000,
      proof: "#",
      bank: "กสิกรไทย",
      receivedDate: "2024-01-10",
      netTotal: 225000,
    },
    shippingInfo: {
      province: "กรุงเทพมหานคร",
      channel: "Kerry Express",
      shippingFee: 500,
      usageDate: "2026-03-18",
    },
    engravingInfo: {
      accepted: true,
      graphicStaff: "นภา สวยงาม",
      status: "เสร็จสิ้น",
      statusDate: "2024-01-15 10:00",
    },
    ribbonInfo: {
      accepted: true,
      color: "#FFD700",
      number: "เบอร์ 5",
    },
    // Steps 1-4 complete (greyed out in UI), steps 5-8 active
    productionWorkflow: {
      procurement: { status: "complete", remark: "โรงงานจีนจัดส่งแล้ว (ข้ามขั้นตอน)", updatedAt: "2024-02-01 10:00", updatedBy: "ระบบจัดซื้อ" },
      assembly: { status: "complete", remark: "โรงงานจีนประกอบเสร็จ (ข้ามขั้นตอน)", updatedAt: "2024-02-01 10:00", updatedBy: "ระบบจัดซื้อ" },
      ribbon: { status: "complete", remark: "โรงงานจีนผูกโบว์เสร็จ (ข้ามขั้นตอน)", updatedAt: "2024-02-01 10:00", updatedBy: "ระบบจัดซื้อ" },
      labeling: { status: "complete", remark: "โรงงานจีนติดป้ายเสร็จ (ข้ามขั้นตอน)", updatedAt: "2024-02-01 10:00", updatedBy: "ระบบจัดซื้อ" },
      qc: { status: "in_progress", remark: "รอตรวจสอบ QC ที่ร้าน", updatedAt: "2024-02-10 09:00", updatedBy: "วิชัย ตรวจสอบ" },
    },
    // Procurement-specific info
    procurementInfo: {
      jobCode: "JOB-2024-021",
      jobName: "งานวิ่ง Bangkok Marathon 2024",
      customerName: "สมาคมกีฬากรุงเทพมหานคร",
      salesPerson: "พนักงานขาย A",
      material: "ซิงค์อัลลอย",
      size: "5 ซม.",
      thickness: "4 มิล",
      colors: ["shinny gold (สีทองเงา)", "shinny silver (สีเงินเงา)", "shinny copper (สีทองแดงเงา)"],
      frontDetails: "พิมพ์โลโก้, ลงสีสเปรย์, ลงน้ำยาป้องกันสนิม, ขัดเงา",
      backDetails: "แกะสลักข้อความ, ปั๊มลาย",
      lanyardSize: "90x2.5 ซม.",
      lanyardPatterns: 3,
      quantity: 5000,
      customerBudget: 45,
      eventDate: "2026-03-20",
      notes: "ต้องการส่งมอบก่อนวันงาน 7 วัน",
      factoryLabel: "China B&C",
      totalSellingPrice: 225000,
      profit: 45000,
      shippingChannel: "SEA",
      shippingCostRMB: 3200,
      exchangeRate: 5.5,
      poNumber: "PO-2024-0045",
      shipDate: "2024-02-05",
    },
  },
];

export default function OrderManagement() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState(mockOrders);
  const [selectedOrder, setSelectedOrder] = useState<typeof mockOrders[0] | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<string>("all");
  const [selectedSalesPerson, setSelectedSalesPerson] = useState<string>("all");
  const [selectedGraphicDesigner, setSelectedGraphicDesigner] = useState<string>("all");
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>("all");
  const [selectedDeliveryChannel, setSelectedDeliveryChannel] = useState<string>("all");
  const [selectedEngravingTag, setSelectedEngravingTag] = useState<string>("all");
  const [selectedRibbon, setSelectedRibbon] = useState<string>("all");

  // Get unique employees from orders
  const employees = useMemo(() => {
    const uniqueEmployees = [...new Set(orders.map(o => o.assignedEmployee))];
    return uniqueEmployees.sort();
  }, [orders]);

  // Get unique sales persons
  const salesPersons = useMemo(() => {
    const unique = [...new Set(orders.map(o => o.responsiblePerson))];
    return unique.sort();
  }, [orders]);

  // Get unique graphic designers
  const graphicDesigners = useMemo(() => {
    const unique = [...new Set(orders.map(o => o.graphicDesigner))];
    return unique.sort();
  }, [orders]);

  // Status counts for tabs
  const statusCounts = useMemo(() => {
    return {
      all: orders.length,
      รอผลิต: orders.filter(o => o.status === "รอผลิต").length,
      กำลังผลิต: orders.filter(o => o.status === "กำลังผลิต" || o.status.startsWith("รอ") || o.status === "โรงงานส่งออก").length,
      พร้อมจัดส่ง: orders.filter(o => o.status === "พร้อมจัดส่ง" || o.status === "ประกอบเสร็จ").length,
      จัดส่งแล้ว: orders.filter(o => o.status === "จัดส่งแล้ว").length,
      มีปัญหา: orders.filter(o => o.hasIssue).length,
    };
  }, [orders]);

  // Filtered orders based on all criteria
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Search filter (Job ID, Customer Name, Product)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery === "" || 
        order.id.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower) ||
        order.product.toLowerCase().includes(searchLower);

      // Employee filter
      const matchesEmployee = selectedEmployee === "all" || order.assignedEmployee === selectedEmployee;

      // Sales person filter
      const matchesSalesPerson = selectedSalesPerson === "all" || order.responsiblePerson === selectedSalesPerson;

      // Graphic designer filter
      const matchesGraphicDesigner = selectedGraphicDesigner === "all" || order.graphicDesigner === selectedGraphicDesigner;

      // Payment status filter
      const matchesPaymentStatus = selectedPaymentStatus === "all" || order.paymentStatus === selectedPaymentStatus;

      // Delivery channel filter
      const matchesDeliveryChannel = selectedDeliveryChannel === "all" || order.deliveryChannel === selectedDeliveryChannel;

      // Engraving tag filter
      const matchesEngravingTag = selectedEngravingTag === "all" || 
        (selectedEngravingTag === "รับ" && order.hasEngravingTag) ||
        (selectedEngravingTag === "ไม่รับ" && !order.hasEngravingTag);

      // Ribbon filter
      const matchesRibbon = selectedRibbon === "all" || 
        (selectedRibbon === "รับ" && order.hasRibbon) ||
        (selectedRibbon === "ไม่รับ" && !order.hasRibbon);

      // Status filter
      let matchesStatus = true;
      if (activeStatus !== "all") {
        if (activeStatus === "มีปัญหา") {
          matchesStatus = order.hasIssue === true;
        } else if (activeStatus === "กำลังผลิต") {
          matchesStatus = order.status === "กำลังผลิต" || order.status.startsWith("รอ") || order.status === "โรงงานส่งออก";
        } else if (activeStatus === "พร้อมจัดส่ง") {
          matchesStatus = order.status === "พร้อมจัดส่ง" || order.status === "ประกอบเสร็จ";
        } else {
          matchesStatus = order.status === activeStatus;
        }
      }

      return matchesSearch && matchesEmployee && matchesSalesPerson && matchesGraphicDesigner && 
             matchesPaymentStatus && matchesDeliveryChannel && matchesEngravingTag && matchesRibbon && matchesStatus;
    });
  }, [orders, searchQuery, selectedEmployee, selectedSalesPerson, selectedGraphicDesigner, 
      selectedPaymentStatus, selectedDeliveryChannel, selectedEngravingTag, selectedRibbon, activeStatus]);

  const handleSelectOrder = (order: typeof mockOrders[0]) => {
    setSelectedOrder(order);
  };

  const handleBack = () => {
    setSelectedOrder(null);
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedEmployee("all");
    setActiveStatus("all");
    setSelectedSalesPerson("all");
    setSelectedGraphicDesigner("all");
    setSelectedPaymentStatus("all");
    setSelectedDeliveryChannel("all");
    setSelectedEngravingTag("all");
    setSelectedRibbon("all");
  };

  const hasActiveFilters = searchQuery !== "" || selectedEmployee !== "all" || activeStatus !== "all" ||
    selectedSalesPerson !== "all" || selectedGraphicDesigner !== "all" || selectedPaymentStatus !== "all" ||
    selectedDeliveryChannel !== "all" || selectedEngravingTag !== "all" || selectedRibbon !== "all";

  const getStatusBadge = (status: string, hasIssue?: boolean) => {
    if (hasIssue) {
      return (
        <Badge className="bg-red-100 text-red-700 border-red-300">
          <AlertCircle className="w-3 h-3 mr-1" />
          มีปัญหา
        </Badge>
      );
    }
    const config: Record<string, string> = {
      "รอผลิต": "bg-gray-100 text-gray-700",
      "กำลังผลิต": "bg-blue-100 text-blue-700",
      "พร้อมจัดส่ง": "bg-orange-100 text-orange-700",
      "จัดส่งแล้ว": "bg-green-100 text-green-700",
      "รอประกอบ": "bg-yellow-100 text-yellow-700",
      "รอผูกโบว์": "bg-purple-100 text-purple-700",
      "รอติดป้ายจารึก": "bg-indigo-100 text-indigo-700",
      "ประกอบเสร็จ": "bg-green-100 text-green-700",
      "โรงงานส่งออก": "bg-cyan-100 text-cyan-700",
    };
    return <Badge className={config[status] || "bg-gray-100 text-gray-700"}>{status}</Badge>;
  };

  // If an order is selected, show the workspace view
  if (selectedOrder) {
    return (
      <div className="space-y-6">
        <ProductionWorkspace
          order={selectedOrder}
          onBack={handleBack}
          onStatusChange={handleStatusChange}
        />
      </div>
    );
  }

  // Summary stats
  const stats = [
    { label: "รอผลิต", count: statusCounts.รอผลิต, icon: Clock, color: "text-gray-600", bgColor: "bg-gray-50" },
    { label: "กำลังผลิต", count: statusCounts.กำลังผลิต, icon: Package, color: "text-blue-600", bgColor: "bg-blue-50" },
    { label: "พร้อมจัดส่ง", count: statusCounts.พร้อมจัดส่ง, icon: Truck, color: "text-orange-600", bgColor: "bg-orange-50" },
    { label: "จัดส่งแล้ว", count: statusCounts.จัดส่งแล้ว, icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-50" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">จัดการผลิตและจัดส่ง</h1>
        <p className="text-muted-foreground">ระบบติดตามงานตั้งแต่เริ่มผลิตจนถึงส่งมอบ • เลือกงานเพื่อเริ่มบันทึกการผลิต</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat) => (
          <Card 
            key={stat.label} 
            className={`cursor-pointer transition-all hover:shadow-md ${activeStatus === stat.label ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setActiveStatus(activeStatus === stat.label ? "all" : stat.label)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.count}</div>
              <p className="text-xs text-muted-foreground">รายการ</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            ค้นหาและกรองข้อมูล
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Box */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหา Job ID, ชื่อลูกค้า, หรือสินค้า..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters} className="shrink-0">
                <X className="h-4 w-4 mr-1" />
                ล้างตัวกรอง
              </Button>
            )}
          </div>

          {/* Filter Dropdowns Row 1 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Sales Person */}
            <Select value={selectedSalesPerson} onValueChange={setSelectedSalesPerson}>
              <SelectTrigger>
                <SelectValue placeholder="พนักงานขายทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">พนักงานขายทั้งหมด</SelectItem>
                {salesPersons.map((person) => (
                  <SelectItem key={person} value={person}>
                    {person}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Graphic Designer */}
            <Select value={selectedGraphicDesigner} onValueChange={setSelectedGraphicDesigner}>
              <SelectTrigger>
                <SelectValue placeholder="พนักงานกราฟิกทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">พนักงานกราฟิกทั้งหมด</SelectItem>
                {graphicDesigners.map((designer) => (
                  <SelectItem key={designer} value={designer}>
                    {designer}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Payment Status */}
            <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
              <SelectTrigger>
                <SelectValue placeholder="สถานะชำระเงินทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">สถานะชำระเงินทั้งหมด</SelectItem>
                <SelectItem value="มัดจำ">มัดจำ</SelectItem>
                <SelectItem value="เต็มจำนวน">เต็มจำนวน</SelectItem>
              </SelectContent>
            </Select>

            {/* Delivery Channel */}
            <Select value={selectedDeliveryChannel} onValueChange={setSelectedDeliveryChannel}>
              <SelectTrigger>
                <SelectValue placeholder="ช่องทางจัดส่งทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">ช่องทางจัดส่งทั้งหมด</SelectItem>
                <SelectItem value="มารับเอง">มารับเอง</SelectItem>
                <SelectItem value="จัดส่ง">จัดส่ง</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filter Dropdowns Row 2 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Production Employee */}
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger>
                <SelectValue placeholder="พนักงานผลิตทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">พนักงานผลิตทั้งหมด</SelectItem>
                {employees.map((employee) => (
                  <SelectItem key={employee} value={employee}>
                    {employee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Engraving Tag Filter */}
            <Select value={selectedEngravingTag} onValueChange={setSelectedEngravingTag}>
              <SelectTrigger>
                <SelectValue placeholder="ป้ายจารึกทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">ป้ายจารึกทั้งหมด</SelectItem>
                <SelectItem value="รับ">รับงานป้ายจารึก</SelectItem>
                <SelectItem value="ไม่รับ">ไม่รับงานป้ายจารึก</SelectItem>
              </SelectContent>
            </Select>

            {/* Ribbon Filter */}
            <Select value={selectedRibbon} onValueChange={setSelectedRibbon}>
              <SelectTrigger>
                <SelectValue placeholder="โบว์ทั้งหมด" />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="all">โบว์ทั้งหมด</SelectItem>
                <SelectItem value="รับ">รับงานโบว์</SelectItem>
                <SelectItem value="ไม่รับ">ไม่รับงานโบว์</SelectItem>
              </SelectContent>
            </Select>

            {/* Empty placeholder for grid alignment */}
            <div></div>
          </div>

          {/* Status Tabs */}
          <Tabs value={activeStatus} onValueChange={setActiveStatus}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                ทั้งหมด ({statusCounts.all})
              </TabsTrigger>
              <TabsTrigger value="รอผลิต" className="text-xs sm:text-sm">
                <Clock className="w-3 h-3 mr-1 hidden sm:inline" />
                รอผลิต ({statusCounts.รอผลิต})
              </TabsTrigger>
              <TabsTrigger value="กำลังผลิต" className="text-xs sm:text-sm">
                <Package className="w-3 h-3 mr-1 hidden sm:inline" />
                กำลังผลิต ({statusCounts.กำลังผลิต})
              </TabsTrigger>
              <TabsTrigger value="พร้อมจัดส่ง" className="text-xs sm:text-sm">
                <Truck className="w-3 h-3 mr-1 hidden sm:inline" />
                พร้อมส่ง ({statusCounts.พร้อมจัดส่ง})
              </TabsTrigger>
              <TabsTrigger value="จัดส่งแล้ว" className="text-xs sm:text-sm">
                <CheckCircle className="w-3 h-3 mr-1 hidden sm:inline" />
                ส่งแล้ว ({statusCounts.จัดส่งแล้ว})
              </TabsTrigger>
              <TabsTrigger value="มีปัญหา" className="text-xs sm:text-sm text-destructive">
                <AlertCircle className="w-3 h-3 mr-1 hidden sm:inline" />
                มีปัญหา ({statusCounts.มีปัญหา})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                รายการงาน
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                แสดง {filteredOrders.length} จาก {orders.length} รายการ
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-max">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Job ID</TableHead>
                  <TableHead className="whitespace-nowrap">สถานะ</TableHead>
                  <TableHead className="whitespace-nowrap">สินค้า</TableHead>
                  <TableHead className="whitespace-nowrap">ชื่อลูกค้า</TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Truck className="w-4 h-4" />
                      วันที่ (สั่ง/ส่ง)
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">ช่องทางจัดส่ง</TableHead>
                  <TableHead className="whitespace-nowrap text-center">จารึก</TableHead>
                  <TableHead className="whitespace-nowrap text-center">โบว์</TableHead>
                  <TableHead className="whitespace-nowrap">การจัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(order => (
                    <TableRow 
                      key={order.id} 
                      className={`cursor-pointer hover:bg-muted/50 ${
                        order.hasIssue ? 'bg-destructive/10 hover:bg-destructive/20 border-l-4 border-l-destructive' : ''
                      }`}
                    >
                      <TableCell className="font-medium whitespace-nowrap">
                        <a
                          href={`/production/orders/${order.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline hover:text-blue-800 cursor-pointer"
                        >
                          {order.id}
                        </a>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {getStatusBadge(order.status, order.hasIssue)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap max-w-[120px]">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate block font-medium">{order.product}</span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{order.product}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span className="text-primary">@{order.lineName}</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex flex-col text-sm">
                          <span className="text-muted-foreground text-xs">{order.orderDate}</span>
                          <span className="font-medium">{order.deliveryDate}</span>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{order.deliveryChannel}</TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        {order.hasEngravingTag ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-center">
                        {order.hasRibbon ? (
                          <Check className="w-5 h-5 text-green-600 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-destructive mx-auto" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleSelectOrder(order)}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          อัปเดต
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">ไม่พบรายการที่ตรงกับเงื่อนไขการค้นหา</p>
                        {hasActiveFilters && (
                          <Button variant="link" onClick={clearFilters}>
                            ล้างตัวกรองทั้งหมด
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}