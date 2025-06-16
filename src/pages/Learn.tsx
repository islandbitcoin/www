import { useSeoMeta } from '@unhead/react';
import { Book, Play, ExternalLink, Bitcoin, Zap, Shield, Globe } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation } from '@/components/Navigation';

const Learn = () => {
  useSeoMeta({
    title: 'Learn Bitcoin - Island Bitcoin',
    description: 'Comprehensive Bitcoin education covering basics, Lightning Network, self-custody, and the Nostr protocol.',
  });

  const bitcoinBasics = [
    {
      title: "What is Bitcoin?",
      description: "Understanding the fundamentals of digital sound money",
      level: "Beginner",
      duration: "10 min read",
      topics: ["Digital scarcity", "Decentralization", "Proof of Work", "21 million cap"]
    },
    {
      title: "How Bitcoin Works",
      description: "The technical foundations of the Bitcoin network",
      level: "Intermediate",
      duration: "15 min read",
      topics: ["Blockchain", "Mining", "Transactions", "Cryptography"]
    },
    {
      title: "Bitcoin vs Traditional Money",
      description: "Why Bitcoin is superior to fiat currencies",
      level: "Beginner",
      duration: "8 min read",
      topics: ["Inflation", "Central banking", "Store of value", "Monetary policy"]
    }
  ];

  const lightningResources = [
    {
      title: "Lightning Network Basics",
      description: "Instant, low-cost Bitcoin payments",
      level: "Intermediate",
      duration: "12 min read",
      topics: ["Payment channels", "Routing", "Liquidity", "Node operation"]
    },
    {
      title: "Setting Up Your Lightning Wallet",
      description: "Get started with Lightning payments",
      level: "Beginner",
      duration: "5 min read",
      topics: ["Wallet selection", "Channel management", "Backup", "Security"]
    },
    {
      title: "Running a Lightning Node",
      description: "Become part of the Lightning Network infrastructure",
      level: "Advanced",
      duration: "30 min read",
      topics: ["Node setup", "Channel management", "Routing fees", "Maintenance"]
    }
  ];

  const nostrResources = [
    {
      title: "What is Nostr?",
      description: "The censorship-resistant social protocol",
      level: "Beginner",
      duration: "8 min read",
      topics: ["Decentralization", "Relays", "Keys", "Clients"]
    },
    {
      title: "Nostr and Bitcoin Integration",
      description: "How Nostr enhances Bitcoin adoption",
      level: "Intermediate",
      duration: "10 min read",
      topics: ["Lightning tips", "Value 4 Value", "Zaps", "Bitcoin content"]
    },
    {
      title: "Building on Nostr",
      description: "Developer guide to Nostr applications",
      level: "Advanced",
      duration: "25 min read",
      topics: ["NIPs", "Event kinds", "Relay implementation", "Client development"]
    }
  ];

  const securityResources = [
    {
      title: "Self-Custody Fundamentals",
      description: "Be your own bank with Bitcoin",
      level: "Beginner",
      duration: "15 min read",
      topics: ["Private keys", "Hardware wallets", "Seed phrases", "Best practices"]
    },
    {
      title: "Advanced Security Practices",
      description: "Protecting large amounts of Bitcoin",
      level: "Advanced",
      duration: "20 min read",
      topics: ["Multisig", "Cold storage", "Operational security", "Estate planning"]
    },
    {
      title: "Common Security Mistakes",
      description: "Learn from others' mistakes",
      level: "Intermediate",
      duration: "10 min read",
      topics: ["Exchange risks", "Phishing", "Social engineering", "Recovery"]
    }
  ];

  function ResourceCard({ resource }: { resource: typeof bitcoinBasics[0] }) {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">{resource.title}</CardTitle>
              <CardDescription className="mb-3">{resource.description}</CardDescription>
            </div>
            <Badge variant={resource.level === 'Beginner' ? 'default' : resource.level === 'Intermediate' ? 'secondary' : 'outline'}>
              {resource.level}
            </Badge>
          </div>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <Book className="w-4 h-4 mr-1" />
              {resource.duration}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {resource.topics.map((topic) => (
              <Badge key={topic} variant="outline" className="text-xs">
                {topic}
              </Badge>
            ))}
          </div>
          <Button className="w-full">
            <Play className="w-4 h-4 mr-2" />
            Start Learning
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Navigation />
      
      {/* Header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 via-yellow-500 to-orange-600 bg-clip-text text-transparent">
              Learn Bitcoin
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Master Bitcoin, Lightning Network, and Nostr with our comprehensive educational resources
            </p>
          </div>
        </div>
      </div>

      {/* Learning Paths */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <Tabs defaultValue="bitcoin" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="bitcoin" className="flex items-center space-x-2">
                <Bitcoin className="w-4 h-4" />
                <span>Bitcoin</span>
              </TabsTrigger>
              <TabsTrigger value="lightning" className="flex items-center space-x-2">
                <Zap className="w-4 h-4" />
                <span>Lightning</span>
              </TabsTrigger>
              <TabsTrigger value="nostr" className="flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>Nostr</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Security</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="bitcoin">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bitcoinBasics.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="lightning">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lightningResources.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="nostr">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {nostrResources.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="security">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {securityResources.map((resource, index) => (
                  <ResourceCard key={index} resource={resource} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* External Resources */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-800/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
              Recommended External Resources
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Curated links to the best Bitcoin education across the web
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Bitcoin.org
                  <ExternalLink className="w-4 h-4" />
                </CardTitle>
                <CardDescription>
                  Official Bitcoin documentation and getting started guide
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Visit Site
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  The Bitcoin Standard
                  <ExternalLink className="w-4 h-4" />
                </CardTitle>
                <CardDescription>
                  Essential book on Bitcoin's economic principles by Saifedean Ammous
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Get Book
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Lightning Labs
                  <ExternalLink className="w-4 h-4" />
                </CardTitle>
                <CardDescription>
                  Technical resources and tools for Lightning Network development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Explore
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Nostr.com
                  <ExternalLink className="w-4 h-4" />
                </CardTitle>
                <CardDescription>
                  Complete guide to the Nostr protocol and ecosystem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Casa Security Guide
                  <ExternalLink className="w-4 h-4" />
                </CardTitle>
                <CardDescription>
                  Comprehensive Bitcoin security and self-custody practices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Read Guide
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Bitcoin Magazine
                  <ExternalLink className="w-4 h-4" />
                </CardTitle>
                <CardDescription>
                  Latest Bitcoin news, analysis, and educational content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  Read Articles
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Learn;