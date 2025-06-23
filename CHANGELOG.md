# Changelog

All notable changes to the Island Bitcoin project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2024-06-23

### 🎮 Major Features

#### Proof of Work Bitcoin Rewards System
- **Satoshi Stacker Game Enhancement**: Implemented a complete proof-of-work based reward system
  - Players can now earn real Bitcoin (Lightning sats) by achieving high scores
  - SHA-256 proof-of-work algorithm with adjustable difficulty based on score
  - 7 reward tiers ranging from 1 sat (100 points) to 210 sats (100k+ points)
  - Anti-cheat measures including rate limiting and claim tracking
  - Lightning address integration for instant payouts

#### Enhanced Admin Controls
- **Game Visibility Management**: New admin panel tab for controlling game availability
  - Satoshi Stacker game is now hidden by default
  - Admins can toggle game visibility from the admin dashboard
  - Improved security by limiting access to experimental features

### 🚀 Performance Optimizations
- **Production Build Optimization**
  - Implemented code splitting with manual chunks for better caching
  - Added terser minification with console statement removal
  - Optimized bundle sizes with vendor chunking
  - Source maps enabled for production debugging

### 🔧 Technical Improvements
- **Code Quality**
  - Removed all debug and console.log statements for production
  - Enhanced TypeScript type safety throughout the codebase
  - Improved error handling and user feedback

### 📚 Documentation
- **Lightning Rewards Setup Guide**: Comprehensive documentation for backend integration
- **Updated Configuration**: Added game visibility settings to wallet configuration
- **API Documentation**: Detailed specs for Lightning reward endpoints

### 🐛 Bug Fixes
- Fixed event filtering issue where draft events were being displayed
- Resolved TypeScript errors in game components
- Fixed rate limiting edge cases in reward claims

### 💔 Breaking Changes
- Game wallet configuration now requires `gameVisibility` object
- Satoshi Stacker is hidden by default (requires admin activation)
- Minimum Node.js version: 20.x

### 🔒 Security
- Enhanced admin authentication flow
- Improved rate limiting for game rewards
- Secure storage for sensitive game state data

### 📦 Dependencies
- Added `terser` for production build optimization
- Updated Nostr protocol dependencies
- Enhanced wallet service architecture

### 🎯 Migration Guide
1. Run database migrations to add game visibility settings
2. Update environment variables for Lightning integration (see `.env.example`)
3. Configure BTCPay Server or Lightning node for reward payouts
4. Grant admin access to manage game visibility

### 🙏 Acknowledgments
- Thanks to the Nostr community for protocol guidance
- Lightning Network developers for payment infrastructure
- All contributors who helped test the proof-of-work system

---

## Previous Versions

### [1.0.0] - Initial Release
- Bitcoin education games platform
- Nostr protocol integration
- Basic trivia game functionality
- User authentication via Nostr
- Community features