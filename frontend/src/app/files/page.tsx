"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Upload,
  File,
  Image,
  FileText,
  Download,
  Trash2,
  Share,
  Filter,
  Search,
  Grid3X3,
  List,
  MoreHorizontal,
  Calendar,
  User,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { bgTint, hoverBgTintGroup, textColor, type BrandColor } from "@/lib/color-variants";
import PageHeader from "@/components/PageHeader";
import { DataTable, type Column } from "@/components/tables/DataTable";
import TableToolbar from "@/components/tables/TableToolbar";

interface FileItem {
  id: string;
  name: string;
  type: "pdf" | "image" | "document" | "other";
  size: string;
  uploadedBy: string;
  uploadedDate: string;
  client?: string;
  tags: string[];
  url: string;
}

export default function FilesPage() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [dragActive, setDragActive] = useState(false);

  // Sample files data
  const files: FileItem[] = [
    {
      id: "1",
      name: "credit_report_sarah_johnson.pdf",
      type: "pdf",
      size: "2.4 MB",
      uploadedBy: "John Agent",
      uploadedDate: "2024-01-20",
      client: "Sarah Johnson",
      tags: ["Credit Report", "Experian"],
      url: "/files/1"
    },
    {
      id: "2",
      name: "dispute_letter_template.pdf",
      type: "pdf", 
      size: "156 KB",
      uploadedBy: "Jane Manager",
      uploadedDate: "2024-01-18",
      tags: ["Template", "Dispute Letter"],
      url: "/files/2"
    },
    {
      id: "3",
      name: "id_verification_michael.jpg",
      type: "image",
      size: "1.8 MB",
      uploadedBy: "John Agent",
      uploadedDate: "2024-01-22",
      client: "Michael Brown",
      tags: ["ID Verification"],
      url: "/files/3"
    },
    {
      id: "4",
      name: "contract_jennifer_davis.pdf",
      type: "pdf",
      size: "890 KB",
      uploadedBy: "Jane Manager", 
      uploadedDate: "2024-01-15",
      client: "Jennifer Davis",
      tags: ["Contract", "Signed"],
      url: "/files/4"
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      // Handle file upload
      console.log("Files dropped:", e.dataTransfer.files);
    }
  }, []);

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf": return FileText;
      case "image": return Image;
      case "document": return File;
      default: return File;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case "pdf": return "destructive";
      case "image": return "success";
      case "document": return "primary";
      default: return "muted";
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    file.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded-xl w-48"></div>
            <div className="h-32 bg-muted rounded-xl"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-48 bg-muted rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Files & Documents"
        subtitle="Manage client documents and file uploads"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Files" }]}
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center border border-border rounded-xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all duration-150 ${
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition-all duration-150 ${
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            <Button className="gap-2">
              <Upload className="w-4 h-4" />
              Upload Files
            </Button>
          </div>
        }
        filters={
          <TableToolbar
            searchPlaceholder="Search files..."
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            rightActions={
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            }
          />
        }
      />

      <div>
        {/* Upload Dropzone */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.1 }}
          className="mb-8"
        >
          <div
            className={`card-modern p-8 border-2 border-dashed transition-all duration-200 ${
              dragActive 
                ? "border-primary bg-primary/5 scale-[1.02]" 
                : "border-border hover:border-primary/50 hover:bg-primary/5"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="text-center">
              <motion.div
                animate={{ 
                  scale: dragActive ? 1.1 : 1,
                  rotate: dragActive ? 5 : 0
                }}
                transition={{ duration: 0.2 }}
                className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
                  dragActive ? "bg-primary/20" : "bg-muted/50"
                }`}
              >
                <Upload className={`w-8 h-8 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
              </motion.div>
              <h3 className="h4 text-foreground mb-2">
                {dragActive ? "Drop files here" : "Upload Documents"}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Drag and drop files here, or click to browse
              </p>
              <Button variant="outline" className="gap-2">
                <Upload className="w-4 h-4" />
                Choose Files
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Files DataTable (list mode standardized) */}
        <div className="card-modern p-0 overflow-hidden">
          <div className="border-b px-4 py-2 flex items-center gap-3">
            <input
              type="checkbox"
              className="rounded border-border"
              checked={selectedFiles.length > 0 && selectedFiles.length === filteredFiles.length}
              onChange={() => {
                if (selectedFiles.length === filteredFiles.length) {
                  setSelectedFiles([]);
                } else {
                  setSelectedFiles(filteredFiles.map(f => f.id));
                }
              }}
            />
            <span className="text-sm text-muted-foreground">Select all</span>
          </div>
          <div className="p-4">
            <TableToolbar
              searchPlaceholder="Search files..."
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              rightActions={
                <Button className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Files
                </Button>
              }
            />
          </div>
          <div className="p-4 pt-0">
            <DataTable<{ id: string } & FileItem>
              data={filteredFiles}
              columns={[
                {
                  key: "id",
                  label: "",
                  render: (_v, item) => (
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedFiles.includes(item.id)}
                      onChange={() =>
                        setSelectedFiles(prev =>
                          prev.includes(item.id)
                            ? prev.filter(v => v !== item.id)
                            : [...prev, item.id]
                        )
                      }
                    />
                  ),
                  width: "48px",
                },
                {
                  key: "name",
                  label: "File",
                  render: (_v, item) => {
                    const FileIcon = getFileIcon(item.type);
                    const typeColor = getFileTypeColor(item.type);
                    return (
                      <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-lg", bgTint[typeColor as BrandColor])}>
                          <FileIcon className={cn("w-5 h-5", textColor[typeColor as BrandColor])} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-foreground truncate hover:text-primary transition-colors">
                            {item.name}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{item.size}</span>
                            {item.client && <span>Client: {item.client}</span>}
                            <span>Uploaded {item.uploadedDate}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                },
                {
                  key: "tags",
                  label: "Tags",
                  render: (_v, item) => (
                    <div className="flex items-center gap-1">
                      {item.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="badge-info text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )
                },
                {
                  key: "uploadedBy",
                  label: "Uploaded By",
                },
                {
                  key: "id",
                  label: "",
                  render: () => (
                    <div className="flex justify-end">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  ),
                  width: "48px",
                }
              ] as Column<{ id: string } & FileItem>[]}
              loading={false}
              searchable={false}
              emptyMessage={searchTerm ? "No files match your search" : "No files found"}
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-2xl shadow-soft-lg p-4 flex items-center gap-3"
          >
            <span className="text-sm font-medium text-foreground">
              {selectedFiles.length} {selectedFiles.length > 1 ? "files" : "file"} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1">
                <Download className="w-3 h-3" />
                Download
              </Button>
              <Button size="sm" variant="outline" className="gap-1">
                <Share className="w-3 h-3" />
                Share
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive">
                <Trash2 className="w-3 h-3" />
                Delete
              </Button>
            </div>
          </motion.div>
        )}
      </div>
  );
}