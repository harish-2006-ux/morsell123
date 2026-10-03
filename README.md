# Food Redistribution Platform

A responsive web platform that connects food donors, NGOs and receiving organizations, volunteers, and administrators to reduce food waste and coordinate pickup and delivery.

## Technology stack

- React + Vite + TypeScript
- Express + tRPC
- Drizzle ORM with the managed MySQL-compatible database
- Manus OAuth authentication

## Main modules

- Home page with platform information, contact access, and real impact statistics
- Donor dashboard for adding food donations and tracking donation status
- NGO dashboard for viewing and accepting available donations
- Volunteer dashboard for pickup and delivery coordination
- Administrator dashboard for user, donation, delivery, and report monitoring
- Notifications, delivery history, issue reporting, and database-backed status updates

## Development

```bash
pnpm dev
pnpm check
pnpm test
pnpm db:migrate
```

The managed environment supplies database and authentication values. Never commit real credentials; use `.env.example` only as a placeholder reference.
