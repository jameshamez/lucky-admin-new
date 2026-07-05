import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2,
  XCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Clock,
  AlertTriangle,
  MessageSquare,
  Loader2
} from "lucide-react";
import artworkSample from "@/assets/artwork-sample.png";
import { toast } from "sonner";
import { qcApprovalService, QCApproval, QCApprovalsByStep, QCDepartment } from "@/services/qcApprovalService";
import { useAuth } from "@/contexts/AuthContext";

interface QCStep {
  key: string;
  label: string;
  factoryPhoto: string;
  approvals: QCApproval[];
  isCompleted: boolean;
  isActive: boolean;
  isLocked: boolean;
  hasFailed: boolean;
}

interface QCVerificationCardsProps {
  orderId: string;
  userRole: "เซลล์" | "จัดซื้อ";
}

const STEP_DEFINITIONS = [
  { key: "artwork", label: "ตรวจสอบ Artwork" },
  { key: "cnc", label: "ตรวจสอบงาน CNC" },
  { key: "stamping", label: "ปั้มชิ้นงาน" },
  { key: "lanyard", label: "ตรวจสอบสายคล้อง" },
  { key: "final", label: "ตรวจสอบชิ้นงานก่อนจัดส่ง" },
];
const STEP_KEYS = STEP_DEFINITIONS.map(s => s.key);

export default function QCVerificationCards({ orderId, userRole }: QCVerificationCardsProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [approvalsByStep, setApprovalsByStep] = useState<QCApprovalsByStep>({});

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await qcApprovalService.getApprovals(orderId, STEP_KEYS);
      if (res.status === "success") setApprovalsByStep(res.data);
    } catch (error) {
      toast.error("ไม่สามารถโหลดข้อมูลการตรวจสอบคุณภาพได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, [orderId]);

  // Sequential unlock: a step only unlocks once the previous step is fully passed by both departments
  const qcSteps: QCStep[] = useMemo(() => {
    let previousPassed = true;
    return STEP_DEFINITIONS.map((def) => {
      const approvals = approvalsByStep[def.key] || [];
      const hasFailed = approvals.some(a => a.status === "failed");
      const isCompleted = approvals.length > 0 && approvals.every(a => a.status === "passed");
      const isLocked = !previousPassed;
      const isActive = !isLocked && !isCompleted;
      previousPassed = isCompleted;
      return { key: def.key, label: def.label, factoryPhoto: artworkSample, approvals, isCompleted, isActive, isLocked, hasFailed };
    });
  }, [approvalsByStep]);

  const [expandedCards, setExpandedCards] = useState<string[]>(STEP_KEYS);
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [showFailModal, setShowFailModal] = useState(false);
  const [failComment, setFailComment] = useState("");
  const [currentFailStep, setCurrentFailStep] = useState<string | null>(null);
  const [currentFailDept, setCurrentFailDept] = useState<QCDepartment | null>(null);
  const [submittingFail, setSubmittingFail] = useState(false);

  const toggleCard = (key: string) => {
    setExpandedCards(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleOpenLightbox = (image: string) => {
    setLightboxImage(image);
    setShowLightbox(true);
  };

  const handlePass = async (stepKey: string, dept: QCDepartment) => {
    const res = await qcApprovalService.updateApproval({
      orderId, stepKey, department: dept, status: "passed", approvedBy: user?.full_name,
    });
    if (res.status === "success") {
      fetchApprovals();
    } else {
      toast.error(res.message || "บันทึกไม่สำเร็จ");
    }
  };

  const handleFail = (stepKey: string, dept: QCDepartment) => {
    setCurrentFailStep(stepKey);
    setCurrentFailDept(dept);
    setShowFailModal(true);
  };

  const confirmFail = async () => {
    if (!currentFailStep || !currentFailDept) return;
    setSubmittingFail(true);
    try {
      const res = await qcApprovalService.updateApproval({
        orderId, stepKey: currentFailStep, department: currentFailDept, status: "failed",
        comment: failComment, approvedBy: user?.full_name,
      });
      if (res.status === "success") {
        setShowFailModal(false);
        setFailComment("");
        setCurrentFailStep(null);
        setCurrentFailDept(null);
        fetchApprovals();
      } else {
        toast.error(res.message || "บันทึกไม่สำเร็จ");
      }
    } finally {
      setSubmittingFail(false);
    }
  };

  const getStepStatus = (step: QCStep) => {
    if (step.hasFailed) return "failed";
    if (step.isCompleted) return "completed";
    if (step.isActive) return "active";
    if (step.isLocked) return "locked";
    return "pending";
  };

  const getCardStyles = (step: QCStep) => {
    const status = getStepStatus(step);
    switch (status) {
      case "completed":
        return "border-green-300 bg-green-50/50";
      case "failed":
        return "border-red-300 bg-red-50/50";
      case "active":
        return "border-primary bg-card shadow-md";
      case "locked":
        return "border-muted bg-muted/30 opacity-60";
      default:
        return "border-muted bg-card";
    }
  };

  const getStatusBadge = (step: QCStep) => {
    const status = getStepStatus(step);
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 text-white">ผ่านทั้ง 2 แผนก</Badge>;
      case "failed":
        return <Badge className="bg-red-500 text-white">รอแก้ไข</Badge>;
      case "active":
        return <Badge className="bg-primary text-primary-foreground">กำลังดำเนินการ</Badge>;
      case "locked":
        return <Badge variant="secondary" className="text-muted-foreground"><Lock className="w-3 h-3 mr-1" />รอขั้นตอนก่อนหน้า</Badge>;
      default:
        return <Badge variant="secondary">รอดำเนินการ</Badge>;
    }
  };

  const getApprovalStatusBadge = (approval: QCApproval) => {
    switch (approval.status) {
      case "passed":
        return <Badge className="bg-green-100 text-green-700">ผ่าน</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-700">ไม่ผ่าน</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-700">รอตรวจสอบ</Badge>;
    }
  };

  const canUserAction = (dept: QCDepartment) => {
    return userRole === dept;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            การผลิต และการตรวจสอบคุณภาพงาน
          </h2>
          <p className="text-sm text-muted-foreground">คุณกำลังดูในฐานะ: <Badge variant="outline" className="ml-1">แผนก{userRole}</Badge></p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <CheckCircle2 className="w-3 h-3 mr-1 text-green-500" />
            {qcSteps.filter(s => s.isCompleted).length}/{qcSteps.length} ขั้นตอน
          </Badge>
        </div>
      </div>

      {/* Vertical Cards */}
      <div className="space-y-4">
        {qcSteps.map((step, idx) => {
          const isExpanded = expandedCards.includes(step.key);
          const status = getStepStatus(step);
          const isLocked = status === "locked";
          const isCompleted = status === "completed";

          return (
            <Card
              key={step.key}
              className={`transition-all duration-300 ${getCardStyles(step)}`}
            >
              <CardHeader
                className={`pb-2 cursor-pointer select-none ${isLocked ? 'cursor-not-allowed' : ''}`}
                onClick={() => !isLocked && toggleCard(step.key)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      isCompleted ? 'bg-green-500 text-white' :
                      status === "failed" ? 'bg-red-500 text-white' :
                      status === "active" ? 'bg-primary text-primary-foreground' :
                      'bg-muted text-muted-foreground'
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4 h-4" /> :
                       status === "failed" ? <XCircle className="w-4 h-4" /> :
                       idx + 1}
                    </div>
                    <CardTitle className={`text-base ${isLocked ? 'text-muted-foreground' : ''}`}>
                      {step.label}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(step)}
                    {!isLocked && (
                      isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Collapsed view for completed cards */}
              {isCompleted && !isExpanded && (
                <CardContent className="pt-0 pb-3">
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>ผ่านการตรวจสอบจากทั้ง 2 แผนกเรียบร้อย</span>
                  </div>
                </CardContent>
              )}

              {/* Expanded view */}
              {isExpanded && !isLocked && (
                <CardContent className="space-y-4">
                  {/* Factory Photo */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">รูปภาพจากโรงงาน</p>
                    <div
                      className="relative w-full max-w-xs h-32 bg-muted rounded-lg overflow-hidden cursor-pointer group"
                      onClick={() => handleOpenLightbox(step.factoryPhoto)}
                    >
                      <img
                        src={step.factoryPhoto}
                        alt={`${step.label} photo`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-white" />
                        <span className="text-white text-sm ml-2">คลิกเพื่อขยาย</span>
                      </div>
                    </div>
                  </div>

                  {/* Department Approvals */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground font-medium">สถานะการตรวจสอบ</p>

                    {step.approvals.map((approval, aIdx) => (
                      <div
                        key={aIdx}
                        className={`p-3 rounded-lg border ${
                          approval.status === "passed" ? 'bg-green-50 border-green-200' :
                          approval.status === "failed" ? 'bg-red-50 border-red-200' :
                          'bg-muted/30 border-muted'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              approval.status === "passed" ? 'bg-green-100' :
                              approval.status === "failed" ? 'bg-red-100' :
                              'bg-amber-100'
                            }`}>
                              {approval.status === "passed" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> :
                               approval.status === "failed" ? <XCircle className="w-4 h-4 text-red-600" /> :
                               <Clock className="w-4 h-4 text-amber-600" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">แผนก{approval.department}</p>
                              {approval.approvedBy ? (
                                <p className="text-xs text-muted-foreground">
                                  {approval.approvedAt} • {approval.approvedBy}
                                </p>
                              ) : (
                                <p className="text-xs text-amber-600">รอตรวจสอบ</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Show action buttons only for user's own department and when pending */}
                            {canUserAction(approval.department) && approval.status === "pending" && !step.isLocked ? (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600 text-white h-8"
                                  onClick={(e) => { e.stopPropagation(); handlePass(step.key, approval.department); }}
                                >
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  ผ่าน
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8"
                                  onClick={(e) => { e.stopPropagation(); handleFail(step.key, approval.department); }}
                                >
                                  <XCircle className="w-3 h-3 mr-1" />
                                  ไม่ผ่าน
                                </Button>
                              </>
                            ) : (
                              getApprovalStatusBadge(approval)
                            )}
                          </div>
                        </div>

                        {/* Show comment if failed */}
                        {approval.status === "failed" && approval.comment && (
                          <div className="mt-2 p-2 bg-red-100 rounded text-sm">
                            <div className="flex items-start gap-2">
                              <MessageSquare className="w-4 h-4 text-red-600 mt-0.5" />
                              <div>
                                <p className="font-medium text-red-700">หมายเหตุ:</p>
                                <p className="text-red-600">{approval.comment}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Warning for failed status */}
                  {step.hasFailed && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-700">ต้องแก้ไข</p>
                        <p className="text-sm text-red-600">กรุณาติดต่อโรงงานเพื่อแก้ไขปัญหาที่พบ</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}

              {/* Locked view */}
              {isLocked && (
                <CardContent className="pt-0 pb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4" />
                    <span>รอให้ขั้นตอนก่อนหน้าผ่านการตรวจสอบจากทั้ง 2 แผนกก่อน</span>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-4xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>ขยายรูปภาพจากโรงงาน</DialogTitle>
          </DialogHeader>
          <img
            src={lightboxImage}
            alt="รูปภาพขยาย"
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
          />
        </DialogContent>
      </Dialog>

      {/* Fail Comment Modal */}
      <Dialog open={showFailModal} onOpenChange={setShowFailModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              ระบุจุดที่ต้องแก้ไข
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              กรุณาระบุรายละเอียดจุดที่ต้องให้โรงงานแก้ไข เพื่อแจ้งให้อีกแผนกและโรงงานทราบ
            </p>
            <Textarea
              placeholder="เช่น: สีไม่ตรงตามตัวอย่าง, ขนาดไม่ถูกต้อง, มีรอยขีดข่วน..."
              value={failComment}
              onChange={(e) => setFailComment(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFailModal(false)}>
              ยกเลิก
            </Button>
            <Button
              variant="destructive"
              onClick={confirmFail}
              disabled={!failComment.trim() || submittingFail}
            >
              {submittingFail ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              ยืนยันไม่ผ่าน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
