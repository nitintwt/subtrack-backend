
# Subtrack

SubTrack is a subscription management tool that helps users automatically detect, track, and manage their active subscriptions from their email inbox. It sends smart renewal reminders so users never miss or forget about a subscription again.


## Features

- Automatic Subscription Detection: Connect your Gmail account and automatically scan for invoices and receipts to detect active subscriptions.

- AI Extraction: Uses Groq AI models to accurately extract service name, amount, frequency, and renewal date from invoice PDFs.

- Renewal Reminders: Get timely email reminders before your subscription renews, helping you avoid surprise charges.

- Manage Subscriptions: View, edit, and track all your subscriptions from a clean dashboard with search and filter functionality.

- Secure Authentication: OAuth 2.0 based Gmail integration ensures user data remains private and secure.


## How it Works

- User logs in with their Gmail account.

- The system fetches invoice related emails, extracts PDFs, and parses them.

- AI extracts subscription details from invoices.

- Subscriptions are saved and displayed to the user.

- Cron jobs check for upcoming renewals and trigger reminder emails automatically.

## Backend Architecture

- Message Queue System: Async tasks like sending reminders are handled via a message queue for reliable processing.

- Database: PostgreSQL stores all parsed subscriptions and renewal information.

- Containerized Deployment: Backend is Dockerized and deployed on AWS ECS with an Application Load Balancer.

- Scheduled Cron Jobs: PostgreSQL cron jobs check renewal dates daily to trigger timely reminders.

## Tech Stack

**Client:** React.js, TailwindCSS

**Server:** Node.js, Express.js , PostgreSQL , Prisma , BullMQ , nodemailer , Google Gmail API , Groq API , pdf-parse , pg_cron 

**Deployment:** Docker , AWS ECS , EC2, ECR, API Gateway, Auto scaling group, Load Balancer

