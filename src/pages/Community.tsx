import { useSeoMeta } from '@unhead/react';
import { useState } from 'react';
import { Users, MessageCircle, Calendar, Zap, Plus, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoginArea } from '@/components/auth/LoginArea';
import { CreateAccountButton } from '@/components/CreateAccountButton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { BitcoinFeed } from '@/components/BitcoinFeed';
import { CreatePostForm } from '@/components/CreatePostForm';
import { Navigation } from '@/components/Navigation';

const Community = () => {
  const { user } = useCurrentUser();
  const [activeTab, setActiveTab] = useState('feed');

  useSeoMeta({
    title: 'Community - Island Bitcoin',
    description: 'Join the Island Bitcoin community discussions, events, and connect with fellow Bitcoiners worldwide.',
  });

  const upcomingEvents = [
    {
      title: "Bitcoin Lightning Workshop",
      date: "2024-01-15",
      time: "18:00 UTC",
      type: "Workshop",
      attendees: 42,
      description: "Learn to set up and manage Lightning Network channels"
    },
    {
      title: "Nostr Development Meetup",
      date: "2024-01-20",
      time: "16:00 UTC",
      type: "Meetup",
      attendees: 28,
      description: "Building decentralized applications on Nostr"
    },
    {
      title: "Bitcoin Security Best Practices",
      date: "2024-01-25",
      time: "19:00 UTC",
      type: "Education",
      attendees: 67,
      description: "Advanced self-custody and operational security"
    }
  ];

  const communityChannels = [
    {
      name: "General Discussion",
      description: "Open discussions about Bitcoin, economics, and freedom",
      members: 1247,
      recent: "2 min ago",
      tags: ["bitcoin", "general"]
    },
    {
      name: "Lightning Network",
      description: "Technical discussions about Lightning Network",
      members: 892,
      recent: "5 min ago",
      tags: ["lightning", "technical"]
    },
    {
      name: "Nostr Development",
      description: "Building applications on the Nostr protocol",
      members: 634,
      recent: "12 min ago",
      tags: ["nostr", "development"]
    },
    {
      name: "Mining & Hardware",
      description: "Bitcoin mining, hardware, and infrastructure",
      members: 756,
      recent: "18 min ago",
      tags: ["mining", "hardware"]
    },
    {
      name: "Education & Onboarding",
      description: "Help newcomers learn about Bitcoin",
      members: 1089,
      recent: "25 min ago",
      tags: ["education", "beginners"]
    },
    {
      name: "Local Meetups",
      description: "Organize and find Bitcoin meetups in your area",
      members: 445,
      recent: "1 hour ago",
      tags: ["meetups", "local"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="text-center md:text-left mb-6 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
                Community
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300">
                Connect with Bitcoiners worldwide on the decentralized Nostr network
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search discussions..." 
                  className="pl-10 w-64"
                />
              </div>
              {user ? (
                <LoginArea className="max-w-48" />
              ) : (
                <CreateAccountButton 
                  onAccountCreated={() => setActiveTab('feed')}
                  className="max-w-48"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="feed" className="flex items-center space-x-2">
              <MessageCircle className="w-4 h-4" />
              <span>Feed</span>
            </TabsTrigger>
            <TabsTrigger value="channels" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Channels</span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>Events</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="feed">
            <div className="grid lg:grid-cols-4 gap-8">
              <div className="lg:col-span-3">
                {user && (
                  <div className="mb-8">
                    <CreatePostForm />
                  </div>
                )}
                <BitcoinFeed />
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Community Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Active Members</span>
                      <span className="font-semibold">2,847</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Posts Today</span>
                      <span className="font-semibold">156</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Lightning Tips</span>
                      <span className="font-semibold">1,234 sats</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Trending Topics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Badge variant="secondary" className="mr-2">#bitcoin</Badge>
                      <Badge variant="secondary" className="mr-2">#lightning</Badge>
                      <Badge variant="secondary" className="mr-2">#nostr</Badge>
                      <Badge variant="secondary" className="mr-2">#sovereignty</Badge>
                      <Badge variant="secondary" className="mr-2">#freedom</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="channels">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communityChannels.map((channel, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg mb-2">{channel.name}</CardTitle>
                        <CardDescription className="mb-3">{channel.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {channel.members.toLocaleString()} members
                      </span>
                      <span>Active {channel.recent}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {channel.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full">
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Join Channel
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {upcomingEvents.map((event, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                          <CardDescription className="mb-3">{event.description}</CardDescription>
                        </div>
                        <Badge variant={event.type === 'Workshop' ? 'default' : event.type === 'Meetup' ? 'secondary' : 'outline'}>
                          {event.type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {event.date} at {event.time}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {event.attendees} attending
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex space-x-3">
                        <Button className="flex-1">
                          <Plus className="w-4 h-4 mr-2" />
                          Join Event
                        </Button>
                        <Button variant="outline">
                          <Zap className="w-4 h-4 mr-2" />
                          Tip Organizer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Create Event</CardTitle>
                    <CardDescription>
                      Organize a Bitcoin meetup or educational session
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Event Calendar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                      <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-sm">Calendar integration coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;