import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Upload, Link, Clock, User, ChevronDown, ChevronUp, ImageIcon, FileIcon, ZoomIn, Lock, Send, CheckCircle, XCircle, MessageSquare, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface JobUpdateFormProps {
  jobId: string;
  quotationNo?: string;
  clientName: string;
  jobType: string;
  onSubmit: (data: any) => void;
}

interface FileLog {
  id: string;
  fileName: string;
  timestamp: string;
  uploadedBy: string;
  previewUrl?: string;
  version?: number;
}

interface ArtworkFeedback {
  id: string;
  version: number;
  status: 'approved' | 'rejected';
  comment: string;
  reviewer: string;
  timestamp: string;
  artworkPreview?: string;
}

type ArtworkStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

export function JobUpdateForm({ jobId, quotationNo, clientName, jobType, onSubmit }: JobUpdateFormProps) {
  // Mock current user - ในระบบจริงจะดึงจาก auth
  const currentUser = "สมชาย ใจดี";
  // Mock role - จำลองสิทธิ์ (graphic / sales)
  const [currentRole, setCurrentRole] = useState<'graphic' | 'sales'>('graphic');

  const [formData, setFormData] = useState({
    googleDriveLink: "",
  });

  // Dropdown states
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});

  // Section 1: เริ่มวางแบบ - รูปวางแบบ
  const [layoutLogs, setLayoutLogs] = useState<FileLog[]>([]);
  const [layoutPreview, setLayoutPreview] = useState<string | null>(null);

  // Section 2: Artwork with approval workflow
  const [artworkLogs, setArtworkLogs] = useState<FileLog[]>([]);
  const [artworkPreview, setArtworkPreview] = useState<string | null>(null);
  const [artworkStatus, setArtworkStatus] = useState<ArtworkStatus>('draft');
  const [artworkVersion, setArtworkVersion] = useState(1);
  const [artworkFeedbackHistory, setArtworkFeedbackHistory] = useState<ArtworkFeedback[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showFeedbackHistory, setShowFeedbackHistory] = useState(false);

  // Section 3: ไฟล์สั่งผลิต
  const [productionArtworkLogs, setProductionArtworkLogs] = useState<FileLog[]>([]);
  const [aiFileLogs, setAiFileLogs] = useState<FileLog[]>([]);
  const [aiFilePreview, setAiFilePreview] = useState<string | null>(null);

  // Image modal state
  const [modalImage, setModalImage] = useState<string | null>(null);

  const formatTimestamp = () => {
    const now = new Date();
    return now.toLocaleString('th-TH', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const createFileLog = (file: File, previewUrl?: string, version?: number): FileLog => ({
    id: Date.now().toString(),
    fileName: file.name,
    timestamp: formatTimestamp(),
    uploadedBy: currentUser,
    previewUrl,
    version,
  });

  const toggleDropdown = (key: string) => {
    setOpenDropdowns(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLayoutImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setLayoutPreview(previewUrl);
      setLayoutLogs([createFileLog(file, previewUrl), ...layoutLogs]);
    }
    e.target.value = '';
  };

  const handleArtworkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setArtworkPreview(previewUrl);
      const newVersion = artworkStatus === 'rejected' ? artworkVersion + 1 : artworkVersion;
      if (artworkStatus === 'rejected') {
        setArtworkVersion(newVersion);
        setArtworkStatus('draft');
      }
      setArtworkLogs([createFileLog(file, previewUrl, newVersion), ...artworkLogs]);
    }
    e.target.value = '';
  };

  const handleSubmitForReview = () => {
    if (artworkLogs.length === 0) {
      toast.error("กรุณาอัพโหลดรูป Artwork ก่อนส่งตรวจ");
      return;
    }
    setArtworkStatus('pending_review');
    toast.success("ส่ง Artwork เพื่อตรวจสอบเรียบร้อย", {
      description: "รอเซลล์ตอบกลับ"
    });
  };

  const handleApproveArtwork = () => {
    const feedback: ArtworkFeedback = {
      id: Date.now().toString(),
      version: artworkVersion,
      status: 'approved',
      comment: 'อนุมัติแบบ',
      reviewer: 'สมศรี เซลล์ดี',
      timestamp: formatTimestamp(),
      artworkPreview: artworkPreview || undefined,
    };
    setArtworkFeedbackHistory([feedback, ...artworkFeedbackHistory]);
    setArtworkStatus('approved');
    toast.success("อนุมัติแบบ Artwork สำเร็จ", {
      description: "ปลดล็อคขั้นตอนถัดไปแล้ว"
    });
  };

  const handleRejectArtwork = () => {
    if (!rejectionReason.trim()) {
      toast.error("กรุณากรอกเหตุผลการแก้ไข");
      return;
    }
    const feedback: ArtworkFeedback = {
      id: Date.now().toString(),
      version: artworkVersion,
      status: 'rejected',
      comment: rejectionReason,
      reviewer: 'สมศรี เซลล์ดี',
      timestamp: formatTimestamp(),
      artworkPreview: artworkPreview || undefined,
    };
    setArtworkFeedbackHistory([feedback, ...artworkFeedbackHistory]);
    setArtworkStatus('rejected');
    setRejectionReason("");
    toast.info("ตีกลับ Artwork เพื่อแก้ไข", {
      description: "กราฟิกจะต้องอัพโหลดเวอร์ชันใหม่"
    });
  };

  const handleProductionArtworkChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProductionArtworkLogs([createFileLog(file), ...productionArtworkLogs]);
    }
    e.target.value = '';
  };

  const handleAiFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/') || file.type === 'application/pdf') {
        const previewUrl = URL.createObjectURL(file);
        setAiFilePreview(previewUrl);
        setAiFileLogs([createFileLog(file, previewUrl), ...aiFileLogs]);
      } else {
        setAiFileLogs([createFileLog(file), ...aiFileLogs]);
      }
    }
    e.target.value = '';
  };

  const handleSubmit = () => {
    const submitData = {
      ...formData,
      layoutLogs,
      artworkLogs,
      artworkStatus,
      artworkVersion,
      artworkFeedbackHistory,
      productionArtworkLogs,
      aiFileLogs,
    };
    onSubmit(submitData);
  };

  const getArtworkStatusBadge = () => {
    switch (artworkStatus) {
      case 'draft':
        return <Badge variant="secondary">ร่าง</Badge>;
      case 'pending_review':
        return <Badge className="bg-amber-500 hover:bg-amber-600">รอเซลล์ตอบกลับ</Badge>;
      case 'approved':
        return <Badge className="bg-green-500 hover:bg-green-600">แบบผ่าน</Badge>;
      case 'rejected':
        return <Badge variant="destructive">แบบไม่ผ่าน - รอแก้ไข</Badge>;
    }
  };

  // Clickable Image Preview Component
  const ClickablePreview = ({ 
    src, 
    alt, 
    placeholder 
  }: { 
    src: string | null; 
    alt: string; 
    placeholder: string;
  }) => {
    if (src) {
      return (
        <div 
          className="w-full h-40 border rounded-lg overflow-hidden bg-muted/30 cursor-pointer relative group"
          onClick={() => setModalImage(src)}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>
      );
    }
    return (
      <div className="w-full h-40 border border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
        <ImageIcon className="h-10 w-10 mb-2" />
        <span className="text-xs">{placeholder}</span>
      </div>
    );
  };

  const FileUploadWithLog = ({ 
    label, 
    inputId,
    accept = "image/*", 
    onChange, 
    logs,
    dropdownKey,
    disabled = false,
  }: { 
    label: string; 
    inputId: string;
    accept?: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
    logs: FileLog[];
    dropdownKey: string;
    disabled?: boolean;
  }) => {
    const isOpen = openDropdowns[dropdownKey] || false;
    const latestLog = logs[0];
    const olderLogs = logs.slice(1);

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">{label}</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => document.getElementById(inputId)?.click()}
            disabled={disabled}
          >
            <Upload className="h-4 w-4 mr-2" />
            เลือกไฟล์
          </Button>
          <input
            id={inputId}
            type="file"
            accept={accept}
            onChange={onChange}
            className="hidden"
            disabled={disabled}
          />
        </div>

        {/* Latest Upload - Always Visible */}
        {latestLog && (
          <div className="flex items-center gap-4 text-xs p-2 rounded bg-primary/10 border border-primary/20">
            {latestLog.version && (
              <Badge variant="outline" className="text-xs">V{latestLog.version}</Badge>
            )}
            <span className="font-medium truncate max-w-[150px]">{latestLog.fileName}</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-3 w-3" />
              {latestLog.timestamp}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <User className="h-3 w-3" />
              {latestLog.uploadedBy}
            </span>
          </div>
        )}

        {/* Older Uploads Dropdown */}
        {olderLogs.length > 0 && (
          <Collapsible open={isOpen} onOpenChange={() => toggleDropdown(dropdownKey)}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 transition-colors"
              >
                ประวัติการอัพโหลด ({olderLogs.length})
                {isOpen ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 max-h-32 overflow-y-auto space-y-1 bg-background border rounded-lg p-2 shadow-sm z-50">
                {olderLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center gap-4 text-xs p-2 rounded bg-muted/50"
                  >
                    {log.version && (
                      <Badge variant="outline" className="text-xs">V{log.version}</Badge>
                    )}
                    <span className="font-medium truncate max-w-[150px]">{log.fileName}</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {log.timestamp}
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <User className="h-3 w-3" />
                      {log.uploadedBy}
                    </span>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    );
  };

  // Check if Section 3 should be unlocked (artwork must be approved)
  const isSection3Unlocked = artworkStatus === 'approved';

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Role Toggle - Mock */}
      <div className="flex items-center justify-end gap-2 p-2 bg-muted/30 rounded-lg">
        <Label className="text-xs text-muted-foreground">จำลองสิทธิ์:</Label>
        <Button
          type="button"
          size="sm"
          variant={currentRole === 'graphic' ? 'default' : 'outline'}
          onClick={() => setCurrentRole('graphic')}
          className="h-7 text-xs"
        >
          กราฟิก
        </Button>
        <Button
          type="button"
          size="sm"
          variant={currentRole === 'sales' ? 'default' : 'outline'}
          onClick={() => setCurrentRole('sales')}
          className="h-7 text-xs"
        >
          เซลล์
        </Button>
      </div>

      {/* ข้อมูลพื้นฐาน */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
        <div>
          <Label className="text-xs text-muted-foreground">Job ID</Label>
          <p className="font-semibold">{jobId}</p>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">เลขใบเสนอราคา</Label>
          <p className="font-semibold">{quotationNo || "-"}</p>
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">ชื่อลูกค้า</Label>
          <p className="font-semibold">{clientName}</p>
        </div>
      </div>

      {/* Section 1: เริ่มวางแบบ */}
      <div className="space-y-4 p-4 border rounded-lg">
        <h3 className="font-semibold text-base border-b pb-2">1. เริ่มวางแบบ</h3>
        
        <div className="space-y-2">
          <Label className="text-sm font-medium">ลิงก์ Google Drive</Label>
          <div className="flex items-center gap-2">
            <Link className="h-4 w-4 text-muted-foreground" />
            <Input
              type="url"
              placeholder="https://drive.google.com/..."
              value={formData.googleDriveLink}
              onChange={(e) => setFormData({ ...formData, googleDriveLink: e.target.value })}
              className="flex-1"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Left: Upload Section */}
          <div>
            <FileUploadWithLog
              label="รูปวางแบบ"
              inputId="layout-file"
              accept="image/*"
              onChange={handleLayoutImageChange}
              logs={layoutLogs}
              dropdownKey="layout"
            />
          </div>
          
          {/* Right: Preview Section */}
          <div className="flex items-center justify-center">
            <ClickablePreview
              src={layoutPreview}
              alt="Layout Preview"
              placeholder="ตัวอย่างรูปวางแบบ"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Artwork with Approval Workflow */}
      <div className={cn(
        "space-y-4 p-4 border rounded-lg relative",
        layoutLogs.length === 0 && "opacity-50 pointer-events-none"
      )}>
        {layoutLogs.length === 0 && (
          <div className="absolute inset-0 bg-muted/30 rounded-lg flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-muted-foreground bg-background px-3 py-2 rounded-lg shadow-sm border">
              <Lock className="h-4 w-4" />
              <span className="text-sm">กรุณาทำขั้นตอนที่ 1 ให้เสร็จก่อน</span>
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-base">2. Artwork</h3>
            {getArtworkStatusBadge()}
            {artworkVersion > 1 && (
              <Badge variant="outline" className="text-xs">
                Version {artworkVersion}
              </Badge>
            )}
          </div>
        </div>

        {/* Rejected Status Alert */}
        {artworkStatus === 'rejected' && currentRole === 'graphic' && (
          <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
            <RotateCcw className="h-5 w-5 text-destructive mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">แบบไม่ผ่าน - กรุณาแก้ไขและอัพโหลดใหม่</p>
              {artworkFeedbackHistory[0] && (
                <p className="text-xs text-muted-foreground mt-1">
                  เหตุผล: {artworkFeedbackHistory[0].comment}
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          {/* Left: Upload Section */}
          <div className="space-y-4">
            <FileUploadWithLog
              label="แนบรูป Artwork"
              inputId="artwork-file"
              accept="image/*"
              onChange={handleArtworkUpload}
              logs={artworkLogs}
              dropdownKey="artwork"
              disabled={artworkStatus === 'pending_review' && currentRole === 'graphic'}
            />

            {/* Graphic: Submit for Review Button */}
            {currentRole === 'graphic' && artworkLogs.length > 0 && (artworkStatus === 'draft' || artworkStatus === 'rejected') && (
              <Button
                type="button"
                onClick={handleSubmitForReview}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                ส่งตรวจ
              </Button>
            )}

            {/* Sales: Approval Interface */}
            {currentRole === 'sales' && artworkStatus === 'pending_review' && (
              <div className="space-y-3 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-amber-600" />
                  <Label className="text-sm font-medium">ตรวจสอบ Artwork</Label>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={handleApproveArtwork}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    แบบผ่าน
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => {
                      if (!rejectionReason.trim()) {
                        toast.error("กรุณากรอกเหตุผลการแก้ไข");
                        return;
                      }
                      handleRejectArtwork();
                    }}
                    className="flex-1"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    แบบไม่ผ่าน
                  </Button>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">เหตุผลการแก้ไข (จำเป็นเมื่อไม่ผ่าน)</Label>
                  <Textarea
                    placeholder="กรอกเหตุผลที่ต้องแก้ไข..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="min-h-[60px] text-sm"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Right: Preview Section */}
          <div className="flex items-start justify-center">
            <ClickablePreview
              src={artworkPreview}
              alt="Artwork Preview"
              placeholder="ตัวอย่างรูป Artwork"
            />
          </div>
        </div>

        {/* Feedback History */}
        {artworkFeedbackHistory.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <Collapsible open={showFeedbackHistory} onOpenChange={setShowFeedbackHistory}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  ประวัติการตรวจสอบ ({artworkFeedbackHistory.length})
                  {showFeedbackHistory ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {artworkFeedbackHistory.map((feedback) => (
                    <div 
                      key={feedback.id}
                      className={cn(
                        "p-3 rounded-lg border text-sm",
                        feedback.status === 'approved' 
                          ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          {feedback.status === 'approved' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <span className="font-medium">
                            {feedback.status === 'approved' ? 'แบบผ่าน' : 'แบบไม่ผ่าน'}
                          </span>
                          <Badge variant="outline" className="text-xs">V{feedback.version}</Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">{feedback.timestamp}</span>
                      </div>
                      <p className="text-muted-foreground">{feedback.comment}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        ตรวจสอบโดย: {feedback.reviewer}
                      </p>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}
      </div>

      {/* Section 3: ไฟล์สั่งผลิต */}
      <div className={cn(
        "space-y-4 p-4 border rounded-lg relative",
        !isSection3Unlocked && "opacity-50 pointer-events-none"
      )}>
        {!isSection3Unlocked && (
          <div className="absolute inset-0 bg-muted/30 rounded-lg flex items-center justify-center z-10">
            <div className="flex items-center gap-2 text-muted-foreground bg-background px-3 py-2 rounded-lg shadow-sm border">
              <Lock className="h-4 w-4" />
              <span className="text-sm">รอ Artwork ผ่านการอนุมัติก่อน</span>
            </div>
          </div>
        )}
        <h3 className="font-semibold text-base border-b pb-2">3. ไฟล์สั่งผลิต</h3>
        
        {/* แนบ Artwork - ดึงจาก Section 2 อัตโนมัติ */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">แนบ Artwork (จาก Section 2)</Label>
          <div className="grid grid-cols-2 gap-4">
            {/* Left: File Info */}
            <div>
              {artworkLogs[0] ? (
                <div className="flex items-center gap-4 text-xs p-2 rounded bg-primary/10 border border-primary/20">
                  <Badge variant="outline" className="text-xs">V{artworkVersion}</Badge>
                  <span className="font-medium truncate max-w-[150px]">{artworkLogs[0].fileName}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {artworkLogs[0].timestamp}
                  </span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground p-2 border border-dashed rounded bg-muted/20">
                  ยังไม่มีไฟล์ Artwork - กรุณาอัพโหลดใน Section 2
                </div>
              )}
            </div>
            
            {/* Right: Preview */}
            <div className="flex items-center justify-center">
              {artworkPreview ? (
                <div 
                  className="w-full h-32 border rounded-lg overflow-hidden bg-muted/30 cursor-pointer relative group"
                  onClick={() => setModalImage(artworkPreview)}
                >
                  <img
                    src={artworkPreview}
                    alt="Artwork Preview"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-32 border border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-1" />
                  <span className="text-xs">รอไฟล์จาก Section 2</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* แนบไฟล์ AI */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left: Upload Section */}
          <div>
            <FileUploadWithLog
              label="แนบไฟล์ AI"
              inputId="ai-file"
              accept=".ai,.eps,.pdf,image/*"
              onChange={handleAiFileChange}
              logs={aiFileLogs}
              dropdownKey="aiFile"
            />
          </div>
          
          {/* Right: Preview Section */}
          <div className="flex items-center justify-center">
            {aiFilePreview ? (
              <div 
                className="w-full h-40 border rounded-lg overflow-hidden bg-muted/30 cursor-pointer relative group"
                onClick={() => setModalImage(aiFilePreview)}
              >
                <img
                  src={aiFilePreview}
                  alt="AI File Preview"
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
              </div>
            ) : aiFileLogs[0] ? (
              <div className="w-full h-40 border rounded-lg flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
                <FileIcon className="h-10 w-10 mb-2" />
                <span className="text-xs">ไม่สามารถแสดงตัวอย่างไฟล์ AI ได้</span>
              </div>
            ) : (
              <div className="w-full h-40 border border-dashed rounded-lg flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
                <ImageIcon className="h-10 w-10 mb-2" />
                <span className="text-xs">ตัวอย่างไฟล์ AI</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ปุ่มบันทึก */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" onClick={handleSubmit}>
          บันทึกข้อมูล
        </Button>
      </div>

      {/* Image Modal */}
      <Dialog open={!!modalImage} onOpenChange={() => setModalImage(null)}>
        <DialogContent className="max-w-4xl p-2 bg-background">
          {modalImage && (
            <img
              src={modalImage}
              alt="Full Preview"
              className="w-full h-auto max-h-[85vh] object-contain rounded"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
