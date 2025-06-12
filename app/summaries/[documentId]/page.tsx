"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import axios from "axios";
import { FileText, RefreshCw } from "lucide-react";
import { RegenerationModal } from "@/components/RegenerationModal";

export default function DocumentSummary() {
  const { documentId } = useParams();
  const [documentDetails, setDocumentDetails] = useState<any>(null);
  const [summaries, setSummaries] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [isRegenerationModalOpen, setIsRegenerationModalOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();

  // Fetch document details and summaries
  const fetchDocumentDetails = useCallback(async () => {
    if (!documentId || !user) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/summaries/${documentId}`);
      setDocumentDetails(response.data.document);
      setSummaries(response.data.summaries || []);
      setIsSummaryLoading(response.data.summaries?.length === 0);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load document details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [documentId, user, toast]);

  // Trigger regeneration of summaries
  const handleRegenerationSubmit = async (options: {
    focusChapters: string[];
    focusTopics: string[];
    customInstructions: string;
  }) => {
    try {
      setIsRegenerationModalOpen(false);
      setIsSummaryLoading(true);
      toast({
        title: "Processing",
        description: "Regenerating summaries. Please wait...",
      });

      const response = await axios.post(`/api/summaries/${documentId}/regenerate`, options);
      
      if (response.data.success) {
        toast({
          title: "Success",
          description: "Summaries are being regenerated. Please check back soon.",
        });
        
        setTimeout(() => window.location.reload(), 3000);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to regenerate summaries",
        variant: "destructive",
      });
    } finally {
      setIsSummaryLoading(false);
    }
  };

  const regenerateSummary = () => {
    setIsRegenerationModalOpen(true);
  };

  // Load document details on component mount
  useEffect(() => {
    fetchDocumentDetails();
  }, [fetchDocumentDetails]);

  // Show loading state when data is being fetched
  if (isLoading) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="flex items-center justify-center h-64">
          <p>Loading document...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">{documentDetails?.title || "PDF Document"}</h1>
      
      <ResizablePanelGroup direction="horizontal" className="min-h-[600px] rounded-lg border">
        {/* Summaries Panel */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="flex flex-col h-full">
            <CardHeader className="px-4">
              <div className="flex justify-between items-center">
                <CardTitle>Summaries</CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={regenerateSummary}
                  disabled={isSummaryLoading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
              <CardDescription>
                Chapter-wise summaries of your document
              </CardDescription>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-auto p-4">
              {isSummaryLoading ? (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground mb-4">Generating summaries...</p>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[80%]" />
                  </div>
                </div>
              ) : summaries.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-center text-muted-foreground">
                    No summaries available. Click "Regenerate" to create them.
                  </p>
                </div>
              ) : (
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full mb-4">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="chapters" className="flex-1">Chapters</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="mt-0">
                    <div className="prose prose-sm max-w-none">
                      <h3 className="text-lg font-semibold mb-2">Document Overview</h3>
                      <div className="bg-muted/30 p-4 rounded-md">
                        {summaries.find(s => s.type === 'overview')?.content || "No overview available."}
                      </div>
                      
                      <h3 className="text-lg font-semibold mt-6 mb-2">Key Points</h3>
                      <div className="bg-muted/30 p-4 rounded-md">
                        {summaries.find(s => s.type === 'key_points')?.content || "No key points available."}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="chapters" className="mt-0">
                    <div className="space-y-6">
                      {summaries
                        .filter(s => s.type === 'chapter')
                        .sort((a, b) => a.order - b.order)
                        .map((chapter, index) => (
                          <div key={index} className="border rounded-md p-4">
                            <h3 className="text-lg font-semibold mb-2">{chapter.title}</h3>
                            <div className="prose prose-sm max-w-none">
                              <p>{chapter.content}</p>
                            </div>
                          </div>
                        ))}
                        
                      {summaries.filter(s => s.type === 'chapter').length === 0 && (
                        <div className="text-center text-muted-foreground py-8">
                          No chapter summaries available.
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </div>
        </ResizablePanel>
        
        <ResizableHandle />
        
        {/* Document Viewer Panel */}
        <ResizablePanel defaultSize={60}>
          <div className="h-full flex flex-col">
            <CardHeader className="px-4">
              <CardTitle>Document Viewer</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              {documentDetails?.fileUrl && (
                <iframe
                  src={`${documentDetails.fileUrl}#toolbar=1`}
                  className="w-full h-full rounded-b-lg"
                  title="PDF Viewer"
                />
              )}
            </CardContent>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
      
      {/* Regeneration Modal */}
      <RegenerationModal
        isOpen={isRegenerationModalOpen}
        onClose={() => setIsRegenerationModalOpen(false)}
        onSubmit={handleRegenerationSubmit}
      />
    </div>
  );
}
