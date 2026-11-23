// Shop catalogue. Pure data: names, descriptions, placeholder prices, icons and placement rules.
// Icons are Tabler icon names (https://tabler.io/icons), used as `ti ti-<icon>`.
//
// placement:
//   'line' – acts directly on network traffic, so it must sit on a network link
//   'off'  – acts on a host, a person or stored data, so it must sit off the network links
//   'any'  – cross-layer / global, can go anywhere

const PLACEMENT = {
  line: { label: 'On network line',  icon: 'route' },
  off:  { label: 'Off network line', icon: 'route-off' },
  any:  { label: 'Anywhere',         icon: 'arrows-move' },
};

const CATEGORIES = {
  // Defender side: network layers, top to bottom (loosely based on TCP/IP)
  'layer-app':       { label: 'Application layer', icon: 'app-window' },
  'layer-transport': { label: 'Transport layer',   icon: 'truck-delivery' },
  'layer-network':   { label: 'Network layer',     icon: 'network' },
  'layer-link':      { label: 'Link layer',        icon: 'link' },
  cross:             { label: 'Cross-layer',       icon: 'stack-3' },
  // Defender side: beyond the network
  host:   { label: 'Beyond the network · Host',            icon: 'device-desktop' },
  data:   { label: 'Beyond the network · Data at rest',    icon: 'database' },
  people: { label: 'Beyond the network · People & policy', icon: 'users' },

  // Attacker side (unchanged grouping)
  network:  { label: 'Network',     icon: 'network' },
  identity: { label: 'Identity',    icon: 'id-badge' },
  social:   { label: 'People',      icon: 'users' },
  app:      { label: 'Application', icon: 'app-window' },
  endpoint: { label: 'Host',        icon: 'device-desktop' },
  advanced: { label: 'Advanced',    icon: 'skull' },
};

const DEFENSES = [
  // ---- Application layer ----
  { id: 'waf',             name: 'WAF',                 short: 'WAF',  cost: 200, cat: 'layer-app', placement: 'line', icon: 'world-www',
    desc: 'Web Application Firewall. Sits in front of web apps and filters common attack patterns.' },
  { id: 'dns-filtering',   name: 'DNS filtering',       short: 'DNS',  cost: 150, cat: 'layer-app', placement: 'line', icon: 'world-search',
    desc: 'Blocks lookups for known malicious and phishing domains.' },
  { id: 'email-filtering', name: 'Email filtering',     short: 'MAIL', cost: 150, cat: 'layer-app', placement: 'line', icon: 'mail-x',
    desc: 'Mail gateway that strips spam, phishing links and malicious attachments.' },
  { id: 'mfa',             name: 'MFA',                 short: 'MFA',  cost: 200, cat: 'layer-app', placement: 'off',  icon: '2fa',
    desc: "Multi-factor authentication on logins. A password alone isn't enough." },
  { id: 'secure-coding',   name: 'Secure coding',       short: 'SC',   cost: 250, cat: 'layer-app', placement: 'off',  icon: 'code',
    desc: 'Removes flaws at the source, e.g. parameterised queries and output encoding.' },
  { id: 'session-mgmt',    name: 'Session management',  short: 'SES',  cost: 150, cat: 'layer-app', placement: 'off',  icon: 'hourglass',
    desc: 'Secure session tokens, timeouts and re-authentication make hijacked sessions short-lived.' },

  // ---- Transport layer ----
  { id: 'tls',             name: 'TLS encryption',      short: 'TLS',  cost: 200, cat: 'layer-transport', placement: 'line', icon: 'certificate',
    desc: 'Encrypts data in transit with certificate checks, so intercepted traffic is unreadable.' },
  { id: 'rate-limiting',   name: 'Rate limiting',       short: 'RL',   cost: 150, cat: 'layer-transport', placement: 'line', icon: 'gauge',
    desc: 'Caps connections and requests per source to absorb floods and brute-force attempts.' },

  // ---- Network layer ----
  { id: 'firewall',        name: 'Firewall',            short: 'FW',   cost: 100, cat: 'layer-network', placement: 'line', icon: 'wall',
    desc: 'Filters packets by address, port and protocol; drops probes to closed ports.' },
  { id: 'segmentation',    name: 'Segmentation',        short: 'SEG',  cost: 200, cat: 'layer-network', placement: 'line', icon: 'layout-grid',
    desc: 'Splits the network into zones so an intruder cannot move freely between them.' },
  { id: 'ipsec-vpn',       name: 'IPsec VPN',           short: 'VPN',  cost: 250, cat: 'layer-network', placement: 'line', icon: 'shield-lock',
    desc: 'Encrypted tunnel between sites or users at the IP layer.' },

  // ---- Link layer ----
  { id: 'nac',             name: 'Port security / 802.1X', short: 'NAC', cost: 200, cat: 'layer-link', placement: 'line', icon: 'plug-connected',
    desc: 'Only authorised devices can join the network at the switch port.' },
  { id: 'arp-inspection',  name: 'Dynamic ARP inspection', short: 'DAI', cost: 150, cat: 'layer-link', placement: 'line', icon: 'arrows-exchange',
    desc: 'Stops ARP spoofing, a common way to get in the middle of local traffic.' },

  // ---- Cross-layer ----
  { id: 'ids',             name: 'IDS',                 short: 'IDS',  cost: 150, cat: 'cross', placement: 'any', icon: 'radar',
    desc: 'Intrusion Detection System. Spots suspicious activity and raises alerts.' },
  { id: 'ips',             name: 'IPS',                 short: 'IPS',  cost: 250, cat: 'cross', placement: 'line', icon: 'hand-stop',
    desc: 'Intrusion Prevention System. Sits inline and blocks malicious traffic it recognises.' },
  { id: 'siem',            name: 'SIEM',                short: 'SIEM', cost: 300, cat: 'cross', placement: 'any', icon: 'report-analytics',
    desc: 'Collects logs from every layer and correlates odd activity.' },

  // ---- Beyond the network: Host ----
  { id: 'antivirus',       name: 'Antivirus',           short: 'AV',   cost: 100, cat: 'host', placement: 'off', icon: 'virus-off',
    desc: 'Blocks known malware by signature.' },
  { id: 'edr',             name: 'EDR',                 short: 'EDR',  cost: 300, cat: 'host', placement: 'off', icon: 'device-desktop-analytics',
    desc: 'Endpoint Detection & Response. Catches malicious behaviour on hosts.' },
  { id: 'patching',        name: 'Patching',            short: 'PAT',  cost: 150, cat: 'host', placement: 'off', icon: 'bandage',
    desc: 'Fixes known vulnerabilities in operating systems, software and libraries.' },

  // ---- Beyond the network: Data at rest ----
  { id: 'disk-encryption', name: 'Disk encryption',     short: 'DSK',  cost: 200, cat: 'data', placement: 'off', icon: 'lock-square',
    desc: 'Stored and stolen data stays unreadable without the key.' },
  { id: 'backups',         name: 'Backups',             short: 'BAK',  cost: 150, cat: 'data', placement: 'off', icon: 'database-export',
    desc: 'Restore clean copies after an attack.' },

  // ---- Beyond the network: People & policy ----
  { id: 'awareness-training', name: 'Awareness training', short: 'AT', cost: 100, cat: 'people', placement: 'off', icon: 'school',
    desc: 'Users learn to spot and report phishing.' },
  { id: 'password-policy', name: 'Password policy and lockout', short: 'PWD', cost: 100, cat: 'people', placement: 'off', icon: 'password',
    desc: 'Strong passwords and lockouts make guessing impractical.' },
];

// Attack prices follow the "attacker cost" tier: Low 100, Medium 200, High 350, Very high 500.
// Placement: attacks on traffic go on the line; attacks on hosts, apps, accounts or people go off it.
const ATTACKS = [
  { id: 'recon',         name: 'Recon / port scan', short: 'RCN',  cost: 100, cat: 'network',  placement: 'line', icon: 'scan',
    hits: 'Intel only, no damage',
    desc: 'Probes the network to map open ports and running services.' },
  { id: 'ddos',          name: 'DDoS',              short: 'DDoS', cost: 200, cat: 'network',  placement: 'line', icon: 'bolt',
    hits: 'Availability',
    desc: 'Floods a service with traffic to knock it offline.' },
  { id: 'mitm',          name: 'Man in the middle', short: 'MITM', cost: 200, cat: 'network',  placement: 'line', icon: 'spy',
    hits: 'Confidentiality, integrity',
    desc: 'Intercepts traffic between two parties to read or alter it.' },

  { id: 'password-attacks', name: 'Password attacks', short: 'PASS', cost: 100, cat: 'identity', placement: 'off', icon: 'key',
    hits: 'Confidentiality',
    desc: 'Guesses, sprays or reuses leaked passwords to break into accounts.' },

  { id: 'phishing',      name: 'Phishing',          short: 'PHI',  cost: 100, cat: 'social',   placement: 'off', icon: 'fish-hook',
    hits: 'Confidentiality',
    desc: 'Tricks users into handing over credentials or opening malware.' },

  { id: 'sql-injection', name: 'SQL injection',     short: 'SQLi', cost: 200, cat: 'app',      placement: 'off', icon: 'vaccine',
    hits: 'Confidentiality, integrity',
    desc: 'Smuggles database commands in through unsanitised input.' },
  { id: 'xss',           name: 'XSS',               short: 'XSS',  cost: 200, cat: 'app',      placement: 'off', icon: 'brand-javascript',
    hits: 'Confidentiality, integrity',
    desc: "Injects scripts into web pages that run in users' browsers." },

  { id: 'malware',       name: 'Malware',           short: 'MAL',  cost: 200, cat: 'endpoint', placement: 'off', icon: 'bug',
    hits: 'Integrity, confidentiality',
    desc: 'Malicious software that infects hosts and can spread.' },
  { id: 'ransomware',    name: 'Ransomware',        short: 'RAN',  cost: 350, cat: 'endpoint', placement: 'off', icon: 'currency-bitcoin',
    hits: 'Availability',
    desc: 'Encrypts files and demands payment to restore them.' },

  { id: 'zero-day',      name: 'Zero-day exploit',  short: '0DAY', cost: 500, cat: 'advanced', placement: 'any', icon: 'bomb',
    hits: 'Any',
    desc: 'Uses an unknown flaw with no patch or signature yet.' },
];

const SHOPS = {
  defender: { title: 'Defender Shop', icon: 'shield', items: DEFENSES },
  attacker: { title: 'Attacker Shop', icon: 'sword',  items: ATTACKS },
};
