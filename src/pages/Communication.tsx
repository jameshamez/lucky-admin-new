import { useState, useEffect, useCallback, useRef } from "react";
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
  Hash,
  Loader2
} from "lucide-react";
import { communicationService } from "@/services/communicationService";
import { toast } from "sonner";

const IconMap: Record<string, any> = {
  Hash: Hash,
  MessageSquare: MessageSquare,
  Megaphone: Megaphone,
  FileText: FileText,
};

export default function Communication() {
  const [activeTab, setActiveTab] = useState("channels");
  const [selectedChannel, setSelectedChannel] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  const [channels, setChannels] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);

  const [loading, setLoading] = useState({
    channels: true,
    messages: false,
    announcements: true,
    notifications: true,
    files: true
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchChannels = useCallback(async () => {
    setLoading(prev => ({ ...prev, channels: true }));
    try {
      const res = await communicationService.getChannels();
      if (res.status === "success") {
        setChannels(res.data);
        if (res.data.length > 0 && !selectedChannel) {
          setSelectedChannel(res.data[0]);
        }
      }
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลช่องสื่อสารได้");
    } finally {
      setLoading(prev => ({ ...prev, channels: false }));
    }
  }, [selectedChannel]);

  const fetchMessages = useCallback(async (channelId: number) => {
    setLoading(prev => ({ ...prev, messages: true }));
    try {
      const res = await communicationService.getMessages(channelId);
      if (res.status === "success") {
        setMessages(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, messages: false }));
    }
  }, []);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(prev => ({ ...prev, announcements: true }));
    try {
      const res = await communicationService.getAnnouncements();
      if (res.status === "success") setAnnouncements(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, announcements: false }));
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(prev => ({ ...prev, notifications: true }));
    try {
      const res = await communicationService.getNotifications();
      if (res.status === "success") setNotifications(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, notifications: false }));
    }
  }, []);

  const fetchFiles = useCallback(async () => {
    setLoading(prev => ({ ...prev, files: true }));
    try {
      const res = await communicationService.getFiles();
      if (res.status === "success") setFiles(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, files: false }));
    }
  }, []);

  useEffect(() => {
    fetchChannels();
    fetchAnnouncements();
    fetchNotifications();
    fetchFiles();
  }, []);

  useEffect(() => {
    if (selectedChannel) {
      fetchMessages(selectedChannel.id);
      // Auto-refresh messages every 10 seconds
      const interval = setInterval(() => fetchMessages(selectedChannel.id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedChannel, fetchMessages]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      const scrollArea = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChannel || sending) return;

    setSending(true);
    try {
      const res = await communicationService.sendMessage({
        channel_id: selectedChannel.id,
        message: newMessage,
        user_name: "Admin User", // Should be from auth context
        avatar_fallback: "AD"
      });

      if (res.status === "success") {
        setNewMessage("");
        fetchMessages(selectedChannel.id);
      } else {
        toast.error("ส่งข้อความล้มเหลว");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการส่งข้อความ");
    } finally {
      setSending(false);
    }
  };

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
                    {loading.channels ? (
                      <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                      channels.map((dept) => {
                        const Icon = IconMap[dept.icon] || Hash;
                        return (
                          <div
                            key={dept.id}
                            className={`flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors ${selectedChannel?.id === dept.id ? "bg-accent" : ""
                              }`}
                            onClick={() => setSelectedChannel(dept)}
                          >
                            <div className={`w-3 h-3 rounded-full ${dept.color}`} />
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{dept.name}</p>
                              <p className="text-xs text-muted-foreground">{dept.members} สมาชิก</p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Chat Area */}
            <div className="col-span-9">
              <Card className="h-[500px] flex flex-col">
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedChannel?.color || 'bg-primary'}`} />
                    <CardTitle className="text-lg">
                      {selectedChannel?.name || "เลือกช่องสื่อสาร"}
                    </CardTitle>
                    {selectedChannel && (
                      <Badge variant="secondary">
                        {selectedChannel.members} สมาชิก
                      </Badge>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col p-0">
                  <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    {loading.messages && messages.length === 0 ? (
                      <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                    ) : (
                      <div className="space-y-4">
                        {messages.length === 0 && !loading.messages && (
                          <p className="text-center text-muted-foreground py-8">ไม่มีข้อความในช่องนี้</p>
                        )}
                        {messages.map((message) => (
                          <div key={message.id} className="flex items-start gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className={message.is_system ? "bg-muted" : "bg-primary"}>
                                {message.avatar_fallback || message.user_name?.substring(0, 2) || "??"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-sm font-medium ${message.is_system ? 'text-primary' : ''}`}>
                                  {message.user_name}
                                </span>
                                <span className="text-xs text-muted-foreground">{message.time}</span>
                              </div>
                              <p className="text-sm">{message.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="p-4 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="พิมพ์ข้อความ..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        className="flex-1"
                        disabled={!selectedChannel || sending}
                      />
                      <Button onClick={handleSendMessage} disabled={!selectedChannel || sending || !newMessage.trim()} className="gap-2">
                        {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
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
              {loading.notifications ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <div className="space-y-4">
                  {notifications.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">ไม่มีการแจ้งเตือน</p>
                  )}
                  {notifications.map((notification) => (
                    <div key={notification.id} className="flex items-start gap-3 p-4 rounded-lg border">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notification.type === 'success' ? 'bg-success' :
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
              )}
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
            {loading.announcements ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
              announcements.map((announcement) => (
                <Card key={announcement.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {announcement.is_pinned === "1" && <Pin className="w-4 h-4 text-primary" />}
                          <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        </div>
                        <CardDescription>{announcement.content}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>โดย {announcement.author_name}</span>
                      <span>{announcement.date}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            {!loading.announcements && announcements.length === 0 && (
              <p className="text-center text-muted-foreground py-8">ไม่มีประกาศในขณะนี้</p>
            )}
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
            {loading.files ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
              files.map((file) => (
                <Card key={file.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileText className="w-8 h-8 text-primary" />
                        <div>
                          <h3 className="font-medium">{file.file_name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {file.file_size} • อัปโหลดโดย {file.uploader_name} • {file.uploadDate}
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
              ))
            )}
            {!loading.files && files.length === 0 && (
              <p className="text-center text-muted-foreground py-8">ไม่มีไฟล์ที่แชร์ในขณะนี้</p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}