import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Upload, CheckCircle, FileText, Briefcase } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
   type: "resume" | "jobDescription";
   onUpload: (content: string, file?: File) => void;
   isUploaded: boolean;
}

export function FileUpload({ type, onUpload, isUploaded }: FileUploadProps) {
   const [isDragOver, setIsDragOver] = useState(false);
   const [textContent, setTextContent] = useState("");
   const [uploadMethod, setUploadMethod] = useState<"file" | "text">(type === "resume" ? "file" : "text");

   const handleFileUpload = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
         const content = e.target?.result as string;
         onUpload(content, file);
      };
      reader.readAsText(file);
   };

   const handleTextSubmit = () => {
      if (textContent.trim()) {
         onUpload(textContent);
      }
   };

   const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const file = files[0];

      if (file && (file.type === "application/pdf" || file.type.includes("document") || file.type === "text/plain")) {
         handleFileUpload(file);
      }
   }, []);

   const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
         handleFileUpload(file);
      }
   };

   const isResume = type === "resume";
   const icon = isResume ? FileText : Briefcase;
   const title = isResume ? "Resume" : "Job Description";
   const placeholder = isResume ? "Paste your resume content here..." : "Paste the job description here...";

   if (isUploaded) {
      return (
         <div className="text-center p-6">
            <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
            <p className="text-success font-medium">{title} uploaded successfully!</p>
         </div>
      );
   }

   return (
      <div className="space-y-4">
         {/* Upload Method Toggle */}
         <div className="flex space-x-2 p-1 bg-muted rounded-lg">
            {isResume && (
               <Button variant={uploadMethod === "file" ? "default" : "ghost"} size="sm" onClick={() => setUploadMethod("file")} className="flex-1">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload File
               </Button>
            )}
            {!isResume && (
               <Button variant={uploadMethod === "text" ? "default" : "ghost"} size="sm" onClick={() => setUploadMethod("text")} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Paste Text
               </Button>
            )}
         </div>

         {uploadMethod === "file" ? (
            <div
               className={cn("border-2 border-dashed rounded-lg p-8 text-center transition-colors", isDragOver ? "border-primary bg-primary/5" : "border-border", "hover:border-primary/50 hover:bg-primary/5")}
               onDrop={handleDrop}
               onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
               }}
               onDragLeave={() => setIsDragOver(false)}
            >
               <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
               <p className="text-lg font-medium mb-2">Drop your {title.toLowerCase()} here</p>
               <p className="text-muted-foreground mb-4">or click to browse files (PDF, DOC, DOCX)</p>
               <Input type="file" accept=".pdf,.doc,.docx" onChange={handleFileInput} className="hidden" id={`file-${type}`} />
               <Label htmlFor={`file-${type}`}>
                  <Button variant="outline" size="sm" asChild>
                     <span>Browse Files</span>
                  </Button>
               </Label>
            </div>
         ) : (
            <div className="space-y-4">
               <Textarea placeholder={placeholder} value={textContent} onChange={(e) => setTextContent(e.target.value)} className="min-h-[200px] resize-none" />
               <Button onClick={handleTextSubmit} disabled={!textContent.trim()} className="w-full">
                  Submit {title}
               </Button>
            </div>
         )}
      </div>
   );
}
