// Test script to decode LNURL
const CHARSET = 'qpzry9x8gf2tvdw0s3jn54khce6mua7l';

function decodeLnurl(lnurl) {
  // Remove prefix (lnurl1)
  const data = lnurl.toLowerCase().substring(6);
  
  // Convert from bech32 alphabet to numbers
  const values = [];
  for (let i = 0; i < data.length - 6; i++) { // -6 for checksum
    const idx = CHARSET.indexOf(data[i]);
    if (idx === -1) {
      console.error('Invalid character:', data[i]);
      return null;
    }
    values.push(idx);
  }
  
  // Convert from 5-bit to 8-bit
  const bytes = [];
  let acc = 0;
  let bits = 0;
  
  for (const value of values) {
    acc = (acc << 5) | value;
    bits += 5;
    
    while (bits >= 8) {
      bits -= 8;
      bytes.push((acc >> bits) & 0xff);
    }
  }
  
  // Convert bytes to string
  return new TextDecoder().decode(new Uint8Array(bytes));
}

// Test with the provided LNURL
const lnurl = 'LNURL1DP68GURN8GHJ7CN5VDCXZ7FWW3JHXAPWVEKXZUMGV9C8QTNDV5H5CNJ42FXZ7AMFW35XGUNPWUHHQUP0XVEYG6642AYX6ENGGFE9Y4MS23MRVDT9X3NYYU66WDS4G0MPD4HH2MN5856RQVPSXQCZVER9WD3HY6TSW35K7M3AF9EKCCTWVS45Y6T5VDHKJM3TGASK6EFT2A5HG6RYWFSHWCTV9VKJKENZVDJKVETZVYHZUTSFM0ENP';

console.log('Decoding LNURL...');
const decoded = decodeLnurl(lnurl);
console.log('Decoded URL:', decoded);

// Also test encoding a known URL
console.log('\nTesting encoding of a BTCPay URL:');
const testUrl = 'https://btcpay.test.flashapp.me/LNURL/withdraw/pp/32DkUWHmfhBrRWpTv65e4fBsZsaT?amount=400000&description=Island%20Bitcoin%20Game%20Withdrawal';
console.log('Original URL:', testUrl);