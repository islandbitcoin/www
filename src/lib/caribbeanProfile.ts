import { NostrMetadata } from '@nostrify/nostrify';

const caribbeanFirstNames = [
  'Marley', 'Selassie', 'Nesta', 'Kamau', 'Malik', 'Zion', 'Jah', 'Rasta',
  'Jahmar', 'Desmond', 'Winston', 'Marcus', 'Cedric', 'Dwayne', 'Andre',
  'Simone', 'Chantel', 'Keisha', 'Latoya', 'Monique', 'Sade', 'Aaliyah',
  'Irie', 'Calypso', 'Reggae', 'Soca', 'Steelpan', 'Mango', 'Papaya',
  'Coconut', 'Hibiscus', 'Plumeria', 'Jasmine', 'Orchid', 'Palm',
  'Ocean', 'Coral', 'Pearl', 'Sandy', 'Sunny', 'Breeze', 'Wave',
  'Jahseh', 'Shelly', 'Usain', 'Grace', 'Bob', 'Peter', 'Bunny',
  'Tosh', 'Jimmy', 'Cliff', 'Buju', 'Beenie', 'Sean', 'Shaggy',
  'Chronixx', 'Protoje', 'Koffee', 'Spice', 'Tessanne', 'Tarrus'
];

const caribbeanLastNames = [
  'Bailey', 'Campbell', 'Brown', 'Williams', 'Thompson', 'Robinson',
  'Walker', 'Clarke', 'Lewis', 'Johnson', 'Smith', 'Jones', 'Davis',
  'Miller', 'Wilson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris',
  'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark',
  'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young',
  'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson',
  'Marley', 'Tosh', 'Wailer', 'Cliff', 'Dekker', 'Ellis', 'Holt',
  'Reid', 'Grant', 'Forbes', 'Chambers', 'Beckford', 'Palmer', 'Nesbeth'
];

const bitcoinPhrases = [
  'Stacking sats on island time',
  'Orange pilling the Caribbean',
  'Building Bitcoin beaches',
  'Lightning fast, island slow',
  'HODL like a coconut tree',
  'Proof of Palm Trees',
  'Satoshi Saturdays enthusiast',
  'Bitcoin maxi with island vibes',
  'Running nodes, catching waves',
  'Decentralized like the islands',
  'Sound money, sweet reggae',
  'Zapping from paradise',
  'Bitcoin is freedom, so is island life',
  'Stack sats, eat mangos',
  'Orange coin, blue waters',
  'Mining sun and stacking sats',
  'Lightning Network islander',
  '21 million reasons to smile',
  'Not your keys, not your beach',
  'Sovereign individual, sovereign island'
];

const islandLocations = [
  'Jamaica', 'Barbados', 'Trinidad & Tobago', 'Bahamas', 'Cayman Islands',
  'Puerto Rico', 'USVI', 'BVI', 'Antigua', 'St. Lucia', 'Grenada',
  'Dominica', 'St. Vincent', 'St. Kitts', 'Nevis', 'Martinique',
  'Guadeloupe', 'Aruba', 'Curacao', 'Bonaire', 'Dominican Republic',
  'Haiti', 'Cuba', 'Bermuda', 'Turks & Caicos', 'Anguilla',
  'Montserrat', 'St. Martin', 'St. Barts', 'Saba', 'St. Eustatius'
];

const profileColors = [
  '#FF6B35', '#00A5CF', '#40E0D0', '#228B22', '#FF7F50',
  '#FFBA08', '#FF1744', '#4B0082', '#FFD700', '#32CD32',
  '#FF69B4', '#00CED1', '#FF4500', '#1E90FF', '#FFA500'
];

export function generateCaribbeanProfile(pubkey: string): NostrMetadata {
  // Use pubkey as seed for consistent randomization
  const seed = pubkey.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const random = (max: number) => {
    const x = Math.sin(seed + max) * 10000;
    return Math.floor((x - Math.floor(x)) * max);
  };

  const firstName = caribbeanFirstNames[random(caribbeanFirstNames.length)];
  const lastName = caribbeanLastNames[random(caribbeanLastNames.length)];
  const location = islandLocations[random(islandLocations.length)];
  const phrase = bitcoinPhrases[random(bitcoinPhrases.length)];
  const color = profileColors[random(profileColors.length)];

  // Generate avatar using UI Avatars API
  const avatar = `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=${color.slice(1)}&color=fff&size=200&font-size=0.4&rounded=true&bold=true`;

  return {
    name: `${firstName} ${lastName}`,
    about: `${phrase} 🏝️ ${location}`,
    picture: avatar,
    nip05: `${firstName.toLowerCase()}_${lastName.toLowerCase()}@islandbitcoin.com`,
    lud16: `${firstName.toLowerCase()}${random(9999)}@getalby.com`,
    website: 'https://islandbitcoin.com'
  };
}

export function generateRandomCaribbeanName(): string {
  const firstName = caribbeanFirstNames[Math.floor(Math.random() * caribbeanFirstNames.length)];
  const lastName = caribbeanLastNames[Math.floor(Math.random() * caribbeanLastNames.length)];
  return `${firstName} ${lastName}`;
}