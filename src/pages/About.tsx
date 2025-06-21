import { useSeoMeta } from '@unhead/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Lock, 
  Zap, 
  Users, 
  Trophy, 
  Heart,
  Globe,
  Sparkles,
  Gamepad2,
  MessageSquare,
  TrendingUp,
  Copy,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { siteConfig } from '@/config/site.config';

export default function About() {
  useSeoMeta({
    title: `About - ${siteConfig.name}`,
    description: `Learn about the ${siteConfig.name} community and our mission to bring Bitcoin education to the Caribbean`,
  });

  const features = [
    {
      category: 'Security & Performance',
      icon: <Shield className="h-5 w-5" />,
      color: 'text-red-600',
      items: [
        'Encrypted local storage for all user data',
        'Rate limiting to prevent spam and abuse',
        'Content sanitization for XSS protection',
        'Optimized image loading with lazy loading',
        'Service worker for offline functionality',
        'Progressive Web App (PWA) ready'
      ]
    },
    {
      category: 'Privacy & Data Protection',
      icon: <Lock className="h-5 w-5" />,
      color: 'text-purple-600',
      items: [
        'All data stored locally - no servers required',
        'Tor relay support with .onion addresses',
        'NIP-44 encrypted direct messages',
        'Ephemeral messaging options',
        'Privacy mode disables tracking',
        'No analytics or third-party tracking'
      ]
    },
    {
      category: 'Easy Replication',
      icon: <Copy className="h-5 w-5" />,
      color: 'text-green-600',
      items: [
        'Zero configuration deployment',
        'One-click deployment scripts',
        'Works on any static hosting',
        'Environment-based customization',
        'Open source and forkable',
        'Comprehensive documentation'
      ]
    },
    {
      category: 'User Engagement',
      icon: <Trophy className="h-5 w-5" />,
      color: 'text-yellow-600',
      items: [
        'Daily streak tracking system',
        'Achievement badges and rewards',
        'Bitcoin education mini-games',
        'Gamification with XP and levels',
        'Real-time notifications',
        'Community leaderboards'
      ]
    }
  ];

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
              <Zap className="w-5 h-5 text-caribbean-mango" />
            </Link>
            <Link to="/">
              <Button variant="outline" className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <Badge className="mb-4" variant="secondary">
              <Globe className="h-3 w-3 mr-1" />
              {siteConfig.community.location}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold mb-6 bg-gradient-to-r from-caribbean-ocean via-caribbean-turquoise to-caribbean-palm bg-clip-text text-transparent">
              About {siteConfig.name}
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 leading-relaxed">
              We're building a thriving Bitcoin community across the Caribbean islands, 
              bringing financial sovereignty and education to our paradise. Our mission 
              is to make Bitcoin accessible, understandable, and useful for everyone 
              in the Caribbean.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-caribbean-ocean/20 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Heart className="h-6 w-6 text-caribbean-sunset" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700">
                  Island Bitcoin is dedicated to fostering Bitcoin adoption throughout 
                  the Caribbean by creating an inclusive, educational, and supportive 
                  community. We believe in:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-caribbean-ocean mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Community First</h4>
                      <p className="text-sm text-gray-600">
                        Building strong local networks and supporting each other's journey
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-caribbean-mango mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Education & Empowerment</h4>
                      <p className="text-sm text-gray-600">
                        Making Bitcoin knowledge accessible to everyone
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-caribbean-palm mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Local Impact</h4>
                      <p className="text-sm text-gray-600">
                        Driving real-world Bitcoin adoption in our communities
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-caribbean-sunset mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold">Financial Freedom</h4>
                      <p className="text-sm text-gray-600">
                        Empowering individuals with sovereign money
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Built for Communities, By Communities</h2>
              <p className="text-lg text-gray-600">
                Every feature is designed with security, privacy, and ease of replication in mind
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <Card key={feature.category} className="border-caribbean-sand hover:border-caribbean-ocean/30 transition-colors">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className={feature.color}>{feature.icon}</span>
                      {feature.category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {feature.items.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <ChevronRight className="h-4 w-4 text-caribbean-ocean mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Highlights */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Experience Island Bitcoin</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="text-center border-caribbean-sand hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <Gamepad2 className="h-12 w-12 mx-auto mb-4 text-caribbean-ocean" />
                  <h3 className="font-semibold mb-2">Learn & Earn</h3>
                  <p className="text-sm text-gray-600">
                    Play Bitcoin trivia and stacking games while learning
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-caribbean-sand hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-caribbean-mango" />
                  <h3 className="font-semibold mb-2">Connect Securely</h3>
                  <p className="text-sm text-gray-600">
                    Encrypted messages and Tor support for privacy
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center border-caribbean-sand hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <Trophy className="h-12 w-12 mx-auto mb-4 text-caribbean-sunset" />
                  <h3 className="font-semibold mb-2">Track Progress</h3>
                  <p className="text-sm text-gray-600">
                    Daily streaks and achievements to stay motivated
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-12 sm:py-16 bg-caribbean-ocean/5">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-4">Open Source & Community Driven</h2>
            <p className="text-gray-700 mb-8">
              Island Bitcoin is 100% open source. Fork it, customize it, and deploy 
              your own Bitcoin community website in minutes. No servers, no databases, 
              no configuration required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-caribbean-ocean hover:bg-caribbean-ocean/90">
                <Copy className="mr-2 h-4 w-4" />
                Fork on GitHub
              </Button>
              <Button variant="outline" className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10">
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Join the Island Bitcoin Movement
            </h2>
            <p className="text-lg text-gray-700 mb-8">
              Whether you're new to Bitcoin or a seasoned hodler, there's a place 
              for you in our community. Let's build the future of money together.
            </p>
            <Link to="/">
              <Button size="lg" className="bg-caribbean-sunset hover:bg-caribbean-sunset/90">
                Get Started
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-caribbean-sand bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2024 {siteConfig.name}. Built with ₿ and 🏝️
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Vibed with <Link to="https://soapbox.pub/tools/mkstack/" className="text-caribbean-ocean hover:underline">MKStack</Link>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}