import { useState } from "react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

interface StepProgress {
  key: string;
  title: string;
  status: "pending" | "in_progress" | "issue" | "complete" | "skipped";
}

interface CircularProgressProps {
  percentage: number;
  steps: StepProgress[];
  size?: number;
}

export function CircularProgress({ percentage, steps, size = 56 }: CircularProgressProps) {
  const [isOpen, setIsOpen] = useState(false);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  const completedSteps = steps.filter(s => s.status === "complete").length;
  const skippedSteps = steps.filter(s => s.status === "skipped").length;
  const issueSteps = steps.filter(s => s.status === "issue").length;
  const totalActiveSteps = steps.length - skippedSteps;

  const getStatusIcon = (status: StepProgress["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="w-3.5 h-3.5 text-green-600" />;
      case "issue":
        return <AlertCircle className="w-3.5 h-3.5 text-red-600" />;
      case "in_progress":
        return <Clock className="w-3.5 h-3.5 text-yellow-600" />;
      case "skipped":
        return <span className="w-3.5 h-3.5 text-muted-foreground text-center">—</span>;
      default:
        return <Clock className="w-3.5 h-3.5 text-muted-foreground" />;
    }
  };

  const getStatusLabel = (status: StepProgress["status"]) => {
    switch (status) {
      case "complete": return "เสร็จสิ้น";
      case "issue": return "มีปัญหา";
      case "in_progress": return "กำลังทำ";
      case "skipped": return "ข้าม";
      default: return "รอ";
    }
  };

  return (
    <HoverCard open={isOpen} onOpenChange={setIsOpen}>
      <HoverCardTrigger asChild>
        <button 
          className="relative cursor-pointer hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="ดูความคืบหน้า"
        >
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-muted"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-500 ${
                issueSteps > 0 ? "text-destructive" : "text-primary"
              }`}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${issueSteps > 0 ? "text-destructive" : "text-primary"}`}>
              {percentage}%
            </span>
          </div>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 p-4" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">รายละเอียดความคืบหน้า</h4>
            <span className="text-xs text-muted-foreground">
              {completedSteps}/{totalActiveSteps} ขั้นตอน
            </span>
          </div>
          <div className="space-y-2">
            {steps.map((step, index) => (
              <div 
                key={step.key}
                className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                  step.status === "complete" ? "bg-green-50" :
                  step.status === "issue" ? "bg-red-50" :
                  step.status === "in_progress" ? "bg-yellow-50" :
                  step.status === "skipped" ? "bg-muted/30 opacity-50" :
                  "bg-muted/20"
                }`}
              >
                <span className="w-5 h-5 flex items-center justify-center text-xs font-semibold bg-background rounded-full border">
                  {index + 1}
                </span>
                {getStatusIcon(step.status)}
                <span className={`flex-1 ${step.status === "skipped" ? "line-through" : ""}`}>
                  {step.title}
                </span>
                <span className={`text-xs ${
                  step.status === "complete" ? "text-green-600" :
                  step.status === "issue" ? "text-red-600" :
                  step.status === "in_progress" ? "text-yellow-600" :
                  "text-muted-foreground"
                }`}>
                  {getStatusLabel(step.status)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
