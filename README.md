# Qr Print Shop Hub

Build Printex, a modern, responsive SaaS website for Indian photocopy shops and printing businesses. Use https://printdeck.in/ as a reference for the product concept, but use the brand name Printex everywhere.

Design: Clean, professional, light theme with white backgrounds, navy typography, teal accents, subtle shadows, rounded cards, and minimal animations. Use React, TypeScript, Tailwind CSS, and React Router.

1. Homepage: Include a navbar with logo, Features, Reviews, Contact, and Get Started. Hero headline: “Manage Your Print Shop in One Screen.” Add a short description, “Get My Shop QR Code” and “Find Your Shop to Upload Files” buttons, plus a realistic dashboard preview. Include How It Works, Features, Reviews, and Footer sections.

2. Shop Registration: Create a form with Shop Name, Owner Name, WhatsApp Number, Shop Address with Detect Location, optional Referral Code, and State dropdown. Add a “Create Shop & Open Dashboard” button with validation.

3. Shop Owner Dashboard: Create a sidebar with Overview, Print Orders, My Shop QR Code, Shop Profile, and Settings. Show KPI cards, an orders table with filenames, page counts, print types, statuses, and action buttons. Include a QR page with Download QR, Print QR, and Copy Link options.

4. Customer QR Upload Page: Create a separate, mobile-first page showing the shop name, file upload, selected files, PDF page counts, Black & White/Color options, Single-sided/Double-sided options, estimated price, and a “Send Files” button. Include an optional WhatsApp upload alternative.

Important: Each shop must have its own QR code and customer upload page. Customers should not need a shop-owner account. Keep the customer interface separate from the main website and dashboard.

Build the complete frontend UI with working navigation, realistic mock data, demo interactions, responsive layouts, and loading/error/success states. Simulate registration and uploads locally for now. Do not integrate a backend, database, authentication service, or real file storage yet. Keep the code modular and ready for future backend integration.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a6d5f1df-3379-5062-af1d-b73f8aaa794e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
