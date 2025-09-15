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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="h1 text-foreground">Files & Documents</h1>
            <p className="text-base text-muted-foreground mt-1">
              Manage client documents and file uploads
            </p>
          </div>
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
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </div>

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

        {/* Files Grid/List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut", delay: 0.2 }}
        >
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredFiles.map((file, index) => {
                const FileIcon = getFileIcon(file.type);
                const typeColor = getFileTypeColor(file.type);
                
                return (
                  <motion.div
                    key={file.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.15, delay: index * 0.05 }}
                    className="card-modern p-6 group cursor-pointer hover:shadow-soft-md transition-all duration-200"
                  >
                    {/* File Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-3 rounded-xl transition-colors duration-200", bgTint[typeColor as BrandColor], hoverBgTintGroup[typeColor as BrandColor])}>
                        <FileIcon className={cn("w-6 h-6", textColor[typeColor as BrandColor])} />
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-muted transition-all duration-150">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>

                    {/* File Info */}
                    <div className="mb-4">
                      <h4 className="font-medium text-foreground text-sm mb-1 truncate group-hover:text-primary transition-colors duration-150">
                        {file.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{file.size}</p>
                    </div>

                    {/* File Tags */}
                    {file.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {file.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="badge-info text-xs">
                            {tag}
                          </span>
                        ))}
                        {file.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{file.tags.length - 2} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* File Meta */}
                    <div className="space-y-2 text-xs text-muted-foreground">
                      {file.client && (
                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {file.client}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {file.uploadedDate}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <Button size="sm" variant="ghost" className="flex-1 gap-1">
                        <Eye className="w-3 h-3" />
                        View
                      </Button>
                      <Button size="sm" variant="ghost" className="flex-1 gap-1">
                        <Download className="w-3 h-3" />
                        Download
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1">
                        <Share className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="card-modern overflow-hidden">
              <div className="divide-y divide-border">
                {filteredFiles.map((file, index) => {
                  const FileIcon = getFileIcon(file.type);
                  const typeColor = getFileTypeColor(file.type);
                  
                  return (
                    <motion.div
                      key={file.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.03 }}
                      className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors duration-150 group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => {
                          setSelectedFiles(prev =>
                            prev.includes(file.id)
                              ? prev.filter(id => id !== file.id)
                              : [...prev, file.id]
                          );
                        }}
                        className="rounded border-border"
                      />
                      
                      <div className={cn("p-2 rounded-lg", bgTint[typeColor as BrandColor])}>
                        <FileIcon className={cn("w-5 h-5", textColor[typeColor as BrandColor])} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors duration-150">
                          {file.name}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <span>{file.size}</span>
                          {file.client && <span>Client: {file.client}</span>}
                          <span>Uploaded {file.uploadedDate}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {file.tags.slice(0, 2).map((tag) => (
                          <span key={tag} className="badge-info text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button size="sm" variant="ghost">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Share className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredFiles.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="card-modern p-12 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <File className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="h4 text-foreground mb-2">No files found</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {searchTerm ? "Try adjusting your search terms" : "Upload your first document to get started"}
              </p>
              <Button className="gap-2">
                <Upload className="w-4 h-4" />
                Upload First File
              </Button>
            </motion.div>
          )}
        </motion.div>

        {/* Bulk Actions */}
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card border border-border rounded-2xl shadow-soft-lg p-4 flex items-center gap-3"
          >
            <span className="text-sm font-medium text-foreground">
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
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
    </div>
  );
}