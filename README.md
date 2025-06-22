# Island Bitcoin ⚡️ 🏝️

A Bitcoin Lightning Community, Events and gaming platform built for the Caribbean Bitcoin community. Earn sats by playing Bitcoin-themed games, participating in tournaments, and engaging with the community.

## 🎮 Features

### Games
- **Bitcoin Trivia**: Test your Bitcoin knowledge across different difficulty levels
- **Satoshi Stacker**: Click-based stacking game with achievements and power-ups
- **Leaderboards**: Daily, weekly, and all-time rankings

### Lightning Integration
- **Instant Payouts**: Earn real sats directly to your Lightning wallet
- **Pull Payments**: QR code-based withdrawals via BTCPay Server
- **Low Minimum**: Withdraw as little as 100 sats

### Community
- **Nostr Integration**: Social feed, direct messages, and notifications
- **Referral System**: Earn bonus sats for inviting friends
- **Achievements**: Unlock rewards for gameplay milestones
- **Media Gallery**: Share and view community moments

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git
- A Nostr key pair (for login)
- (Optional) BTCPay Server instance for pull payments

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/islandbitcoin-web.git
cd islandbitcoin-web/public_html

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

### First-Time Setup

1. Visit `http://localhost:5173`
2. Click "Login" and connect with your Nostr account
3. Navigate to `/admin-setup` to claim admin access (first user only)
4. Configure game rewards, payout limits, and BTCPay integration

## 📚 Documentation

### Project Documentation
- [**ROADMAP.md**](./ROADMAP.md) - Development priorities and upcoming features
- [**CLAUDE.md**](./CLAUDE.md) - AI assistant instructions and project context
- [**DEPLOYMENT.md**](./DEPLOYMENT.md) - Production deployment guide
- [**CDN_DEPLOYMENT.md**](./CDN_DEPLOYMENT.md) - CDN and caching setup

### Technical Documentation
- [**Architecture Overview**](#architecture-overview) - System design and components
- [**API Reference**](#api-reference) - Backend endpoints and integration
- [**Component Library**](#component-library) - UI components and patterns

## 🏗️ Architecture Overview

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS, shadcn/ui
- **State**: TanStack Query, Context API
- **Social**: Nostrify (Nostr protocol)
- **Payments**: Lightning Network, BTCPay Server
- **Storage**: LocalStorage with encryption

### Project Structure
```
src/
├── components/          # UI components
│   ├── games/          # Game components
│   ├── social/         # Nostr social features
│   ├── financial/      # Payment/wallet UI
│   ├── admin/          # Admin panel
│   └── common/         # Shared components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
│   └── wallet/         # Modular wallet services
├── pages/              # Route components
└── contexts/           # React contexts
```

### Key Services
- **Game Wallet Manager**: Handles balances, payouts, and configuration
- **Config Sync Service**: Synchronizes settings across browsers
- **Referral System**: Tracks invites and rewards
- **Achievement System**: Gamification and progress tracking

## 🔧 Configuration

### Environment Variables
```env
# API Configuration
VITE_CONFIG_SYNC_URL=http://localhost:3001
VITE_CONFIG_SYNC_KEY=your-secret-key

# Feature Flags
VITE_ENABLE_TOURNAMENTS=false
VITE_ENABLE_PUSH_NOTIFICATIONS=false
```

### Game Configuration
Configure rewards and limits through the admin panel:
- Daily payout limits (total and per-user)
- Game reward amounts
- Minimum withdrawal threshold
- Rate limiting settings

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- BitcoinTrivia.test.tsx

# Coverage report
npm run test:coverage
```

## 🚢 Deployment

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

## 🛡️ Security

- **Input Validation**: All user inputs are sanitized
- **Rate Limiting**: Prevents abuse and spam
- **CORS Configuration**: Restricts API access
- **Content Security Policy**: XSS protection
- **Encrypted Storage**: Sensitive data encryption

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Keep commits focused and atomic

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [MKStack](https://soapbox.pub/tools/mkstack/)
- Powered by [Nostrify](https://nostrify.dev/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Bitcoin icons by [Bitcoin Design](https://bitcoin.design/)

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/islandbitcoin/islandbitcoin-web/issues)
- **Nostr**: Contact us on Nostr at `npub1...`
- **Community**: Join our [Telegram group](https://t.me/islandbitcoin)

---

Made with ₿ and 🏝️ by the Island Bitcoin community
