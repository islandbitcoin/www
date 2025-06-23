import { useSeoMeta } from "@unhead/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, User, Palette, Bell, ArrowLeft, Users } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { LoginArea } from "@/components/auth/LoginArea";
import { PrivacySettings, EditProfileForm, ReferralPanel } from "@/components/lazy";
import { LazyWrapper, loadingSkeletons } from "@/components/LazyWrapper";
import { siteConfig } from "@/config/site.config";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Settings() {
  useSeoMeta({
    title: `Settings - ${siteConfig.name}`,
    description: "Manage your account settings and preferences",
  });

  const { user } = useCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30 py-16">
        <div className="container mx-auto px-4">
          <Card className="max-w-md mx-auto border-caribbean-sand">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Sign in to manage your settings</CardDescription>
            </CardHeader>
            <CardContent className="py-8">
              <div className="text-center space-y-4">
                <User className="h-12 w-12 mx-auto text-caribbean-ocean/50" />
                <p className="text-muted-foreground">Please sign in to access your settings</p>
                <LoginArea className="max-w-60 mx-auto" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30">
      {/* Header */}
      <header className="border-b border-caribbean-sand bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <span className="text-2xl font-bold bg-gradient-to-r from-caribbean-sunset to-caribbean-mango bg-clip-text text-transparent">
                {siteConfig.name}
              </span>
              <img
                src="https://raw.githubusercontent.com/islandbitcoin/islandbitcoin-community/4cfeb962c33fff5e6f5561c37ddca3c469c25793/gallery/Island%20Bitcoin%20Logo.jpg"
                alt="Island Bitcoin Logo"
                className="h-8 w-8 rounded-full"
              />
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm" className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="referral" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Referral</span>
            </TabsTrigger>
            <TabsTrigger value="privacy" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Privacy</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Preferences</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <LazyWrapper fallback={loadingSkeletons.form}>
              <EditProfileForm />
            </LazyWrapper>
          </TabsContent>

          <TabsContent value="referral">
            <LazyWrapper fallback={loadingSkeletons.default}>
              <ReferralPanel />
            </LazyWrapper>
          </TabsContent>

          <TabsContent value="privacy">
            <LazyWrapper fallback={loadingSkeletons.form}>
              <PrivacySettings />
            </LazyWrapper>
          </TabsContent>

          <TabsContent value="preferences">
            <Card className="border-caribbean-sand">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Preferences
                </CardTitle>
                <CardDescription>Customize your Island Bitcoin experience</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Additional preference settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
