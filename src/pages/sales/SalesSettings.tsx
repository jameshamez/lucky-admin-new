import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Settings, 
  Users, 
  FileText, 
  Target,
  TrendingUp,
  Calendar
} from "lucide-react";

export default function SalesSettings() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Mock data for customer types
  const customerTypes = [
    { id: 1, name: "เจ้าของงาน", description: "ลูกค้าที่เป็นเจ้าของโครงการโดยตรง" },
    { id: 2, name: "ออร์แกไนเซอร์/ตัวกลาง", description: "บริษัทจัดงานหรือตัวกลาง" },
  ];

  // Mock data for business types
  const businessTypes = [
    { id: 1, name: "โรงเรียน", description: "สถานศึกษาทุกระดับ" },
    { id: 2, name: "องค์กร", description: "บริษัทเอกชน" },
    { id: 3, name: "หน่วยงานรัฐ", description: "หน่วยงานภาครัฐ" },
  ];

  // Mock data for customer status
  const customerStatus = [
    { id: 1, name: "ผู้มุ่งหวัง (Lead)", description: "ลูกค้าที่กำลังสนใจ" },
    { id: 2, name: "ลูกค้าใหม่", description: "ลูกค้าที่ซื้อครั้งแรก" },
    { id: 3, name: "ลูกค้าประจำ", description: "ลูกค้าที่ซื้อบ่อย" },
    { id: 4, name: "เลิกติดต่อ (Inactive)", description: "ลูกค้าที่ไม่ติดต่อแล้ว" },
  ];

  // Mock data for channels
  const channels = [
    { id: 1, name: "Facebook", description: "โซเชียลมีเดีย" },
    { id: 2, name: "Google", description: "ค้นหาผ่าน Google" },
    { id: 3, name: "ลูกค้าแนะนำ", description: "แนะนำจากลูกค้าเดิม" },
  ];

  // Mock data for job types
  const jobTypes = [
    { id: 1, name: "งานวิ่ง", description: "งานแข่งวิ่ง มาราธอน" },
    { id: 2, name: "งานมอบรางวัล", description: "งานประกาศรางวัล" },
    { id: 3, name: "กีฬาภายใน", description: "กีฬาสีภายในองค์กร" },
  ];

  // Mock data for delivery formats
  const deliveryFormats = [
    { id: 1, name: "จัดส่งพัสดุ", description: "ส่งทางไปรษณีย์/ขนส่ง" },
    { id: 2, name: "รับที่ร้าน", description: "มารับเองที่ร้าน" },
  ];

  // Mock data for urgency levels
  const urgencyLevels = [
    { id: 1, name: "ปกติ", description: "ไม่เร่งด่วน", color: "bg-green-500" },
    { id: 2, name: "เร่งด่วน", description: "ต้องเร่งจัดส่ง", color: "bg-yellow-500" },
    { id: 3, name: "เร่งด่วนมาก", description: "ต้องส่งทันที", color: "bg-red-500" },
  ];

  // Mock data for sales targets
  const salesTargets = [
    { id: 1, name: "สมชาย ใจดี", type: "รายบุคคล", period: "มกราคม 2024", target: "500,000", current: "350,000", percentage: 70 },
    { id: 2, name: "สมหญิง รักงาน", type: "รายบุคคล", period: "มกราคม 2024", target: "400,000", current: "420,000", percentage: 105 },
    { id: 3, name: "ทีมขาย A", type: "รายทีม", period: "ไตรมาส 1/2024", target: "2,000,000", current: "1,500,000", percentage: 75 },
  ];

  const SettingItem = ({ item, onEdit, onDelete }: any) => (
    <TableRow>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell className="text-muted-foreground">{item.description}</TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(item)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  const SettingDialog = ({ title, description, onSave }: any) => (
    <Dialog open={openDialog} onOpenChange={setOpenDialog}>
      <DialogTrigger asChild>
        <Button onClick={() => setEditingItem(null)}>
          <Plus className="w-4 h-4 mr-2" />
          เพิ่มใหม่
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editingItem ? "แก้ไข" : "เพิ่ม"}{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">ชื่อตัวเลือก *</Label>
            <Input 
              id="name" 
              placeholder="กรอกชื่อ" 
              defaultValue={editingItem?.name}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบาย</Label>
            <Textarea 
              id="description" 
              placeholder="กรอกคำอธิบาย" 
              rows={3}
              defaultValue={editingItem?.description}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={() => {
              onSave();
              setOpenDialog(false);
            }}
          >
            บันทึก
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">การตั้งค่า</h1>
        <p className="text-muted-foreground">จัดการตัวเลือกและการตั้งค่าต่างๆ สำหรับฝ่ายขาย</p>
      </div>

      <Tabs defaultValue="customer" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            จัดการลูกค้า
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            ขายและใบเสนอราคา
          </TabsTrigger>
          <TabsTrigger value="kpi" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            KPI และเป้าหมาย
          </TabsTrigger>
        </TabsList>

        {/* Customer Settings Tab */}
        <TabsContent value="customer" className="space-y-4">
          {/* Customer Types */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ประเภทลูกค้า</CardTitle>
                  <CardDescription>จัดการประเภทของลูกค้า</CardDescription>
                </div>
                <SettingDialog 
                  title="ประเภทลูกค้า"
                  description="เพิ่มประเภทลูกค้าใหม่"
                  onSave={() => console.log("Save customer type")}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerTypes.map((item) => (
                    <SettingItem 
                      key={item.id}
                      item={item}
                      onEdit={setEditingItem}
                      onDelete={(id: number) => console.log("Delete", id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Business Types */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ประเภทธุรกิจ</CardTitle>
                  <CardDescription>จัดการประเภทธุรกิจของลูกค้า</CardDescription>
                </div>
                <SettingDialog 
                  title="ประเภทธุรกิจ"
                  description="เพิ่มประเภทธุรกิจใหม่"
                  onSave={() => console.log("Save business type")}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businessTypes.map((item) => (
                    <SettingItem 
                      key={item.id}
                      item={item}
                      onEdit={setEditingItem}
                      onDelete={(id: number) => console.log("Delete", id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Customer Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>สถานะลูกค้า</CardTitle>
                  <CardDescription>จัดการสถานะของลูกค้า</CardDescription>
                </div>
                <SettingDialog 
                  title="สถานะลูกค้า"
                  description="เพิ่มสถานะลูกค้าใหม่"
                  onSave={() => console.log("Save customer status")}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerStatus.map((item) => (
                    <SettingItem 
                      key={item.id}
                      item={item}
                      onEdit={setEditingItem}
                      onDelete={(id: number) => console.log("Delete", id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Channels */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ช่องทางที่รู้จัก</CardTitle>
                  <CardDescription>จัดการช่องทางที่ลูกค้ารู้จัก</CardDescription>
                </div>
                <SettingDialog 
                  title="ช่องทางที่รู้จัก"
                  description="เพิ่มช่องทางใหม่"
                  onSave={() => console.log("Save channel")}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {channels.map((item) => (
                    <SettingItem 
                      key={item.id}
                      item={item}
                      onEdit={setEditingItem}
                      onDelete={(id: number) => console.log("Delete", id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sales & Quotation Settings Tab */}
        <TabsContent value="sales" className="space-y-4">
          {/* Job Types */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ประเภทงาน (สำหรับลูกค้า)</CardTitle>
                  <CardDescription>จัดการประเภทงานที่ลูกค้าสั่งผลิต</CardDescription>
                </div>
                <SettingDialog 
                  title="ประเภทงาน"
                  description="เพิ่มประเภทงานใหม่"
                  onSave={() => console.log("Save job type")}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobTypes.map((item) => (
                    <SettingItem 
                      key={item.id}
                      item={item}
                      onEdit={setEditingItem}
                      onDelete={(id: number) => console.log("Delete", id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Delivery Formats */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>รูปแบบการส่งมอบ</CardTitle>
                  <CardDescription>จัดการรูปแบบการส่งมอบสินค้า</CardDescription>
                </div>
                <SettingDialog 
                  title="รูปแบบการส่งมอบ"
                  description="เพิ่มรูปแบบการส่งมอบใหม่"
                  onSave={() => console.log("Save delivery format")}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveryFormats.map((item) => (
                    <SettingItem 
                      key={item.id}
                      item={item}
                      onEdit={setEditingItem}
                      onDelete={(id: number) => console.log("Delete", id)}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Urgency Levels */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>สถานะความเร่งด่วน</CardTitle>
                  <CardDescription>จัดการระดับความเร่งด่วนของงาน</CardDescription>
                </div>
                <SettingDialog 
                  title="สถานะความเร่งด่วน"
                  description="เพิ่มระดับความเร่งด่วนใหม่"
                  onSave={() => console.log("Save urgency level")}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>คำอธิบาย</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {urgencyLevels.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={item.color}>{item.name}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.description}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KPI & Targets Tab */}
        <TabsContent value="kpi" className="space-y-4">
          {/* Sales Targets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ตั้งเป้ายอดขาย (Sales Target)</CardTitle>
                  <CardDescription>กำหนดเป้ายอดขายรายบุคคลและรายทีม</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      ตั้งเป้าใหม่
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>ตั้งเป้ายอดขาย</DialogTitle>
                      <DialogDescription>กำหนดเป้าหมายยอดขายใหม่</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="target-type">ประเภทเป้าหมาย *</Label>
                        <Select>
                          <SelectTrigger id="target-type">
                            <SelectValue placeholder="เลือกประเภท" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="individual">รายบุคคล</SelectItem>
                            <SelectItem value="team">รายทีม</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target-person">เลือกบุคคล/ทีม *</Label>
                        <Select>
                          <SelectTrigger id="target-person">
                            <SelectValue placeholder="เลือกผู้รับผิดชอบ" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="person1">สมชาย ใจดี</SelectItem>
                            <SelectItem value="person2">สมหญิง รักงาน</SelectItem>
                            <SelectItem value="team1">ทีมขาย A</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target-period">ช่วงเวลา *</Label>
                        <Select>
                          <SelectTrigger id="target-period">
                            <SelectValue placeholder="เลือกช่วงเวลา" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="monthly">รายเดือน</SelectItem>
                            <SelectItem value="quarterly">รายไตรมาส</SelectItem>
                            <SelectItem value="yearly">รายปี</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target-date">เลือกเดือน/ไตรมาส/ปี *</Label>
                        <Input id="target-date" type="month" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="target-amount">เป้ายอดขาย (บาท) *</Label>
                        <Input id="target-amount" type="number" placeholder="500000" />
                      </div>
                      <Button className="w-full">บันทึกเป้าหมาย</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>ช่วงเวลา</TableHead>
                    <TableHead>เป้าหมาย</TableHead>
                    <TableHead>ปัจจุบัน</TableHead>
                    <TableHead>ความสำเร็จ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesTargets.map((target) => (
                    <TableRow key={target.id}>
                      <TableCell className="font-medium">{target.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{target.type}</Badge>
                      </TableCell>
                      <TableCell>{target.period}</TableCell>
                      <TableCell>฿{target.target}</TableCell>
                      <TableCell>฿{target.current}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-secondary rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${target.percentage >= 100 ? 'bg-green-500' : 'bg-primary'}`}
                              style={{ width: `${Math.min(target.percentage, 100)}%` }}
                            />
                          </div>
                          <span className={`text-sm font-semibold ${target.percentage >= 100 ? 'text-green-500' : ''}`}>
                            {target.percentage}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Activity Targets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>ตั้งเป้าการติดต่อ (Activity Target)</CardTitle>
                  <CardDescription>กำหนดเป้าหมายจำนวนการโทร/การเข้าพบลูกค้า</CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      ตั้งเป้าใหม่
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>ตั้งเป้าการติดต่อ</DialogTitle>
                      <DialogDescription>กำหนดเป้าหมายการติดต่อลูกค้าใหม่</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="activity-person">เลือกบุคคล *</Label>
                        <Select>
                          <SelectTrigger id="activity-person">
                            <SelectValue placeholder="เลือกพนักงาน" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="person1">สมชาย ใจดี</SelectItem>
                            <SelectItem value="person2">สมหญิง รักงาน</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="activity-type">ประเภทกิจกรรม *</Label>
                        <Select>
                          <SelectTrigger id="activity-type">
                            <SelectValue placeholder="เลือกประเภท" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="call">โทรศัพท์</SelectItem>
                            <SelectItem value="meeting">นัดพบ</SelectItem>
                            <SelectItem value="email">อีเมล</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="activity-period">ช่วงเวลา *</Label>
                        <Select>
                          <SelectTrigger id="activity-period">
                            <SelectValue placeholder="เลือกช่วงเวลา" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">รายวัน</SelectItem>
                            <SelectItem value="weekly">รายสัปดาห์</SelectItem>
                            <SelectItem value="monthly">รายเดือน</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="activity-target">เป้าหมายจำนวน (ครั้ง) *</Label>
                        <Input id="activity-target" type="number" placeholder="10" />
                      </div>
                      <Button className="w-full">บันทึกเป้าหมาย</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>พนักงาน</TableHead>
                    <TableHead>ประเภท</TableHead>
                    <TableHead>ช่วงเวลา</TableHead>
                    <TableHead>เป้าหมาย</TableHead>
                    <TableHead>ปัจจุบัน</TableHead>
                    <TableHead>ความสำเร็จ</TableHead>
                    <TableHead className="text-right">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">สมชาย ใจดี</TableCell>
                    <TableCell>
                      <Badge variant="secondary">โทรศัพท์</Badge>
                    </TableCell>
                    <TableCell>รายสัปดาห์</TableCell>
                    <TableCell>20 ครั้ง</TableCell>
                    <TableCell>15 ครั้ง</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary rounded-full h-2">
                          <div className="h-2 rounded-full bg-primary" style={{ width: "75%" }} />
                        </div>
                        <span className="text-sm font-semibold">75%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">สมหญิง รักงาน</TableCell>
                    <TableCell>
                      <Badge variant="secondary">นัดพบ</Badge>
                    </TableCell>
                    <TableCell>รายเดือน</TableCell>
                    <TableCell>15 ครั้ง</TableCell>
                    <TableCell>18 ครั้ง</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-secondary rounded-full h-2">
                          <div className="h-2 rounded-full bg-green-500" style={{ width: "100%" }} />
                        </div>
                        <span className="text-sm font-semibold text-green-500">120%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
