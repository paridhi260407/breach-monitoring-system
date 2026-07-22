const axios = require('axios');
const config = require('../config/env');
const { getCache, setCache } = require('../config/redis');

// Calculate severity heuristic from data classes
function calculateSeverity(dataClasses = []) {
  const classesUpper = dataClasses.map((c) => c.toUpperCase());
  
  const criticalKeys = ['PASSWORDS', 'CREDIT CARDS', 'BANK ACCOUNT DETAILS', 'SOCIAL SECURITY NUMBERS', 'BIOMETRIC DATA', 'PIN'];
  const highKeys = ['PASSWORD HASHES', 'AUTH TOKENS', 'SECURITY QUESTIONS', 'PASSPORT NUMBERS', 'DRIVERS LICENSE NUMBERS'];
  const mediumKeys = ['PHONE NUMBERS', 'IP ADDRESSES', 'DATES OF BIRTH', 'PHYSICAL ADDRESSES', 'USERNAMES'];

  if (classesUpper.some((item) => criticalKeys.some((k) => item.includes(k)))) {
    return 'CRITICAL';
  }
  if (classesUpper.some((item) => highKeys.some((k) => item.includes(k)))) {
    return 'HIGH';
  }
  if (classesUpper.some((item) => mediumKeys.some((k) => item.includes(k)))) {
    return 'MEDIUM';
  }
  return 'LOW';
}

// Generate realistic mock breach records for offline testing when HIBP_API_KEY=mock
function getMockBreachesForEmail(email) {
  const normalized = email.toLowerCase().trim();
  
  // Return different breach combinations based on email domain or string patterns
  const availableMockBreaches = [
    {
      Name: 'CanvaDataBreach',
      Title: 'Canva Security Incident',
      Domain: 'canva.com',
      BreachDate: '2019-05-24',
      AddedDate: '2019-05-28T22:30:12Z',
      Description: 'In May 2019, graphic design tool Canva suffered a data breach impacting 137 million subscribers. Leaked data included email addresses, usernames, real names, geographic locations, and salted password hashes.',
      DataClasses: ['Email addresses', 'Usernames', 'Names', 'Passwords', 'Geographic locations'],
      IsVerified: true,
      IsFabricated: false,
      IsSensitive: false,
      LogoPath: 'https://haveibeenpwned.com/Content/Images/PwnedLogos/Canva.png',
    },
    {
      Name: 'DropboxBreach',
      Title: 'Dropbox Cloud Storage Breach',
      Domain: 'dropbox.com',
      BreachDate: '2012-07-01',
      AddedDate: '2016-08-31T00:00:00Z',
      Description: 'In mid-2012, cloud storage service Dropbox suffered a security breach that compromised 68 million user accounts, leaking user email addresses and bcrypt password hashes.',
      DataClasses: ['Email addresses', 'Password hashes', 'Passwords'],
      IsVerified: true,
      IsFabricated: false,
      IsSensitive: false,
      LogoPath: 'https://haveibeenpwned.com/Content/Images/PwnedLogos/Dropbox.png',
    },
    {
      Name: 'LinkedInExfiltration',
      Title: 'LinkedIn Data Leak',
      Domain: 'linkedin.com',
      BreachDate: '2016-05-18',
      AddedDate: '2016-05-21T21:35:40Z',
      Description: 'In 2016, 164 million LinkedIn user records were exposed on dark web marketplaces. The breach contained email addresses, SHA1 hashed passwords, and profile details.',
      DataClasses: ['Email addresses', 'Password hashes', 'Job titles', 'Physical addresses'],
      IsVerified: true,
      IsFabricated: false,
      IsSensitive: false,
      LogoPath: 'https://haveibeenpwned.com/Content/Images/PwnedLogos/LinkedIn.png',
    },
    {
      Name: 'AdobeSecurityIncident',
      Title: 'Adobe Systems Breach',
      Domain: 'adobe.com',
      BreachDate: '2013-10-04',
      AddedDate: '2013-12-04T00:00:00Z',
      Description: 'In October 2013, 153 million Adobe accounts were compromised. Data included internal user IDs, names, encrypted credit card numbers, expiration dates, and password hints.',
      DataClasses: ['Credit cards', 'Email addresses', 'Password hints', 'Passwords', 'Usernames'],
      IsVerified: true,
      IsFabricated: false,
      IsSensitive: false,
      LogoPath: 'https://haveibeenpwned.com/Content/Images/PwnedLogos/Adobe.png',
    },
  ];

  // Deterministically return 1-3 breaches depending on email content
  if (normalized.includes('safe') || normalized.includes('clean')) {
    return [];
  }
  if (normalized.includes('critical') || normalized.includes('admin')) {
    return availableMockBreaches;
  }
  
  // Default mock behavior: return Canva and Dropbox breaches
  return [availableMockBreaches[0], availableMockBreaches[1]];
}

class HIBPService {
  /**
   * Fetch breaches for a given email address.
   * Utilizes Redis 24h caching and HIBP rate-limiting logic.
   */
  async getBreachesForEmail(email) {
    const cacheKey = `hibp:breaches:${email.toLowerCase().trim()}`;

    // 1. Check Redis Cache
    const cachedData = await getCache(cacheKey);
    if (cachedData) {
      console.log(`[HIBP Service] Cache HIT for email: ${email}`);
      return JSON.parse(cachedData);
    }

    console.log(`[HIBP Service] Cache MISS for email: ${email}`);

    // 2. Mock mode fallback if key is missing or set to 'mock'
    if (!config.hibpApiKey || config.hibpApiKey === 'mock' || config.hibpApiKey === 'YOUR_HIBP_API_KEY') {
      console.log(`[HIBP Service] Running in MOCK Mode for email: ${email}`);
      const mockRawBreaches = getMockBreachesForEmail(email);
      const parsedBreaches = mockRawBreaches.map((b) => ({
        breachName: b.Name,
        title: b.Title,
        domain: b.Domain || '',
        breachDate: b.BreachDate ? new Date(b.BreachDate) : null,
        addedDate: b.AddedDate ? new Date(b.AddedDate) : null,
        description: b.Description || '',
        dataClasses: b.DataClasses || [],
        isVerified: b.IsVerified ?? true,
        isFabricated: b.IsFabricated ?? false,
        isSensitive: b.IsSensitive ?? false,
        logoPath: b.LogoPath || null,
        severity: calculateSeverity(b.DataClasses || []),
      }));

      // Cache mock results for 24h
      await setCache(cacheKey, JSON.stringify(parsedBreaches), 86400);
      return parsedBreaches;
    }

    // 3. Live HIBP API Call
    try {
      const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;
      const response = await axios.get(url, {
        headers: {
          'hibp-api-key': config.hibpApiKey,
          'user-agent': config.hibpUserAgent,
        },
        timeout: 10000,
      });

      const breaches = (response.data || []).map((b) => ({
        breachName: b.Name,
        title: b.Title,
        domain: b.Domain || '',
        breachDate: b.BreachDate ? new Date(b.BreachDate) : null,
        addedDate: b.AddedDate ? new Date(b.AddedDate) : null,
        description: b.Description || '',
        dataClasses: b.DataClasses || [],
        isVerified: b.IsVerified ?? true,
        isFabricated: b.IsFabricated ?? false,
        isSensitive: b.IsSensitive ?? false,
        logoPath: b.LogoPath || `https://haveibeenpwned.com/Content/Images/PwnedLogos/${b.Name}.png`,
        severity: calculateSeverity(b.DataClasses || []),
      }));

      // Cache HIBP responses for 24 hours (86400 seconds)
      await setCache(cacheKey, JSON.stringify(breaches), 86400);
      return breaches;
    } catch (error) {
      if (error.response && error.response.status === 404) {
        // 404 means 0 breaches found for this email address
        console.log(`[HIBP Service] 0 breaches found for email: ${email}`);
        await setCache(cacheKey, JSON.stringify([]), 86400);
        return [];
      }

      if (error.response && error.response.status === 429) {
        // Rate limit reached
        const retryAfterSec = error.response.headers['retry-after'] || 2;
        console.warn(`[HIBP Service] Rate limited (429). Retry after ${retryAfterSec} seconds.`);
        const err = new Error(`HIBP Rate limit exceeded. Please try again in ${retryAfterSec} seconds.`);
        err.statusCode = 429;
        throw err;
      }

      console.error(`[HIBP Service Error]:`, error.message);
      throw new Error(`HIBP API Error: ${error.message}`);
    }
  }
}

module.exports = new HIBPService();
module.exports.calculateSeverity = calculateSeverity;
