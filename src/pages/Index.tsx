import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Image, Users, Zap, Menu } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { LoginArea } from '@/components/auth/LoginArea';
import { Link } from 'react-router-dom';
import { NostrFeed } from '@/components/NostrFeed';
import { NostrPostBox } from '@/components/NostrPostBox';
import { ScrollArea } from '@/components/ui/scroll-area';

const Index = () => {
  useSeoMeta({
    title: 'Island Bitcoin - Caribbean Bitcoin Community',
    description: 'Join the vibrant Bitcoin community in the Caribbean. Events, education, and connection through Nostr.',
  });

  const [isNostrFeedOpen, setIsNostrFeedOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-caribbean-sand">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold bg-gradient-to-r from-caribbean-sunset to-caribbean-mango bg-clip-text text-transparent">
                Island Bitcoin
              </span>
              <Zap className="w-5 h-5 text-caribbean-mango" />
            </div>
            <div className="flex items-center gap-4">
              <LoginArea className="max-w-40" />
              <Sheet open={isNostrFeedOpen} onOpenChange={setIsNostrFeedOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-full sm:w-[400px] p-0">
                  <div className="flex flex-col h-full">
                    <div className="p-6 pb-4 border-b border-caribbean-sand">
                      <h3 className="text-lg font-semibold">Community Feed</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Live updates from Island Bitcoin members
                      </p>
                    </div>
                    <div className="p-4">
                      <NostrPostBox />
                    </div>
                    <ScrollArea className="flex-1 px-4 pb-4">
                      <NostrFeed />
                    </ScrollArea>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 lg:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-48 sm:w-72 h-48 sm:h-72 bg-caribbean-turquoise/20 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-64 sm:w-96 h-64 sm:h-96 bg-caribbean-sunset/20 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-caribbean-ocean via-caribbean-turquoise to-caribbean-palm bg-clip-text text-transparent animate-gradient-x">
              Bitcoin in Paradise
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl mb-6 sm:mb-8 text-gray-700 px-4 sm:px-0">
              Join the Caribbean's vibrant Bitcoin community. Connect, learn, and build the future of money on island time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-caribbean-sunset hover:bg-caribbean-sunset/90 text-white font-semibold px-8">
                Join the Community
              </Button>
              <Button size="lg" variant="outline" className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10">
                <Calendar className="mr-2 h-5 w-5" />
                View Events
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Calendar Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">
              Upcoming Events
            </h2>
            <p className="text-base sm:text-lg text-gray-600 px-4 sm:px-0">
              Bitcoin meetups, workshops, and celebrations across the islands
            </p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto">
            {/* Event Cards */}
            <Card className="hover:shadow-lg transition-shadow border-caribbean-sand hover:border-caribbean-ocean/30">
              <CardHeader>
                <CardTitle className="text-caribbean-ocean">Bitcoin Beach BBQ</CardTitle>
                <CardDescription>Kingston, Jamaica • March 15</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Learn about Bitcoin while enjoying jerk chicken and island vibes. Perfect for beginners!
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-caribbean-palm">
                  <Users className="h-4 w-4" />
                  <span>25 attending</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-caribbean-sand hover:border-caribbean-ocean/30">
              <CardHeader>
                <CardTitle className="text-caribbean-ocean">Lightning Workshop</CardTitle>
                <CardDescription>Bridgetown, Barbados • March 22</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Hands-on workshop: Set up your first Lightning node and start accepting sats instantly.
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-caribbean-palm">
                  <Zap className="h-4 w-4" />
                  <span>Lightning Network</span>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-caribbean-sand hover:border-caribbean-ocean/30">
              <CardHeader>
                <CardTitle className="text-caribbean-ocean">Satoshi Saturdays</CardTitle>
                <CardDescription>Port of Spain, T&T • Every Saturday</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Weekly Bitcoin education sessions. Come learn, share, and orange pill your community!
                </p>
                <div className="mt-4 flex items-center gap-2 text-sm text-caribbean-palm">
                  <Calendar className="h-4 w-4" />
                  <span>Weekly Event</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10">
              View Full Calendar
            </Button>
          </div>
        </div>
      </section>

      {/* Media Gallery Preview */}
      <section className="py-12 sm:py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">
              Community Moments
            </h2>
            <p className="text-base sm:text-lg text-gray-600 px-4 sm:px-0">
              Capturing the spirit of Bitcoin adoption across the Caribbean
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="aspect-square bg-gradient-to-br from-caribbean-ocean/20 to-caribbean-sunset/20 rounded-lg overflow-hidden group cursor-pointer">
                <div className="w-full h-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Image className="w-12 h-12 text-caribbean-ocean/50" />
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10">
              <Image className="mr-2 h-4 w-4" />
              View Full Gallery
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-caribbean-ocean/5 border-t border-caribbean-sand">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">
                © 2024 Island Bitcoin. Built with ₿ and 🏝️
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Vibed with <Link to="https://soapbox.pub/tools/mkstack/" className="text-caribbean-ocean hover:underline">MKStack</Link>
              </p>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" className="text-caribbean-ocean hover:text-caribbean-ocean/80 text-xs sm:text-sm">
                About
              </Button>
              <Button variant="ghost" size="sm" className="text-caribbean-ocean hover:text-caribbean-ocean/80 text-xs sm:text-sm">
                Media Kit
              </Button>
              <Button variant="ghost" size="sm" className="text-caribbean-ocean hover:text-caribbean-ocean/80 text-xs sm:text-sm">
                Contact
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;