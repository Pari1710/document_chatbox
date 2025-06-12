"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, FileText, Calendar } from "lucide-react";
import { FirebasePdfUploader } from "@/components/firebase-pdf-uploader";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import axios from "axios";
import { saveDocumentForSummary } from "@/actions/summary";

export default function Summaries() {
  const [isUploading, setIsUploading] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const response = await axios.get('/api/summaries');
        setDocuments(response.data);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast({
          title: "Error",
          description: "Failed to load your documents",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchDocuments();
    }
  }, [user, toast]);

  const handleUpload = async (result: any) => {
    if (!user || !result) return;

    try {
      const title = documentTitle.trim() || result.name.replace(/\.[^/.]+$/, "") || "Untitled Document";

      const response = await saveDocumentForSummary({
        userId: user.id,
        title,
        fileName: result.name,
        fileUrl: result.url,
        fileKey: result.key,
        fileSize: result.size,
      });

      if (response.success && response.documentId) {
        toast({
          title: "Success",
          description: "Document uploaded successfully. Generating summaries...",
        });
        router.push(`/summaries/${response.documentId}`);
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to save document",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving document:", error);
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <h1 className="text-4xl font-bold text-center mb-10">PDF Summaries</h1>

      <Card className="w-full shadow-sm border rounded-xl mb-12">
        <CardHeader>
          <CardTitle className="text-xl">Upload Document</CardTitle>
          <CardDescription>Upload a PDF to get automatic chapter-wise summaries.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="documentTitle" className="block text-sm font-medium mb-1">
                Document Title (optional)
              </label>
              <Input
                id="documentTitle"
                placeholder="e.g., Introduction to AI"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
              />
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition hover:bg-muted/30">
              <FirebasePdfUploader
                onUploadBegin={() => setIsUploading(true)}
                onUploadComplete={(result) => {
                  setIsUploading(false);
                  handleUpload(result);
                }}
                onUploadError={(error) => {
                  setIsUploading(false);
                  toast({
                    title: "Upload Error",
                    description: error.message,
                    variant: "destructive",
                  });
                }}
              />
              {isUploading && (
                <p className="mt-2 text-sm text-muted-foreground animate-pulse">Uploading...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-6">Your Uploaded Documents</h2>

        {isLoading ? (
          <div className="flex justify-center py-20 text-muted-foreground">
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center py-16 bg-muted/20 rounded-lg border">
            <FileText className="w-10 h-10 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">You haven't uploaded any documents yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {documents.map((doc) => (
              <Card
                key={doc.id}
                className="border rounded-lg hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg truncate">{doc.title}</CardTitle>
                  <CardDescription className="truncate">{doc.fileName}</CardDescription>
                </CardHeader>
                <CardContent className="pb-2 text-sm text-muted-foreground">
                  <div className="flex items-center mb-1">
                    <Calendar className="h-4 w-4 mr-2" />
                    Uploaded on {formatDate(doc.createdAt)}
                  </div>
                  <div>{Math.round(doc.fileSize / 1024)} KB</div>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full"
                    onClick={() => router.push(`/summaries/${doc.id}`)}
                  >
                    View Summaries
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
