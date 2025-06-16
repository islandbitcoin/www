# Island Bitcoin

A sovereign Bitcoin community built on the decentralized Nostr protocol. Connect, learn, and build the future of money with fellow Bitcoiners worldwide.

## Features

### 🟠 Bitcoin-Focused Community
- Real-time Bitcoin price tracking
- Bitcoin-focused discussions and content
- Lightning Network integration
- Value 4 Value economy

### ⚡ Nostr Protocol Integration
- Censorship-resistant communication
- Decentralized identity and profiles
- Cross-platform compatibility
- No central authority or single point of failure

### 🎓 Educational Resources
- Comprehensive Bitcoin learning materials
- Lightning Network tutorials
- Nostr protocol documentation
- Security and self-custody guides

### 🌐 Community Features
- Real-time feed of Bitcoin discussions
- Community events and meetups
- User profiles and social interactions
- Lightning tips and zaps

## Technology Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for styling with Bitcoin orange theme
- **shadcn/ui** components for consistent UI
- **Nostrify** for Nostr protocol integration
- **TanStack Query** for data fetching and caching
- **React Router** for navigation

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Deploy to Nostr:
   ```bash
   npm run deploy
   ```

## Project Structure

- `src/components/` - Reusable UI components including Bitcoin-specific components
- `src/pages/` - Page components (Home, Community, Learn, Profile)
- `src/hooks/` - Custom React hooks for Nostr and Bitcoin data
- `src/lib/` - Utility functions
- `src/contexts/` - React context providers

## Key Components

### Bitcoin Integration
- `BitcoinPrice` - Real-time Bitcoin price display
- `BitcoinFeed` - Community feed filtered for Bitcoin content
- `IslandStats` - Community statistics and metrics

### Nostr Features
- `CreatePostForm` - Publish posts to Nostr network
- `Navigation` - App navigation with login/profile integration
- `ThemeToggle` - Light/dark mode switching

### Pages
- **Home** - Landing page with community overview
- **Community** - Social feed, channels, and events
- **Learn** - Educational resources for Bitcoin, Lightning, and Nostr
- **Profile** - User profile management and settings

## Nostr Integration

Island Bitcoin leverages the Nostr protocol for:

- **Decentralized Identity**: Users control their own keys and identity
- **Censorship Resistance**: No central authority can remove content
- **Cross-Platform**: Works with any Nostr client
- **Lightning Integration**: Native Bitcoin payments and tips

## Contributing

We welcome contributions to Island Bitcoin! Please feel free to submit issues, feature requests, or pull requests.

## License

MIT License - Built with freedom in mind.

---

*Vibed with [MKStack](https://soapbox.pub/tools/mkstack/)*