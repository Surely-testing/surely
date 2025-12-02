// lib/utils/test-data-generators.ts

export const testDataGenerators = {
  names: () => {
    const firstNames = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma', 'Robert', 'Olivia'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
    return Array.from({ length: 3 }, () => {
      const first = firstNames[Math.floor(Math.random() * firstNames.length)];
      const last = lastNames[Math.floor(Math.random() * lastNames.length)];
      return `${first} ${last}`;
    });
  },

  emails: () => {
    const domains = ['example.com', 'test.com', 'gmail.com', 'yahoo.com', 'outlook.com'];
    return Array.from({ length: 3 }, () => {
      const username = `user${Math.floor(Math.random() * 10000)}`;
      const domain = domains[Math.floor(Math.random() * domains.length)];
      return `${username}@${domain}`;
    });
  },

  'phone-numbers': () => {
    return Array.from({ length: 3 }, () => {
      const area = Math.floor(Math.random() * 900 + 100);
      const prefix = Math.floor(Math.random() * 900 + 100);
      const line = Math.floor(Math.random() * 9000 + 1000);
      return `+1-${area}-${prefix}-${line}`;
    });
  },

  addresses: () => {
    const streets = ['Main St', 'Oak Ave', 'Pine Rd', 'Maple Dr', 'Cedar Ln', 'Elm St'];
    const cities = ['Springfield', 'Franklin', 'Clinton', 'Madison', 'Georgetown'];
    const states = ['CA', 'NY', 'TX', 'FL', 'IL', 'PA', 'OH'];
    return Array.from({ length: 3 }, () => {
      const number = Math.floor(Math.random() * 9999 + 1);
      const street = streets[Math.floor(Math.random() * streets.length)];
      const city = cities[Math.floor(Math.random() * cities.length)];
      const state = states[Math.floor(Math.random() * states.length)];
      const zip = Math.floor(Math.random() * 90000 + 10000);
      return `${number} ${street}, ${city}, ${state} ${zip}`;
    });
  },

  'credit-cards': () => {
    const prefixes = ['4111', '5555', '3782', '6011'];
    return Array.from({ length: 3 }, () => {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
      return `${prefix} ${suffix.slice(0, 4)} ${suffix.slice(4, 8)} ${suffix.slice(8)}`;
    });
  },

  'personal-data': () => {
    const names = testDataGenerators.names();
    const emails = testDataGenerators.emails();
    const phones = testDataGenerators['phone-numbers']();
    return names.map((name, i) => 
      `Name: ${name}, Email: ${emails[i]}, Phone: ${phones[i]}`
    );
  },

  dates: () => {
    const start = new Date(2020, 0, 1);
    const end = new Date();
    return Array.from({ length: 3 }, () => {
      const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
      return date.toISOString().split('T')[0];
    });
  },

  passwords: () => {
    return Array.from({ length: 3 }, () => {
      const lower = Math.random().toString(36).slice(-8);
      const upper = Math.random().toString(36).slice(-4).toUpperCase();
      const special = '!@#$%^&*'[Math.floor(Math.random() * 8)];
      const number = Math.floor(Math.random() * 100);
      return `${lower}${upper}${number}${special}`;
    });
  },

  usernames: () => {
    const prefixes = ['user', 'dev', 'test', 'admin', 'guest'];
    return Array.from({ length: 3 }, () => {
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.random().toString(36).substring(7);
      return `${prefix}_${suffix}`;
    });
  },

  urls: () => {
    const domains = ['example', 'test-site', 'demo-app', 'my-app', 'web-portal'];
    const tlds = ['.com', '.io', '.net', '.org', '.dev'];
    return Array.from({ length: 3 }, () => {
      const domain = domains[Math.floor(Math.random() * domains.length)];
      const tld = tlds[Math.floor(Math.random() * tlds.length)];
      const num = Math.floor(Math.random() * 100);
      return `https://www.${domain}-${num}${tld}`;
    });
  },

  colors: () => {
    return Array.from({ length: 3 }, () => 
      `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
    );
  },

  'lorem-ipsum': () => {
    const sentences = [
      'Lorem ipsum dolor sit amet.',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore.',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    ];
    return sentences.slice(0, 3);
  },

  ssn: () => {
    return Array.from({ length: 3 }, () => {
      const area = Math.floor(Math.random() * 900 + 100);
      const group = Math.floor(Math.random() * 90 + 10);
      const serial = Math.floor(Math.random() * 9000 + 1000);
      return `${area}-${group}-${serial}`;
    });
  },

  // Generic generator for custom types
  generic: () => {
    return Array.from({ length: 3 }, (_, i) => `Sample Data ${i + 1}`);
  }
};

export const predefinedTypes = [
  { id: 'names', name: 'Names', description: 'Generate random names for testing user profiles', icon: 'User', color: 'blue' },
  { id: 'emails', name: 'Emails', description: 'Generate random email addresses', icon: 'Mail', color: 'purple' },
  { id: 'phone-numbers', name: 'Phone Numbers', description: 'Generate random phone numbers', icon: 'Phone', color: 'green' },
  { id: 'addresses', name: 'Addresses', description: 'Generate random addresses', icon: 'MapPin', color: 'red' },
  { id: 'credit-cards', name: 'Credit Cards', description: 'Generate test credit card numbers', icon: 'CreditCard', color: 'yellow' },
  { id: 'personal-data', name: 'Personal Data', description: 'Generate comprehensive personal profiles', icon: 'Database', color: 'indigo' },
  { id: 'dates', name: 'Dates', description: 'Generate random dates', icon: 'Calendar', color: 'pink' },
  { id: 'passwords', name: 'Passwords', description: 'Generate secure passwords', icon: 'Lock', color: 'gray' },
  { id: 'usernames', name: 'Usernames', description: 'Generate random usernames', icon: 'User', color: 'cyan' },
  { id: 'urls', name: 'URLs', description: 'Generate random URLs', icon: 'Globe', color: 'blue' },
  { id: 'colors', name: 'Colors', description: 'Generate random colors', icon: 'Palette', color: 'orange' },
  { id: 'lorem-ipsum', name: 'Lorem Ipsum', description: 'Generate Lorem Ipsum text', icon: 'FileText', color: 'teal' },
  { id: 'ssn', name: 'Social Security Numbers', description: 'Generate random SSNs', icon: 'Hash', color: 'violet' },
];