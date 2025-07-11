import { useSeoMeta } from "@unhead/react";
import { Button } from "@/components/ui/button";
import { Calendar, Image, Menu, Settings as SettingsIcon } from "lucide-react";
import { useState } from "react";
import { LoginArea } from "@/components/auth/LoginArea";
import { Link } from "react-router-dom";
import { NotificationBell, DirectMessages, ContactButton } from "@/components/social";
import { CommunityFeedSidebar } from "@/components/sidebar/CommunityFeedSidebar";
import { RelayStatusIndicator } from "@/components/common/RelayStatusIndicator";
import { siteConfig } from "@/config/site.config";
import { CommunityMomentsGallery } from "@/components/common";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { BitcoinGames } from "@/components/lazy";
import { LazyWrapper, loadingSkeletons } from "@/components/LazyWrapper";
import { GameErrorBoundary } from "@/components/ErrorBoundary";
import { UpcomingEvents } from "@/components/events";

const Index = () => {
  useSeoMeta({
    title: `${siteConfig.name} - ${siteConfig.community.location} Bitcoin Community`,
    description: siteConfig.description,
  });

  const [isNostrFeedOpen, setIsNostrFeedOpen] = useState(false);
  const { user } = useCurrentUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-caribbean-sand via-white to-caribbean-sand/30">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-caribbean-sand">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="https://raw.githubusercontent.com/islandbitcoin/islandbitcoin-community/4cfeb962c33fff5e6f5561c37ddca3c469c25793/gallery/Island%20Bitcoin%20Logo.jpg"
                alt="Island Bitcoin Logo"
                className="h-16 w-16 rounded-full"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <RelayStatusIndicator className="hidden sm:flex" />
              {user && (
                <>
                  <DirectMessages />
                  <NotificationBell />
                  <Link to="/settings">
                    <Button variant="ghost" size="icon" className="text-caribbean-ocean hover:text-caribbean-ocean/80">
                      <SettingsIcon className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}
              <LoginArea className="max-w-40" />
              <Button
                variant="outline"
                size="icon"
                className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10"
                onClick={() => setIsNostrFeedOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
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
              {siteConfig.tagline}
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl mb-6 sm:mb-8 text-gray-700 px-4 sm:px-0">{siteConfig.description}</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="bg-caribbean-sunset hover:bg-caribbean-sunset/90 text-white font-semibold px-8"
                onClick={() => setIsNostrFeedOpen(true)}
              >
                Join the Community
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10"
                onClick={() => {
                  document.getElementById("events-section")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <Calendar className="mr-2 h-5 w-5" />
                View Events
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Events Calendar Section */}
      <section id="events-section" className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">Upcoming Events</h2>
            <p className="text-base sm:text-lg text-gray-600 px-4 sm:px-0">Bitcoin meetups, workshops, and celebrations across the islands</p>
          </div>

          <LazyWrapper fallback={loadingSkeletons.default}>
            <UpcomingEvents className="max-w-6xl mx-auto" />
          </LazyWrapper>

          <div className="text-center mt-8 space-y-4">
            <Link to="/events">
              <Button variant="default" className="bg-caribbean-ocean hover:bg-caribbean-ocean/90">
                See All Events
              </Button>
            </Link>
            <div>
              <a
                href={`https://github.com/islandbitcoin/islandbitcoin-community/issues/new?title=Event%20Submission:%20[Your%20Event%20Name]&body=${encodeURIComponent(`## Event Submission Template

**Event Name:** Satoshi Saturdays

**Country, Location:** Port of Spain, T&T

**Date and Time:** Every Saturday

**Description:** 
Weekly Bitcoin education sessions. Come learn, share, and orange pill your community!

**Event Type:** 
- [ ] One-time event
- [x] Recurring event
- [ ] Workshop
- [ ] Conference
- [ ] Meetup
- [ ] Other: ___________

**Target Audience:**
- [x] Beginners
- [x] Intermediate
- [ ] Advanced
- [x] All levels

**Topics Covered:**
- Bitcoin basics
- Lightning Network
- Self-custody
- [Add more topics]

**Registration/RSVP Link:** [If applicable]

**Cost:** Free / [Specify if paid]

**Contact Information:**
- Organizer Name: 
- Nostr npub: 
- Email/Other: 

**Additional Details:**
[Any other information attendees should know]

**Tags:** Weekly Event, Bitcoin, Trinidad

---
*Please fill out all applicable fields above and submit this issue. We'll review and add your event to Island Bitcoin!*`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10">
                Submit an Event
              </Button>
            </a>
            </div>
          </div>
        </div>
      </section>

      {/* Media Gallery Preview */}
      <section className="py-12 sm:py-16 bg-white/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4 text-gray-900">Community Moments</h2>
            <p className="text-base sm:text-lg text-gray-600 px-4 sm:px-0">Capturing the spirit of Bitcoin adoption across the Caribbean</p>
          </div>

          <LazyWrapper fallback={loadingSkeletons.default}>
            <CommunityMomentsGallery className="max-w-6xl mx-auto" />
          </LazyWrapper>

          <div className="text-center mt-8">
            <a
              href={`https://github.com/islandbitcoin/islandbitcoin-community/issues/new?title=Media%20Submission:%20[Your%20Title]&body=${encodeURIComponent(`## Media Submission Template

**Media Title:** [e.g., Bitcoin Beach Meetup]

**Media Type:**
- [ ] Photo
- [ ] Video
- [ ] Album (multiple photos)
- [ ] Other: ___________

**Description:** 
[Describe what's happening in the media]

**Event/Location:** [Where was this taken?]

**Date:** [When was this taken?]

**Media Links:**
- Primary: [Link to high-resolution version]
- Thumbnail: [Link to thumbnail version if available]
- Additional: [Any other versions/angles]

**Credits:**
- Photographer/Videographer: 
- Permission to use: [ ] Yes [ ] No

**Tags:** [e.g., Meetup, Jamaica, Lightning, Education]

**Context:**
[Any additional context about the moment captured]

---
*Please ensure you have permission to share this media and that it represents the Bitcoin community positively. We'll review and potentially add it to Island Bitcoin's gallery!*`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="border-caribbean-ocean text-caribbean-ocean hover:bg-caribbean-ocean/10">
                <Image className="mr-2 h-4 w-4" />
                Submit Media
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Bitcoin Games Section */}
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <GameErrorBoundary>
            <LazyWrapper fallback={loadingSkeletons.game}>
              <BitcoinGames />
            </LazyWrapper>
          </GameErrorBoundary>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 bg-caribbean-ocean/5 border-t border-caribbean-sand">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-gray-600">© 2024 {siteConfig.name}. Built with ₿ and 🏝️</p>
              <p className="text-xs text-gray-500 mt-1">
                Vibed with{" "}
                <Link to="https://soapbox.pub/tools/mkstack/" className="text-caribbean-ocean hover:underline">
                  MKStack
                </Link>
              </p>
            </div>
            <div className="flex gap-2 sm:gap-4">
              <Link to="/about">
                <Button variant="ghost" size="sm" className="text-caribbean-ocean hover:text-caribbean-ocean/80 text-xs sm:text-sm">
                  About
                </Button>
              </Link>
              <a href="https://github.com/islandbitcoin/islandbitcoin-community/tree/main/mediakit" target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="text-caribbean-ocean hover:text-caribbean-ocean/80 text-xs sm:text-sm">
                  Media Kit
                </Button>
              </a>
              <ContactButton variant="ghost" size="sm" className="text-caribbean-ocean hover:text-caribbean-ocean/80 text-xs sm:text-sm" />
            </div>
          </div>
        </div>
      </footer>

      {/* Community Feed Sidebar */}
      <CommunityFeedSidebar isOpen={isNostrFeedOpen} onOpenChange={setIsNostrFeedOpen} />
    </div>
  );
};

export default Index;
