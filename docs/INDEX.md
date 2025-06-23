# Island Bitcoin Documentation Index

Welcome to the Island Bitcoin documentation! This guide will help you navigate through all available documentation.

## 📖 Core Documentation

### Getting Started
- [**README.md**](../README.md) - Project overview, features, and quick start guide
- [**ROADMAP.md**](./ROADMAP.md) - Development priorities and upcoming features

### Architecture & Development
- [**ARCHITECTURE.md**](./ARCHITECTURE.md) - System design, component architecture, and technical details
- [**CLAUDE.md**](./CLAUDE.md) - AI assistant context and development guidelines

### Deployment
- [**DEPLOYMENT.md**](./DEPLOYMENT.md) - DigitalOcean Droplet deployment guide with Docker
- [**APP_PLATFORM_DEPLOYMENT.md**](./APP_PLATFORM_DEPLOYMENT.md) - DigitalOcean App Platform deployment (GitHub auto-deploy)

## 🏗️ Technical Documentation

### System Design
- [**Architecture Details**](./ARCHITECTURE.md) - Component architecture and service design
- State management patterns
- Error handling strategies
- Performance optimization

### API Documentation
- [**API Reference**](./API.md) - All API endpoints and integrations
- Config sync server
- BTCPay Server integration
- Nostr protocol usage
- Lightning Network flows

## 🎮 Feature Documentation

### Games
- Bitcoin Trivia game mechanics
- Satoshi Stacker gameplay
- Leaderboard system
- Achievement framework

### Lightning Integration
- Wallet connection process
- Payout calculation logic
- Pull payment generation
- Balance management

### Social Features
- Nostr feed integration
- Direct messaging
- Referral system
- Media gallery

## 🔧 Technical Guides

### Configuration
- Environment variables (see `.env.example`)
- Game reward settings
- Rate limiting configuration
- Admin panel usage

### Security
- Authentication flow
- API security measures
- Data encryption
- CORS and CSP policies

### Performance
- Code splitting strategy
- Lazy loading implementation
- Caching mechanisms with Redis
- Bundle optimization

## 🐳 Docker & Deployment

### Unified Architecture
- Single Node.js server for frontend and API
- Redis caching layer
- Optional Nginx for SSL termination
- Optimized for DigitalOcean VPS deployment

### Key Features
- Health monitoring endpoints
- Automated backup strategies
- Resource optimization
- SSL/TLS configuration guides

## 📚 Additional Resources

### External Documentation
- [Nostrify Documentation](https://nostrify.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [BTCPay Server API](https://docs.btcpayserver.org/API/Greenfield/v1/)
- [Lightning Network Specs](https://github.com/lightning/bolts)

### Community Resources
- [Island Bitcoin GitHub](https://github.com/islandbitcoin)
- [Bitcoin Design Guide](https://bitcoin.design/)
- [Nostr Protocol (NIPs)](https://github.com/nostr-protocol/nips)

## 🤝 Contributing to Documentation

When adding new documentation:
1. Place technical docs in `/docs` directory
2. Update this INDEX.md with new entries
3. Follow markdown best practices
4. Include code examples where relevant
5. Keep documentation up-to-date with code changes

## 📊 Documentation Status

| Document | Last Updated | Status |
|----------|--------------|--------|
| README.md | June 2024 | ✅ Current |
| INDEX.md | June 2024 | ✅ Current |
| ROADMAP.md | March 2024 | ✅ Current |
| ARCHITECTURE.md | March 2024 | ✅ Current |
| API.md | March 2024 | ✅ Current |
| DEPLOYMENT.md | June 2024 | ✅ Current |
| CLAUDE.md | March 2024 | ✅ Current |

---

*For questions about documentation, please open an issue on GitHub.*