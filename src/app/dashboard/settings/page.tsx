'use client';

import React, { useState, useEffect } from 'react';
import { useSupabase } from '@/contexts/SupabaseContext';
import { toast } from 'sonner';
import { z } from 'zod';
import { 
  Settings, 
  Bell, 
  Moon, 
  Sun, 
  Save,
  Laptop,
  Globe,
  Mail
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useTheme } from 'next-themes';

// Form validation schema
const notificationSettingsSchema = z.object({
  emailNotifications: z.boolean(),
  productUpdates: z.boolean(),
  quoteExpiration: z.boolean(),
  marketingEmails: z.boolean(),
});

const displaySettingsSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string(),
  measurementUnit: z.enum(['metric', 'imperial']),
});

type NotificationSettings = z.infer<typeof notificationSettingsSchema>;
type DisplaySettings = z.infer<typeof displaySettingsSchema>;

export default function SettingsPage() {
  const { user, supabase } = useSupabase();
  const { theme, setTheme } = useTheme();
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    productUpdates: true,
    quoteExpiration: true,
    marketingEmails: false,
  });
  
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>({
    theme: 'system',
    language: 'en',
    measurementUnit: 'metric',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        
        // Get user settings from the database
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single();
          
        if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
          throw error;
        }
        
        if (data) {
          // Update notification settings
          setNotificationSettings({
            emailNotifications: data.email_notifications ?? true,
            productUpdates: data.product_updates ?? true,
            quoteExpiration: data.quote_expiration ?? true,
            marketingEmails: data.marketing_emails ?? false,
          });
          
          // Update display settings
          setDisplaySettings({
            theme: data.theme ?? 'system',
            language: data.language ?? 'en',
            measurementUnit: data.measurement_unit ?? 'metric',
          });
          
          // Set theme
          setTheme(data.theme ?? 'system');
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [user, supabase, setTheme]);
  
  const handleSaveSettings = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Save settings to the database
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          email_notifications: notificationSettings.emailNotifications,
          product_updates: notificationSettings.productUpdates,
          quote_expiration: notificationSettings.quoteExpiration,
          marketing_emails: notificationSettings.marketingEmails,
          theme: displaySettings.theme,
          language: displaySettings.language,
          measurement_unit: displaySettings.measurementUnit,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });
        
      if (error) throw error;
      
      // Update theme
      setTheme(displaySettings.theme);
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  
  const handleDisplaySettingChange = (key: keyof DisplaySettings, value: string) => {
    setDisplaySettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account preferences</p>
      </div>
      
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="mb-4">
          <TabsTrigger value="notifications" className="flex items-center">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="display" className="flex items-center">
            <Sun className="w-4 h-4 mr-2" />
            Display
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>
                Configure how you want to receive notifications and updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-gray-500">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={() => handleNotificationChange('emailNotifications')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Product Updates</Label>
                    <p className="text-sm text-gray-500">
                      Get notified about new features and improvements
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.productUpdates}
                    onCheckedChange={() => handleNotificationChange('productUpdates')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Quote Expiration</Label>
                    <p className="text-sm text-gray-500">
                      Receive alerts when your quotes are about to expire
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.quoteExpiration}
                    onCheckedChange={() => handleNotificationChange('quoteExpiration')}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Marketing Emails</Label>
                    <p className="text-sm text-gray-500">
                      Receive promotional emails and special offers
                    </p>
                  </div>
                  <Switch 
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={() => handleNotificationChange('marketingEmails')}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving}
                className="ml-auto"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="display">
          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Customize the appearance and behavior of the application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="theme">Theme</Label>
                  <Select 
                    value={displaySettings.theme}
                    onValueChange={(value) => handleDisplaySettingChange('theme', value)}
                  >
                    <SelectTrigger id="theme" className="mt-1.5">
                      <SelectValue placeholder="Select theme" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light" className="flex items-center">
                        <div className="flex items-center">
                          <Sun className="w-4 h-4 mr-2" />
                          Light
                        </div>
                      </SelectItem>
                      <SelectItem value="dark">
                        <div className="flex items-center">
                          <Moon className="w-4 h-4 mr-2" />
                          Dark
                        </div>
                      </SelectItem>
                      <SelectItem value="system">
                        <div className="flex items-center">
                          <Laptop className="w-4 h-4 mr-2" />
                          System
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={displaySettings.language}
                    onValueChange={(value) => handleDisplaySettingChange('language', value)}
                  >
                    <SelectTrigger id="language" className="mt-1.5">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          English
                        </div>
                      </SelectItem>
                      <SelectItem value="es">
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Español
                        </div>
                      </SelectItem>
                      <SelectItem value="fr">
                        <div className="flex items-center">
                          <Globe className="w-4 h-4 mr-2" />
                          Français
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="measurement">Measurement Units</Label>
                  <Select 
                    value={displaySettings.measurementUnit}
                    onValueChange={(value) => handleDisplaySettingChange('measurementUnit', value as 'metric' | 'imperial')}
                  >
                    <SelectTrigger id="measurement" className="mt-1.5">
                      <SelectValue placeholder="Select measurement unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">Metric (cm, kg)</SelectItem>
                      <SelectItem value="imperial">Imperial (in, lb)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving}
                className="ml-auto"
              >
                {isSaving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
