import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Plus,
  MessageCircle,
  FileImage,
  Download,
  Upload,
  Clock,
  CheckCircle,
  Users,
  Play,
  Send
} from "lucide-react";

const jobs = [
  {
    id: "DES001",
    customer: "บริษัท เอบีซี จำกัด",
    project: "ถ้วยรางวัลทอง 50 ใบ",
    orderDate: "2024-01-10",
    dueDate: "2024-01-20",
    status: "new",
    priority: "สูง",
    files: ["design-brief.pdf"],
    messages: []
  },
  {
    id: "DES002",
    customer: "โรงเรียนสายรุ้ง",
    project: "เหรียญรางวัล 100 เหรียญ",
    orderDate: "2024-01-08",
    dueDate: "2024-01-18",
    status: "inProgress",
    priority: "กลาง",
    files: ["logo.png", "requirements.doc"],
    messages: [
      { from: "ฝ่ายขาย", message: "ลูกค้าต้องการเปลี่ยนสีจากทองเป็นเงิน", time: "10:30" }
    ]
  },
  {
    id: "DES003",
    customer: "สมาคมนักกีฬา",
    project: "ถ้วยคริสตัล 20 ใบ",
    orderDate: "2024-01-05",
    dueDate: "2024-01-15",
    status: "clientReview",
    priority: "สูง",
    files: ["draft-v1.ai", "draft-v2.ai"],
    messages: [
      { from: "ฝ่ายกราฟิก", message: "ส่งแบบ draft แรกให้ลูกค้าดูแล้ว", time: "14:00" },
      { from: "ฝ่ายขาย", message: "ลูกค้าขอแก้ไขฟอนต์ให้ใหญ่ขึ้น", time: "16:30" }
    ]
  }
];

const statusConfig = {
  new: {
    label: "งานใหม่",
    color: "bg-red-500",
    icon: Plus,
    nextAction: "รับงาน"
  },
  inProgress: {
    label: "กำลังดำเนินการ",
    color: "bg-blue-500", 
    icon: Play,
    nextAction: "ส่งให้ลูกค้าดู"
  },
  clientReview: {
    label: "รอ Feedback",
    color: "bg-amber-500",
    icon: Users,
    nextAction: "อนุมัติแล้ว"
  },
  approved: {
    label: "อนุมัติแล้ว",
    color: "bg-green-500",
    icon: CheckCircle,
    nextAction: "ส่งฝ่ายผลิต"
  },
  production: {
    label: "ส่งผลิตแล้ว",
    color: "bg-purple-500",
    icon: CheckCircle,
    nextAction: "เสร็จสิ้น"
  }
};

export default function JobManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.project.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    const IconComponent = config.icon;
    
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleStatusChange = (jobId: string, newStatus: string) => {
    // In real app, this would update the job status in the database
    console.log(`Updating job ${jobId} to status ${newStatus}`);
  };

  const sendMessage = () => {
    if (newMessage.trim() && selectedJob) {
      // In real app, this would send the message
      console.log(`Sending message for job ${selectedJob.id}: ${newMessage}`);
      setNewMessage("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">จัดการงานออกแบบ</h1>
          <p className="text-muted-foreground">รับงาน ติดตาม และสื่อสารกับทีมขาย</p>
        </div>
        <Button className="bg-primary hover:bg-primary-hover">
          <Plus className="w-4 h-4 mr-2" />
          เปิดงานใหม่
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="ค้นหางาน (รหัส, ลูกค้า, โปรเจค)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="กรองตามสถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="new">งานใหม่</SelectItem>
                <SelectItem value="inProgress">กำลังดำเนินการ</SelectItem>
                <SelectItem value="clientReview">รอ Feedback</SelectItem>
                <SelectItem value="approved">อนุมัติแล้ว</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Cards */}
          <div className="space-y-3">
            {filteredJobs.map((job) => (
              <Card 
                key={job.id}
                className={`cursor-pointer transition-all hover:shadow-medium ${
                  selectedJob?.id === job.id ? 'border-primary shadow-medium' : ''
                }`}
                onClick={() => setSelectedJob(job)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/design/jobs/${job.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-blue-600 hover:underline hover:text-blue-800 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {job.id}
                        </a>
                        {getStatusBadge(job.status)}
                        <Badge 
                          variant={job.priority === "สูง" ? "destructive" : "secondary"}
                          className="text-xs"
                        >
                          {job.priority}
                        </Badge>
                      </div>
                      <p className="font-medium">{job.customer}</p>
                      <p className="text-sm text-muted-foreground">{job.project}</p>
                    </div>
                    
                    <div className="text-right text-sm">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>ส่ง: {job.dueDate}</span>
                      </div>
                    </div>
                  </div>

                  {job.status === "new" && (
                    <Button 
                      className="w-full bg-red-600 hover:bg-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusChange(job.id, "inProgress");
                      }}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      รับงาน
                    </Button>
                  )}

                  {job.status !== "new" && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          const currentStatus = job.status;
                          const nextStatus = currentStatus === "inProgress" ? "clientReview" :
                                           currentStatus === "clientReview" ? "approved" :
                                           currentStatus === "approved" ? "production" : currentStatus;
                          handleStatusChange(job.id, nextStatus);
                        }}
                      >
                        {statusConfig[job.status as keyof typeof statusConfig].nextAction}
                      </Button>
                      
                      {job.messages.length > 0 && (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {job.messages.length}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Job Detail */}
        <div className="space-y-4">
          {selectedJob ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileImage className="w-5 h-5 text-primary" />
                    รายละเอียดงาน
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedJob.id}</h3>
                    {getStatusBadge(selectedJob.status)}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">ลูกค้า:</span>
                      <p>{selectedJob.customer}</p>
                    </div>
                    <div>
                      <span className="font-medium">โปรเจค:</span>
                      <p>{selectedJob.project}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="font-medium">วันที่สั่ง:</span>
                        <p>{selectedJob.orderDate}</p>
                      </div>
                      <div>
                        <span className="font-medium">กำหนดส่ง:</span>
                        <p className="text-red-600">{selectedJob.dueDate}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="font-medium text-sm">ไฟล์แนบ:</span>
                    <div className="mt-2 space-y-1">
                      {selectedJob.files.map((file: string, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <span>{file}</span>
                          <Button variant="ghost" size="sm">
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    อัปโหลดไฟล์ผลงาน
                  </Button>
                </CardContent>
              </Card>

              {/* Communication */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-primary" />
                    การสื่อสาร
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedJob.messages.map((msg: any, index: number) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{msg.from}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p>{msg.message}</p>
                      </div>
                    ))}
                    {selectedJob.messages.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        ยังไม่มีข้อความ
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="พิมพ์ข้อความ..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <Button 
                    onClick={sendMessage}
                    className="w-full bg-primary hover:bg-primary-hover"
                    disabled={!newMessage.trim()}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    ส่งข้อความ
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <FileImage className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">เลือกงานเพื่อดูรายละเอียด</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}