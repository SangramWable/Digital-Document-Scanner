'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Edit3,
  Save,
  Eye,
  Image as ImageIcon,
  FileUp,
  Scan,
} from 'lucide-react';

import { useAppStore, type UserDocument } from '@/lib/store';
import { DOCUMENT_TYPES, EXTRACTED_FIELDS } from '@/lib/data';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

/* ──────────────────────── Constants ──────────────────────── */

const ACCEPTED_FORMATS = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const FORMAT_LABELS = 'PDF, JPG, JPEG, PNG';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/* ──────────────────────── Animation helpers ──────────────────────── */

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
};

/* ──────────────────────── Utility: health score ──────────────────────── */

function calculateHealthScore(data: Record<string, string>): number {
  const relevantFields = EXTRACTED_FIELDS.filter((f) => {
    // Always count core fields
    return true;
  });
  const filledCount = relevantFields.filter((f) => data[f.key] && data[f.key].trim() !== '').length;
  if (relevantFields.length === 0) return 0;
  return Math.round((filledCount / relevantFields.length) * 100);
}

/* ════════════════════════════════════════════════════════════════════════════
   DocumentUpload — Full document upload & OCR view
   ════════════════════════════════════════════════════════════════════════════ */

export default function DocumentUpload() {
  /* ──── Store ──── */
  const documents = useAppStore((s) => s.documents);
  const addDocument = useAppStore((s) => s.addDocument);
  const updateDocument = useAppStore((s) => s.updateDocument);
  const removeDocument = useAppStore((s) => s.removeDocument);
  const addActivity = useAppStore((s) => s.addActivity);

  /* ──── Local state ──── */
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [newDocData, setNewDocData] = useState<Record<string, string> | null>(null);
  const [newDocId, setNewDocId] = useState<string | null>(null);

  // Detail modal
  const [detailDoc, setDetailDoc] = useState<UserDocument | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Record<string, string>>({});

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ──── Helpers ──── */

  const getDocTypeInfo = useCallback((value: string) => {
    return DOCUMENT_TYPES.find((d) => d.value === value);
  }, []);

  const formatDate = useCallback((iso: string) => {
    try {
      return new Date(iso).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return iso;
    }
  }, []);

  /* ──── File handling ──── */

  const validateFile = useCallback((file: File): string | null => {
    if (!ACCEPTED_FORMATS.includes(file.type)) {
      return `Unsupported format. Accepted: ${FORMAT_LABELS}`;
    }
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 10 MB.';
    }
    return null;
  }, []);

  const handleFileSelect = useCallback(
    (file: File) => {
      const err = validateFile(file);
      if (err) {
        setOcrError(err);
        return;
      }
      setOcrError(null);
      setSelectedFile(file);
      setNewDocData(null);
      setNewDocId(null);

      // Generate preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => setFilePreview(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
    },
    [validateFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setFilePreview(null);
    setNewDocData(null);
    setNewDocId(null);
    setOcrError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  /* ──── Convert file to base64 ──── */

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Strip the data URI prefix
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /* ──── OCR processing ──── */

  const processOCR = useCallback(async () => {
    if (!selectedFile || !selectedDocType) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    setOcrError(null);

    // Simulated progress increments
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 400);

    try {
      const imageData = await fileToBase64(selectedFile);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData,
          mimeType: selectedFile.type,
          docType: selectedDocType,
        }),
      });

      clearInterval(progressInterval);
      setProcessingProgress(95);

      if (!response.ok) {
        const errBody = await response.json().catch(() => null);
        throw new Error(errBody?.error || `OCR failed (${response.status})`);
      }

      const result = await response.json();
      const extractedData: Record<string, string> = result.extractedData || {};

      setProcessingProgress(100);

      // Create the document
      const docId = crypto.randomUUID();
      const docTypeInfo = getDocTypeInfo(selectedDocType);
      const now = new Date().toISOString();

      const newDoc: UserDocument = {
        id: docId,
        docType: selectedDocType,
        docName: docTypeInfo?.label || selectedDocType,
        fileName: selectedFile.name,
        fileData: filePreview || '',
        mimeType: selectedFile.type,
        extractedData,
        healthScore: calculateHealthScore(extractedData),
        issueDate: extractedData.issueDate || undefined,
        expiryDate: extractedData.expiryDate || undefined,
        createdAt: now,
        updatedAt: now,
      };

      addDocument(newDoc);
      addActivity('Document Uploaded', `Uploaded ${newDoc.docName} — ${selectedFile.name}`);

      setNewDocData(extractedData);
      setNewDocId(docId);

      // Small delay for UX
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingProgress(0);
      }, 600);
    } catch (err) {
      clearInterval(progressInterval);
      setIsProcessing(false);
      setProcessingProgress(0);
      setOcrError((err as Error).message || 'OCR processing failed. Please try again.');
    }
  }, [selectedFile, selectedDocType, filePreview, addDocument, addActivity, getDocTypeInfo]);

  /* ──── Document detail modal ──── */

  const openDetailModal = useCallback(
    (doc: UserDocument) => {
      setDetailDoc(doc);
      setEditMode(false);
      setEditData({ ...doc.extractedData });
    },
    []
  );

  const saveEditedFields = useCallback(() => {
    if (!detailDoc) return;
    updateDocument(detailDoc.id, {
      extractedData: { ...editData },
      healthScore: calculateHealthScore(editData),
      updatedAt: new Date().toISOString(),
    });
    addActivity('Document Updated', `Updated extracted data for ${detailDoc.docName}`);
    setDetailDoc({ ...detailDoc, extractedData: { ...editData }, healthScore: calculateHealthScore(editData) });
    setEditMode(false);
  }, [detailDoc, editData, updateDocument, addActivity]);

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    const doc = documents.find((d) => d.id === deleteTarget);
    removeDocument(deleteTarget);
    if (doc) addActivity('Document Deleted', `Deleted ${doc.docName}`);
    setDeleteTarget(null);
    setDetailDoc(null);
  }, [deleteTarget, documents, removeDocument, addActivity]);

  /* ──── Derived data ──── */

  const newlyExtractedDoc = useMemo(() => {
    if (!newDocId) return null;
    return documents.find((d) => d.id === newDocId) || null;
  }, [newDocId, documents]);

  const healthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const healthBadge = (score: number) => {
    if (score >= 80) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    if (score >= 50) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800';
  };

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* ───── Header ───── */}
      <motion.div {...fadeInUp} transition={{ duration: 0.4 }}>
        <h2 className="text-2xl font-bold text-foreground tracking-tight">
          Document Upload
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload government documents and extract data using AI-powered OCR
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ════════════════════════════════════════════════════════════════
           LEFT COLUMN: Upload + Extracted Data
           ════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">
          {/* ── Upload Area ── */}
          <motion.div {...fadeInUp} transition={{ duration: 0.4, delay: 0.05 }}>
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileUp className="size-4 text-emerald-500" />
                  Upload Document
                </CardTitle>
                <CardDescription className="text-xs">
                  Drag & drop or browse. {FORMAT_LABELS} up to 10 MB.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Document type selector */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Document Type</Label>
                  <Select value={selectedDocType} onValueChange={setSelectedDocType}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {DOCUMENT_TYPES.map((dt) => (
                        <SelectItem key={dt.value} value={dt.value}>
                          <span className="flex items-center gap-2">
                            <span>{dt.icon}</span>
                            <span>{dt.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Drop zone */}
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => !isProcessing && fileInputRef.current?.click()}
                  className={`
                    relative flex flex-col items-center justify-center gap-3 rounded-xl
                    border-2 border-dashed p-8 transition-all duration-200 cursor-pointer
                    ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 scale-[1.01]'
                        : selectedFile
                          ? 'border-emerald-400/60 bg-emerald-50/50 dark:bg-emerald-950/20'
                          : 'border-border hover:border-emerald-400/50 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10'
                    }
                    ${isProcessing ? 'pointer-events-none opacity-60' : ''}
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={handleInputChange}
                  />

                  {selectedFile && !isProcessing ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-2"
                    >
                      {filePreview ? (
                        <div className="relative size-16 rounded-lg overflow-hidden border border-border/50 shadow-sm">
                          <img
                            src={filePreview}
                            alt="Preview"
                            className="size-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="flex size-16 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
                          <FileText className="size-8 text-red-500" />
                        </div>
                      )}
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-muted-foreground hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFile();
                        }}
                      >
                        <X className="size-3 mr-1" />
                        Remove
                      </Button>
                    </motion.div>
                  ) : (
                    <>
                      <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                        <Upload className="size-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-foreground">
                          {isDragging ? 'Drop your file here' : 'Drag & drop or click to browse'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {FORMAT_LABELS} &middot; Max 10 MB
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {/* Error message */}
                <AnimatePresence>
                  {ocrError && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950/30"
                    >
                      <AlertCircle className="size-4 shrink-0 text-red-500 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-red-700 dark:text-red-300">
                          {ocrError}
                        </p>
                      </div>
                      <button
                        onClick={() => setOcrError(null)}
                        className="text-red-400 hover:text-red-600"
                      >
                        <X className="size-3.5" />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Upload / Process button */}
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                  disabled={!selectedFile || !selectedDocType || isProcessing}
                  onClick={processOCR}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Scan className="size-4 mr-2" />
                      Upload & Extract Data
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* ── Processing State ── */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <Card className="border-emerald-200 dark:border-emerald-800/50 shadow-sm overflow-hidden">
                  <CardContent className="p-5 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
                        <Loader2 className="size-5 text-emerald-600 dark:text-emerald-400 animate-spin" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          AI is analyzing your document...
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Extracting text and data fields using OCR
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{Math.round(processingProgress)}%</span>
                      </div>
                      <Progress
                        value={processingProgress}
                        className="h-2 [&>div]:bg-emerald-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <motion.div
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Scan className="size-3.5 text-emerald-500" />
                      </motion.div>
                      <span>
                        {processingProgress < 30
                          ? 'Reading document...'
                          : processingProgress < 60
                            ? 'Identifying fields...'
                            : processingProgress < 90
                              ? 'Extracting data...'
                              : 'Almost done...'}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Extracted Data Card (immediately after OCR) ── */}
          <AnimatePresence>
            {newlyExtractedDoc && newDocData && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
              >
                <Card className="border-emerald-200 dark:border-emerald-800/50 shadow-sm overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-500" />
                        Extracted Data
                      </CardTitle>
                      <Badge className={healthBadge(newlyExtractedDoc.healthScore)}>
                        Score: {newlyExtractedDoc.healthScore}%
                      </Badge>
                    </div>
                    <CardDescription className="text-xs">
                      {newlyExtractedDoc.docName} &mdash; review and edit below
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="max-h-72">
                      <motion.div
                        className="space-y-2.5"
                        variants={staggerContainer}
                        initial="initial"
                        animate="animate"
                      >
                        {EXTRACTED_FIELDS.map((field) => {
                          const val = newlyExtractedDoc.extractedData[field.key] || '';
                          const hasValue = val.trim() !== '';
                          return (
                            <motion.div
                              key={field.key}
                              variants={staggerItem}
                              className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                            >
                              <div className="flex-1 min-w-0">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {field.label}
                                </Label>
                                <p
                                  className={`text-sm truncate ${
                                    hasValue
                                      ? 'text-foreground font-medium'
                                      : 'text-muted-foreground italic'
                                  }`}
                                >
                                  {hasValue ? val : 'Not detected'}
                                </p>
                              </div>
                              {hasValue ? (
                                <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                              ) : (
                                <AlertCircle className="size-4 shrink-0 text-amber-400" />
                              )}
                            </motion.div>
                          );
                        })}
                      </motion.div>
                    </ScrollArea>
                    <Separator className="my-3" />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => openDetailModal(newlyExtractedDoc)}
                      >
                        <Eye className="size-3.5 mr-1.5" />
                        View & Edit
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={clearFile}
                      >
                        <Upload className="size-3.5 mr-1.5" />
                        Upload Another
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ════════════════════════════════════════════════════════════════
           RIGHT COLUMN: Uploaded Documents List
           ════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-3">
          <motion.div {...fadeInUp} transition={{ duration: 0.4, delay: 0.1 }}>
            <Card className="border-border/50 shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="size-4 text-emerald-500" />
                      Uploaded Documents
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
                    </CardDescription>
                  </div>
                  {documents.length > 0 && (
                    <Badge variant="outline" className="text-xs border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300">
                      {documents.length} total
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {documents.length === 0 ? (
                  /* ── Empty state ── */
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-16 text-center"
                  >
                    <div className="flex size-16 items-center justify-center rounded-full bg-muted/50 mb-4">
                      <ImageIcon className="size-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      No documents uploaded yet
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 max-w-[240px]">
                      Upload a government document to extract data using AI-powered OCR
                    </p>
                  </motion.div>
                ) : (
                  /* ── Documents list ── */
                  <ScrollArea className="max-h-[520px]">
                    <motion.div
                      className="space-y-2"
                      variants={staggerContainer}
                      initial="initial"
                      animate="animate"
                    >
                      {documents.map((doc) => {
                        const typeInfo = getDocTypeInfo(doc.docType);
                        const issueCount = doc.issues?.filter((i) => i.status === 'open').length || 0;

                        return (
                          <motion.div
                            key={doc.id}
                            variants={staggerItem}
                            className="group flex items-center gap-3 rounded-lg border border-border/40 bg-card px-3 py-3 transition-colors hover:border-emerald-300/50 hover:bg-emerald-50/30 dark:hover:border-emerald-700/40 dark:hover:bg-emerald-950/10"
                          >
                            {/* Doc type icon */}
                            <div
                              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-lg"
                              style={{ backgroundColor: `${typeInfo?.color || '#64748B'}15` }}
                            >
                              {typeInfo?.icon || '📄'}
                            </div>

                            {/* Doc info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {doc.docName}
                                </p>
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 shrink-0 ${healthBadge(doc.healthScore)}`}
                                >
                                  {doc.healthScore}%
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {doc.fileName} &middot; {formatDate(doc.createdAt)}
                                {issueCount > 0 && (
                                  <span className="text-amber-600 dark:text-amber-400 ml-1">
                                    &middot; {issueCount} issue{issueCount !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => openDetailModal(doc)}
                                title="View details"
                              >
                                <Eye className="size-3.5 text-muted-foreground hover:text-emerald-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => openDetailModal(doc)}
                                title="Edit"
                              >
                                <Edit3 className="size-3.5 text-muted-foreground hover:text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => setDeleteTarget(doc.id)}
                                title="Delete"
                              >
                                <Trash2 className="size-3.5 text-muted-foreground hover:text-red-500" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
         DOCUMENT DETAIL MODAL
         ════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!detailDoc} onOpenChange={(open) => !open && setDetailDoc(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0">
          {detailDoc && (
            <>
              <DialogHeader className="px-6 pt-6 pb-0">
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-lg">{getDocTypeInfo(detailDoc.docType)?.icon || '📄'}</span>
                  <span>{detailDoc.docName}</span>
                  <Badge className={healthBadge(detailDoc.healthScore)}>
                    Health: {detailDoc.healthScore}%
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-hidden px-6 py-4">
                <ScrollArea className="max-h-[55vh] pr-2">
                  <div className="space-y-5">
                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">File Name</span>
                        <p className="font-medium text-foreground truncate">{detailDoc.fileName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Uploaded</span>
                        <p className="font-medium text-foreground">{formatDate(detailDoc.createdAt)}</p>
                      </div>
                      {detailDoc.issueDate && (
                        <div>
                          <span className="text-xs text-muted-foreground">Issue Date</span>
                          <p className="font-medium text-foreground">{detailDoc.issueDate}</p>
                        </div>
                      )}
                      {detailDoc.expiryDate && (
                        <div>
                          <span className="text-xs text-muted-foreground">Expiry Date</span>
                          <p className="font-medium text-foreground">{detailDoc.expiryDate}</p>
                        </div>
                      )}
                      <div>
                        <span className="text-xs text-muted-foreground">Issues</span>
                        <p className="font-medium text-foreground">
                          {detailDoc.issues?.filter((i) => i.status === 'open').length || 0} open
                        </p>
                      </div>
                    </div>

                    {/* Document image preview */}
                    {detailDoc.fileData && (
                      <>
                        <Separator />
                        <div>
                          <Label className="text-xs font-medium mb-2 block">Document Preview</Label>
                          <div className="rounded-lg border border-border/50 overflow-hidden bg-muted/20 max-h-48 flex items-center justify-center">
                            {detailDoc.mimeType.startsWith('image/') ? (
                              <img
                                src={
                                  detailDoc.fileData.startsWith('data:')
                                    ? detailDoc.fileData
                                    : `data:${detailDoc.mimeType};base64,${detailDoc.fileData}`
                                }
                                alt={detailDoc.docName}
                                className="max-h-48 object-contain"
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2 py-6">
                                <FileText className="size-10 text-muted-foreground/40" />
                                <p className="text-xs text-muted-foreground">PDF preview not available</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Health score bar */}
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Health Score</Label>
                        <span className={`text-sm font-bold ${healthColor(detailDoc.healthScore)}`}>
                          {detailDoc.healthScore}%
                        </span>
                      </div>
                      <Progress
                        value={detailDoc.healthScore}
                        className="h-2.5 [&>div]:bg-emerald-500"
                      />
                      <p className="text-[10px] text-muted-foreground">
                        Based on completeness of extracted data fields
                      </p>
                    </div>

                    {/* Extracted fields */}
                    <Separator />
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <Label className="text-xs font-medium">Extracted Fields</Label>
                        {!editMode ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => {
                              setEditMode(true);
                              setEditData({ ...detailDoc.extractedData });
                            }}
                          >
                            <Edit3 className="size-3 mr-1" />
                            Edit
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => setEditMode(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                              onClick={saveEditedFields}
                            >
                              <Save className="size-3 mr-1" />
                              Save
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        {EXTRACTED_FIELDS.map((field) => {
                          const currentVal = editMode
                            ? editData[field.key] || ''
                            : detailDoc.extractedData[field.key] || '';
                          const hasValue = currentVal.trim() !== '';

                          return (
                            <div
                              key={field.key}
                              className="flex items-center gap-3 rounded-lg border border-border/40 bg-muted/20 px-3 py-2"
                            >
                              <div className="flex-1 min-w-0">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                  {field.label}
                                </Label>
                                {editMode ? (
                                  <Input
                                    value={currentVal}
                                    onChange={(e) =>
                                      setEditData((prev) => ({
                                        ...prev,
                                        [field.key]: e.target.value,
                                      }))
                                    }
                                    placeholder="Not detected"
                                    className="h-7 mt-0.5 text-sm"
                                  />
                                ) : (
                                  <p
                                    className={`text-sm mt-0.5 ${
                                      hasValue
                                        ? 'text-foreground font-medium'
                                        : 'text-muted-foreground italic'
                                    }`}
                                  >
                                    {hasValue ? currentVal : 'Not detected'}
                                  </p>
                                )}
                              </div>
                              {!editMode &&
                                (hasValue ? (
                                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                                ) : (
                                  <AlertCircle className="size-4 shrink-0 text-amber-400" />
                                ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>

              <DialogFooter className="px-6 pb-4 pt-0 gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="text-xs"
                  onClick={() => setDeleteTarget(detailDoc.id)}
                >
                  <Trash2 className="size-3.5 mr-1.5" />
                  Delete Document
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => setDetailDoc(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ════════════════════════════════════════════════════════════════
         DELETE CONFIRMATION DIALOG
         ════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="size-5" />
              Confirm Deletion
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this document? This action cannot be undone. All
            extracted data and associated issues will be permanently removed.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={confirmDelete}
            >
              <Trash2 className="size-3.5 mr-1.5" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
