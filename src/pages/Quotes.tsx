import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { QuoteList } from "@/components/quotes/QuoteList";
import { QuoteDetails } from "@/components/quotes/QuoteDetails";
import { EmailQuoteDialog } from "@/components/quotes/EmailQuoteDialog";
import { Quote } from "@/types";

export default function Quotes() {
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null);
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quotes</h2>
          <p className="text-muted-foreground">
            Manage and share optimization quotes
          </p>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Quotes</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="accepted">Accepted</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quote Management</CardTitle>
              <CardDescription>
                View and manage all your optimization quotes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteList onSelectQuote={setSelectedQuote} />
            </CardContent>
          </Card>
          
          {selectedQuote && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Quote Details</CardTitle>
                  <CardDescription>
                    Quote #{selectedQuote.quote_number}
                  </CardDescription>
                </div>
                <Button onClick={() => setIsEmailDialogOpen(true)}>
                  Email Quote
                </Button>
              </CardHeader>
              <CardContent>
                <QuoteDetails quote={selectedQuote} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Other tab contents would be similar but with filtered data */}
        <TabsContent value="draft" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Draft Quotes</CardTitle>
              <CardDescription>
                Quotes that haven't been sent yet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteList status="draft" onSelectQuote={setSelectedQuote} />
            </CardContent>
          </Card>
          
          {selectedQuote && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Quote Details</CardTitle>
                  <CardDescription>
                    Quote #{selectedQuote.quote_number}
                  </CardDescription>
                </div>
                <Button onClick={() => setIsEmailDialogOpen(true)}>
                  Email Quote
                </Button>
              </CardHeader>
              <CardContent>
                <QuoteDetails quote={selectedQuote} />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Similar structure for sent and accepted tabs */}
        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sent Quotes</CardTitle>
              <CardDescription>
                Quotes that have been sent to customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteList status="sent" onSelectQuote={setSelectedQuote} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="accepted" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accepted Quotes</CardTitle>
              <CardDescription>
                Quotes that have been accepted by customers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteList status="accepted" onSelectQuote={setSelectedQuote} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <EmailQuoteDialog 
        open={isEmailDialogOpen} 
        onOpenChange={setIsEmailDialogOpen}
        quote={selectedQuote}
      />
    </div>
  );
}