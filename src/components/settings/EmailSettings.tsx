import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

// Form schema
const emailSettingsSchema = z.object({
  senderName: z.string().min(2, 'Sender name must be at least 2 characters'),
  senderEmail: z.string().email('Please enter a valid email address'),
  replyToEmail: z.string().email('Please enter a valid email address').optional(),
  emailSignature: z.string().max(500).optional(),
  ccEmails: z.string().optional(),
  sendCopyToSelf: z.boolean().default(false),
  notifyOnQuoteView: z.boolean().default(true),
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;

export function EmailSettings() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Mock email settings - in a real app, this would come from your API
  const defaultValues: EmailSettingsFormValues = {
    senderName: 'Pallet Puzzle',
    senderEmail: 'quotes@example.com',
    replyToEmail: 'sales@example.com',
    emailSignature: 'Thank you for your business!\\n\\nThe Pallet Puzzle Team',
    ccEmails: '',
    sendCopyToSelf: true,
    notifyOnQuoteView: true,
  };
  
  // Initialize form
  const form = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues,
  });
  
  // Handle form submission
  const onSubmit = async (values: EmailSettingsFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Email settings updated successfully');
    } catch (error) {
      console.error('Error updating email settings:', error);
      toast.error('Failed to update email settings');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Sender Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="senderName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Name that appears in the "From" field
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="senderEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sender Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    Email address that sends the quotes
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="replyToEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reply-To Email</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  Optional: Email address for customer replies
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Email Content</h3>
          
          <FormField
            control={form.control}
            name="emailSignature"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Signature</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Your email signature"
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormDescription>
                  Signature to include at the end of quote emails
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="ccEmails"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CC Emails</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="email1@example.com, email2@example.com" />
                </FormControl>
                <FormDescription>
                  Optional: Comma-separated list of emails to CC on all quotes
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Notification Settings</h3>
          
          <FormField
            control={form.control}
            name="sendCopyToSelf"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Send Copy to Self</FormLabel>
                  <FormDescription>
                    Receive a copy of all quote emails sent to customers
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="notifyOnQuoteView"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Quote View Notifications</FormLabel>
                  <FormDescription>
                    Receive notifications when customers view your quotes
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </Form>
  );
}