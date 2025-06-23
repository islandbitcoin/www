# Release Notes - Island Bitcoin v2.0.0

## 🚀 Major Release: Proof of Work Rewards & Enhanced Admin Controls

We're excited to announce Island Bitcoin v2.0.0, featuring real Bitcoin rewards through Lightning Network integration and enhanced administrative controls for game management.

### 🎮 Satoshi Stacker: Now with Real Bitcoin Rewards!

The Satoshi Stacker game has been completely revamped with a proof-of-work reward system:

- **Earn Real Sats**: Achieve high scores and claim Lightning rewards
- **7 Reward Tiers**: From 1 sat (100 points) to 210 sats (100,000+ points)
- **Proof of Work**: SHA-256 mining prevents bots and ensures fair play
- **Instant Payouts**: Enter your Lightning address and receive sats immediately

### 🔒 Enhanced Security & Admin Controls

- **Game Visibility Management**: Admins can now control which games are available
- **Hidden by Default**: Satoshi Stacker with rewards is disabled until admin activation
- **Improved Admin Panel**: New "Games" tab for managing feature availability

### ⚡ Performance Improvements

- **Optimized Builds**: Faster load times with code splitting and chunking
- **Production Ready**: All debug code removed, minified assets
- **Better Caching**: Vendor libraries separated for improved browser caching

### 🛠️ Technical Enhancements

- **TypeScript Improvements**: Enhanced type safety throughout
- **Console Cleanup**: All development logs removed for production
- **Build Optimization**: Terser minification with advanced compression

### 📋 Admin Setup Guide

1. Access the admin panel at `/admin`
2. Navigate to the new "Games" tab
3. Toggle "Satoshi Stacker" to enable the game with rewards
4. Configure your Lightning backend (see `LIGHTNING_REWARDS_SETUP.md`)

### 🔧 For Developers

- Review `CHANGELOG.md` for complete technical details
- Check `LIGHTNING_REWARDS_SETUP.md` for backend integration
- Update your `.env` file with new configuration options

### 🙏 Thank You

Special thanks to our community for testing and feedback. This release represents a major step forward in gamifying Bitcoin education while maintaining security and fairness.

### 📝 Upgrade Instructions

```bash
# Pull the latest changes
git pull origin main

# Install dependencies
npm install

# Build for production
npm run build

# Deploy
npm run deploy
```

### ⚠️ Breaking Changes

- Game wallet configuration structure updated
- Satoshi Stacker hidden by default
- Minimum Node.js version: 20.x

---

**Full Changelog**: https://github.com/yourusername/islandbitcoin-web/releases/tag/v2.0.0