import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { JobUpdateForm } from "./JobUpdateForm";

interface JobUpdateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  quotationNo?: string;
  clientName: string;
  jobType: string;
  onSubmit: (data: any) => void;
}

export function JobUpdateDrawer({
  open,
  onOpenChange,
  jobId,
  quotationNo,
  clientName,
  jobType,
  onSubmit,
}: JobUpdateDrawerProps) {
  const handleSubmit = (data: any) => {
    onSubmit(data);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>อัปเดตงาน</SheetTitle>
          <SheetDescription>
            กรอกข้อมูลการอัปเดตงาน
          </SheetDescription>
        </SheetHeader>
        
        <ScrollArea className="flex-1 px-6 py-4">
          <JobUpdateForm
            jobId={jobId}
            quotationNo={quotationNo}
            clientName={clientName}
            jobType={jobType}
            onSubmit={handleSubmit}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
