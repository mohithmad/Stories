import { RawSignal, SignalType } from '../types';

export const generateMockSignals = (): RawSignal[] => [
  // Cluster 1: Slow Loading / Performance (Pain Point)
  {
    id: 'sig-1',
    type: SignalType.INTERNAL,
    source: 'Zendesk',
    content: 'User reported the dashboard takes over 15 seconds to load on Monday mornings.',
    date: '2023-10-25',
    author: 'Customer Success (Jane)',
    url: 'https://zendesk.com/ticket/10293'
  },
  {
    id: 'sig-2',
    type: SignalType.EXTERNAL,
    source: 'Twitter',
    content: '@StoriesApp why is your dashboard so slow today? #frustrated',
    date: '2023-10-25',
    author: '@dev_guru',
    url: 'https://twitter.com/dev_guru/status/123456789'
  },
  {
    id: 'sig-3',
    type: SignalType.INTERNAL,
    source: 'NPS Survey',
    content: 'I love the features, but the speed is killing my productivity.',
    date: '2023-10-26',
    author: 'Enterprise User',
    url: 'https://delighted.com/nps/feedback/555'
  },
  {
    id: 'sig-4',
    type: SignalType.INTERNAL,
    source: 'Sales Call',
    content: 'Prospect mentioned they are worried about our performance benchmarks vs competitors.',
    date: '2023-10-24',
    author: 'Sales Rep (Mike)',
    url: 'https://salesforce.com/opportunity/001'
  },

  // Cluster 2: Competitor Pricing Change (Threat)
  {
    id: 'sig-5',
    type: SignalType.MARKET,
    source: 'Competitor Blog',
    content: 'CompetitorX announces new "Free Forever" tier for startups under 10 employees.',
    date: '2023-10-27',
    author: 'CompetitorX News',
    url: 'https://competitorx.com/blog/free-tier'
  },
  {
    id: 'sig-6',
    type: SignalType.INTERNAL,
    source: 'Slack #sales',
    content: 'Just lost a deal to CompetitorX because they launched a free tier.',
    date: '2023-10-27',
    author: 'Account Executive',
    url: 'https://slack.com/archives/C12345/p123456'
  },
  {
    id: 'sig-7',
    type: SignalType.MARKET,
    source: 'TechCrunch',
    content: 'CompetitorX shakes up the market with aggressive new pricing strategy.',
    date: '2023-10-27',
    author: 'TechCrunch',
    url: 'https://techcrunch.com/2023/10/27/competitorx-pricing'
  },

  // Cluster 3: New Feature Love - Dark Mode (Win)
  {
    id: 'sig-8',
    type: SignalType.EXTERNAL,
    source: 'G2 Review',
    content: 'Finally! The new Dark Mode is gorgeous. Saves my eyes during late night shifts.',
    date: '2023-10-22',
    author: 'G2 User',
    url: 'https://g2.com/products/stories/reviews/123'
  },
  {
    id: 'sig-9',
    type: SignalType.EXTERNAL,
    source: 'Reddit',
    content: 'The Stories update with dark mode is the best thing they have shipped in months.',
    date: '2023-10-23',
    author: 'u/darkmode_fan',
    url: 'https://reddit.com/r/SaaS/comments/darkmode'
  },
  {
    id: 'sig-10',
    type: SignalType.INTERNAL,
    source: 'Zendesk',
    content: 'Customer wrote in just to say thanks for the dark mode update.',
    date: '2023-10-23',
    author: 'Support Agent',
    url: 'https://zendesk.com/ticket/10299'
  },

  // Cluster 4: Integration Request (Pain/Feature Request)
  {
    id: 'sig-11',
    type: SignalType.INTERNAL,
    source: 'Canny Feature Request',
    content: 'We need native Jira integration. The current webhook workaround is flaky.',
    date: '2023-10-20',
    author: 'Product Manager A',
    url: 'https://canny.io/stories/p/jira-integration'
  },
  {
    id: 'sig-12',
    type: SignalType.INTERNAL,
    source: 'Salesforce Notes',
    content: 'Deal breaker: No bi-directional Jira sync.',
    date: '2023-10-21',
    author: 'Sales VP',
    url: 'https://salesforce.com/opportunity/002'
  }
];