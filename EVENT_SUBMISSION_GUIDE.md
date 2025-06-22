# Event Submission Guide

Welcome to the Island Bitcoin Event Submission Guide! This document explains how to submit events for publication on our platform.

## Quick Start

1. Choose a template:
   - **Simple Template** (`event-template-simple.json`) - For basic meetups and workshops
   - **Full Template** (`event-template.json`) - For conferences and complex events

2. Fill out the required fields (marked with *)

3. Submit via GitHub issue at: https://github.com/islandbitcoin/islandbitcoin-community/issues

## Template Formats

### Simple Template
Perfect for:
- Regular meetups
- Single workshops
- Social gatherings
- Online events

Required fields only:
- Event title and description
- Date, time, and timezone
- Location (physical address or online link)
- Registration details
- Organizer contact info
- Event banner image

### Full Template
Ideal for:
- Multi-day conferences
- Events with multiple speakers
- Sponsored events
- Events requiring detailed scheduling
- Hybrid events (in-person + online)

Additional features:
- Detailed scheduling with agenda
- Speaker profiles
- Sponsor information
- Registration fees and early-bird pricing
- Livestreaming details
- Catering information
- Emergency contacts
- Success metrics

## Field Guidelines

### Event Types
- `meetup` - Informal gatherings, networking events
- `workshop` - Hands-on learning sessions
- `conference` - Multi-speaker, formal events
- `hackathon` - Coding/building events
- `social` - Parties, dinners, casual gatherings
- `online` - Virtual-only events
- `hybrid` - Both in-person and online

### Date/Time Format
- Dates: `YYYY-MM-DD` (e.g., 2024-04-15)
- Times: `HH:MM` in 24-hour format (e.g., 18:00)
- Full datetime: `YYYY-MM-DDTHH:mm:ssZ` (e.g., 2024-04-15T18:00:00-04:00)
- Always include timezone

### Image Requirements
- Featured image: 1920x1080px recommended
- Thumbnail: 600x400px recommended
- Format: JPG, PNG, or WebP
- File size: Under 2MB
- Upload to: `/events` folder in the repository

### Location Details
- Include full address for physical events
- Add directions or landmarks if helpful
- For online events, specify platform and include backup URL
- Consider adding parking/transit information

### Registration
- Clearly state if registration is required
- Provide direct registration link or email
- Include capacity limits
- Specify any fees (accept Bitcoin/Lightning when possible!)

## Submission Process

1. **Prepare Your Event Data**
   - Download the appropriate template
   - Fill in all required fields
   - Validate JSON format (use jsonlint.com)

2. **Prepare Media Files**
   - Create event banner/poster
   - Gather speaker photos if applicable
   - Optimize images for web

3. **Submit via GitHub**
   - Go to: https://github.com/islandbitcoin/islandbitcoin-community/issues
   - Click "New Issue"
   - Title: "Event Submission: [Your Event Name]"
   - Attach your JSON file
   - Upload media files to `/events` folder via PR

4. **Review Process**
   - We'll review within 48 hours
   - Check for required fields
   - Verify Bitcoin/Lightning payment options
   - Approve and publish to the platform

## Best Practices

### Event Descriptions
- Lead with what attendees will learn/gain
- Mention any prerequisites
- Highlight unique features
- Include Bitcoin/Lightning payment options

### Accessibility
- Note wheelchair accessibility
- Mention available accommodations
- Consider online streaming for broader reach

### Bitcoin Integration
- Accept Bitcoin/Lightning for registration fees
- Partner with local Bitcoin-accepting merchants
- Provide Lightning wallet setup assistance
- Consider Bitcoin-themed giveaways

### Promotion
- Use consistent hashtags
- Provide social media assets
- Submit at least 2 weeks before event
- Update if details change

## Examples

### Simple Meetup
```json
{
  "event": {
    "basic_info": {
      "title": "Barbados Bitcoin Beach Meetup",
      "description": "Join us for casual Bitcoin discussions by the beach. We'll help newcomers set up Lightning wallets and discuss latest developments.",
      "type": "meetup"
    },
    "when": {
      "date": "2024-04-15",
      "start_time": "18:00",
      "end_time": "20:00",
      "timezone": "America/Barbados"
    },
    "where": {
      "venue_name": "Carlisle Bay Beach Bar",
      "address": "Carlisle Bay, Bridgetown",
      "city": "Bridgetown",
      "country": "Barbados"
    },
    "registration": {
      "required": false,
      "how_to_register": "Just show up! RSVP appreciated at btcbeach@example.com",
      "capacity": 30,
      "fee": "Free - buy your own drinks"
    },
    "contact": {
      "organizer_name": "Barbados Bitcoin Group",
      "email": "btcbeach@example.com"
    },
    "images": {
      "main_image": "beach-meetup-april.jpg"
    }
  }
}
```

### Workshop Example
```json
{
  "event": {
    "basic_info": {
      "title": "Lightning Network for Merchants Workshop",
      "description": "Hands-on workshop for business owners to accept Bitcoin payments via Lightning. We'll set up BTCPay Server and train staff.",
      "type": "workshop"
    },
    "when": {
      "date": "2024-04-20",
      "start_time": "14:00",
      "end_time": "17:00",
      "timezone": "America/Barbados"
    },
    "where": {
      "venue_name": "Innovation Hub",
      "address": "123 Business Park, Warrens",
      "city": "Warrens",
      "country": "Barbados"
    },
    "registration": {
      "required": true,
      "how_to_register": "https://example.com/register",
      "capacity": 20,
      "fee": "Free for merchants"
    },
    "contact": {
      "organizer_name": "Island Bitcoin Merchant Services",
      "email": "merchants@islandbitcoin.com",
      "phone": "+1-246-555-0123"
    },
    "images": {
      "main_image": "merchant-workshop.jpg"
    }
  }
}
```

## Support

Questions about event submission?
- Email: events@islandbitcoin.com
- Telegram: https://t.me/islandbitcoin
- Nostr: nostr:npub1...

## Event Promotion

Once approved, your event will be:
- Listed on the Island Bitcoin events page
- Shared on our Nostr feed
- Included in our newsletter
- Promoted on social media

Make sure to:
- Share the event link with your network
- Use #IslandBitcoin hashtag
- Post updates on Nostr
- Engage with attendee questions

Happy event planning! 🏝️₿