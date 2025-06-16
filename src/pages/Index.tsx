import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Bitcoin, Zap, Shield, Users, TrendingUp, Globe, MessageCircle, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { BitcoinFeed } from '@/components/BitcoinFeed';
import { IslandStats } from '@/components/IslandStats';
import { Navigation } from '@/components/Navigation';

const Index = () => {
  const { user } = useCurrentUser();

  useSeoMeta({
    title: 'Island Bitcoin - Sovereign Bitcoin Community',
    description: 'Join the Island Bitcoin community - a sovereign Bitcoin ecosystem built on Nostr. Connect, learn, and build the future of money.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
              <Zap className="w-3 h-3 mr-1" />
              Powered by Nostr Protocol
            </Badge>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
              Island Bitcoin
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
              A sovereign Bitcoin community where freedom, privacy, and sound money converge. 
              Built on the decentralized Nostr protocol for true censorship resistance.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white px-8 py-3">
                <Link to="/community">
                  <Users className="w-5 h-5 mr-2" />
                  Join the Community
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8 py-3">
                <Link to="/learn">
                  <Globe className="w-5 h-5 mr-2" />
                  Learn About Bitcoin
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <IslandStats />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              Why Island Bitcoin?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Experience Bitcoin the way it was meant to be - free, open, and sovereign.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Censorship Resistant</CardTitle>
                <CardDescription>
                  Built on Nostr protocol ensuring your voice can never be silenced or your content removed.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Lightning Fast</CardTitle>
                <CardDescription>
                  Instant Bitcoin transactions and real-time communication through Lightning Network integration.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Global Community</CardTitle>
                <CardDescription>
                  Connect with Bitcoin enthusiasts, developers, and advocates from around the world.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Market Insights</CardTitle>
                <CardDescription>
                  Real-time Bitcoin price data, market analysis, and educational content from experts.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <MessageCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Open Discussions</CardTitle>
                <CardDescription>
                  Engage in meaningful conversations about Bitcoin, economics, and financial sovereignty.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center mb-4">
                  <Coins className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <CardTitle>Value 4 Value</CardTitle>
                <CardDescription>
                  Support creators and valuable content through Bitcoin micropayments and Lightning tips.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Community Feed */}
      {user && (
        <section className="py-20 px-4 bg-white/50 dark:bg-gray-800/50">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
                Community Feed
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                Latest discussions from the Island Bitcoin community
              </p>
            </div>
            <BitcoinFeed />
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg flex items-center justify-center">
                  <Bitcoin className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">Island Bitcoin</span>
              </div>
              <p className="text-gray-400 mb-4 max-w-md">
                Building a sovereign Bitcoin community on the decentralized Nostr protocol. 
                Join us in creating the future of money and freedom.
              </p>
              <p className="text-sm text-gray-500">
                Vibed with <a href="https://soapbox.pub/tools/mkstack/" className="text-orange-400 hover:text-orange-300 underline">MKStack</a>
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Community</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Discussions</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Events</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Resources</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Learn</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">What is Bitcoin?</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Nostr Protocol</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Lightning Network</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Self Custody</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Island Bitcoin. Built with freedom in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
