# Surely - AI-Powered Quality Assurance Platform

## Ì∫Ä Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

1. Clone the repository
```bash
git clone <your-repo-url>
cd surely
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your actual values
```

4. Run database migrations
```bash
# Run the SQL files in Supabase dashboard
# 1. supabase_schema.sql
# 2. supabase_rls_policies.sql
```

5. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Ì≥Å Project Structure

See full structure documentation in `/docs/structure.md`

## Ì¥ß Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Payments:** Stripe
- **Styling:** Tailwind CSS
- **State:** React Query
- **UI:** Custom components

## Ì≥ñ Documentation

- [Architecture Overview](./docs/architecture.md)
- [Database Schema](./docs/schema.md)
- [API Documentation](./docs/api.md)

## Ì¥ù Contributing

Contributions welcome! Please read our contributing guidelines.

## Ì≥Ñ License

MIT License - see LICENSE file for details
