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
  productTypeDisplay?: string;
  initialData?: any;
  onSubmit: (data: any) => void;
}

export function JobUpdateDrawer({
  open,
  onOpenChange,
  jobId,
  quotationNo,
  clientName,
  productTypeDisplay,
  initialData,
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
            productTypeDisplay={productTypeDisplay}
            initialData={initialData}
            onSubmit={handleSubmit}
          />
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
