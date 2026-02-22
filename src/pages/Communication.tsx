import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MessageSquare,
  Users,
  Megaphone,
  FileText,
  Send,
  Plus,
  Search,
  Pin,
  Bell,
  Clock,
  Download,
  Upload,
  Hash
} from "lucide-react";

export default function Communication() {
  const [activeTab, setActiveTab] = useState("channels");
  const [selectedChannel, setSelectedChannel] = useState("general");
  const [newMessage, setNewMessage] = useState("");

  const departments = [
    { id: "general", name: "ช่องทั่วไป", icon: Hash, members: 12, color: "bg-primary" },
    { id: "sales", name: "ฝ่ายขาย", icon: MessageSquare, members: 4, color: "bg-success" },
    { id: "design", name: "ฝ่ายกราฟิก", icon: MessageSquare, members: 3, color: "bg-warning" },
    { id: "production", name: "ฝ่ายผลิต", icon: MessageSquare, members: 6, color: "bg-info" },
    { id: "procurement", name: "ฝ่ายจัดซื้อ", icon: MessageSquare, members: 2, color: "bg-accent" },
    { id: "accounting", name: "ฝ่ายบัญชี", icon: MessageSquare, members: 3, color: "bg-secondary" },
    { id: "hr", name: "ฝ่ายบุคคล", icon: MessageSquare, members: 2, color: "bg-muted" },
  ];

  const messages = [
    {
      id: 1,
      user: "สมชาย ใจดี",
      avatar: "SC",
      message: "สวัสดีครับทุกคน ขอประกาศว่าเราได้ออเดอร์ใหญ่เข้ามาแล้ว",
      time: "10:30",
      isSystem: false,
    },
    {
      id: 2,
      user: "ระบบแจ้งเตือน",
      avatar: "SYS",
      message: "🔔 ออเดอร์ #ORD-2024-001 ได้รับการอนุมัติแล้ว - ฝ่ายกราฟิกสามารถเริ่มงานได้",
      time: "10:32",
      isSystem: true,
    },
    {
      id: 3,
      user: "นางสาวใจ ใส",
      avatar: "NI",
      message: "รับทราบครับ จะเริ่มออกแบบทันที",
      time: "10:35",
      isSystem: false,
    },
  ];

  const announcements = [
    {
      id: 1,
      title: "ประกาศวันหยุดประจำปี 2024",
      content: "บริษัทจะหยุดทำการในวันสำคัญของชาติตามปฏิทินที่กำหนด",
      author: "ฝ่ายบุคคล",
      date: "2024-01-15",
      isPinned: true,
    },
    {
      id: 2,
      title: "นโยบายใหม่เรื่องการทำงานล่วงเวลา",
      content: "มีการปรับปรุงนโยบายการทำงานล่วงเวลาใหม่",
      author: "ผู้จัดการทั่วไป",
      date: "2024-01-14",
      isPinned: false,
    },
  ];

  const files = [
    {
      id: 1,
      name: "คู่มือการใช้งานระบบ_v2.pdf",
      size: "2.4 MB",
      uploadedBy: "ฝ่าย IT",
      uploadDate: "2024-01-15",
      type: "pdf",
    },
    {
      id: 2,
      name: "รายละเอียดสินค้าใหม่_2024.xlsx",
      size: "1.1 MB",
      uploadedBy: "ฝ่ายขาย",
      uploadDate: "2024-01-14",
      type: "excel",
    },
  ];

  const notifications = [
    {
      id: 1,
      message: "ฝ่ายกราฟิกส่งงานออกแบบเสร็จแล้ว - ออเดอร์ #ORD-001",
      time: "5 นาทีที่แล้ว",
      type: "success",
    },
    {
      id: 2,
      message: "งานใกล้เลยกำหนด - ออเดอร์ #ORD-002 (เหลือ 2 วัน)",
      time: "15 นาทีที่แล้ว",
      type: "warning",
    },
    {
      id: 3,
      message: "คำขอเบิกวัตถุดิบใหม่รอการอนุมัติ",
      time: "30 นาทีที่แล้ว",
      type: "info",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">การสื่อสารภายในองค์กร</h1>
            <p className="text-muted-foreground">ระบบสื่อสารและแชร์ข้อมูลระหว่างแผนกต่างๆ</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="channels" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            ช่องสื่อสาร
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            การแจ้งเตือน
          </TabsTrigger>
          <TabsTrigger value="announcements" className="gap-2">
            <Megaphone className="w-4 h-4" />
            ประกาศ
          </TabsTrigger>
          <TabsTrigger value="files" className="gap-2">
            <FileText className="w-4 h-4" />
            ไฟล์แชร์
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channels" className="space-y-4">
          <div className="grid grid-cols-12 gap-6">
            {/* Channel List */}
            <div className="col-span-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    ช่องสื่อสาร
                  </CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input placeholder="ค้นหาช่อง..." className="pl-10" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    {departments.map((dept) => (
                      <div
                        key={dept.id}
                        className={`flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors ${
                          selectedChannel === dept.id ? "bg-accent" : ""
                        }`}
                        onClick={() => setSelectedChannel(dept.id)}
                      >
                        <div className={`w-3 h-3 rounded-full ${dept.color}`} />
                        <dept.icon className="w-4 h-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{dept.name}</p>
                          <p className="text-xs text-muted-foreground">{dept.members} สมาชิก</p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="col-span-9">
              <Card className="h-[500px] flex flex-col">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <CardTitle className="text-lg">
                      {departments.find(d => d.id === selectedChannel)?.name}
                    </CardTitle>
                    <Badge variant="secondary">
                      {departments.find(d => d.id === selectedChannel)?.members} สมาชิก
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id} className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className={message.isSystem ? "bg-muted" : "bg-primary"}>
                              {message.avatar}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{message.user}</span>
                              <span className="text-xs text-muted-foreground">{message.time}</span>
                            </div>
                            <p className="text-sm">{message.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  
                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="พิมพ์ข้อความ..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button className="gap-2">
                        <Send className="w-4 h-4" />
                        ส่ง
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                การแจ้งเตือนอัตโนมัติ
              </CardTitle>
              <CardDescription>
                แจ้งเตือนเมื่อมีการเปลี่ยนแปลงสถานะงานและกิจกรรมสำคัญในระบบ
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3 p-4 rounded-lg border">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      notification.type === 'success' ? 'bg-success' :
                      notification.type === 'warning' ? 'bg-warning' : 'bg-info'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm">{notification.message}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">ประกาศทั่วไป</h2>
              <p className="text-muted-foreground">ข่าวสารและประกาศสำคัญจากผู้บริหาร</p>
            </div>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              เพิ่มประกาศ
            </Button>
          </div>
          
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {announcement.isPinned && <Pin className="w-4 h-4 text-primary" />}
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                      </div>
                      <CardDescription>{announcement.content}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>โดย {announcement.author}</span>
                    <span>{announcement.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="files" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold">ไฟล์แชร์</h2>
              <p className="text-muted-foreground">คลังเอกสารและไฟล์สำคัญของบริษัท</p>
            </div>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              อัปโหลดไฟล์
            </Button>
          </div>
          
          <div className="grid gap-4">
            {files.map((file) => (
              <Card key={file.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <h3 className="font-medium">{file.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {file.size} • อัปโหลดโดย {file.uploadedBy} • {file.uploadDate}
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Download className="w-4 h-4" />
                      ดาวน์โหลด
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}