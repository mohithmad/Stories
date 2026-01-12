**📖 Stories**
The Intelligence Layer for SaaS Product Managers.

Stories is an automated product intelligence engine that fetches customer feedback, competitor moves, and industry signals from across the web and internal tools, transforming fragmented data into actionable Product Stories.

**🚀 The Problem**
Product Managers are drowning in data but starving for insights. Feedback lives in Zendesk, competitor updates live on LinkedIn, and market trends live on Reddit. Stories centralizes these signals, clusters them using AI, and presents them as unified narratives.

**✨ Features**
– Multi-Source Ingestion: Automated fetching from Zendesk, Intercom, G2, Reddit, and Competitor site scrapers.

- AI-Driven Clustering: Uses Gemini to group similar signals (e.g., 5 support tickets + 1 tweet = 1 Story).

- Sentiment Analysis: Automatically detects the emotional weight and urgency of every signal.

- Competitive Intelligence: Monitors competitor pricing, feature launches, and hiring patterns.

- Stakeholder Sync: Pushes "Stories" directly into Slack or Notion to keep the whole team informed.

**🏗️ Architecture**
Stories uses a Hybrid Event-Driven Architecture to ensure real-time intelligence:

Ingestion Layer: Webhook listeners for real-time SaaS alerts + Cron-based pollers for external scrapers.

Normalization: A unified schema that converts raw JSON payloads into a standard "Signal" format.

Processing (Gemini): LLM-based clustering and summarization to turn Signals into Stories.

Action Layer: API delivery to PM tools and internal dashboards.

**🚦 Getting Started**
Prerequisites

Webhooks configured in your source SaaS apps (Zendesk, etc.)

Installation
Clone the repo

Bash

git clone https://github.com/yourusername/stories.git
cd stories
Setup Environment

Bash

cp .env.example .env
# Add your API keys and Database URLs
Run with Docker

Bash

docker-compose up --build

**🤝 Contributing
**We love signals! If you want to add a new integration (e.g., Jira, Trustpilot, or Discord), please check out our CONTRIBUTING.md.

Built for Product Managers who want to spend less time digging and more time building.## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
