# DrutoLink E-Commerce



A modern, high-performance e-commerce platform built with React, Vite, and TypeScript. DrutoLink integrates cloud backend services and advanced search functionalities to deliver a seamless shopping experience.

## ✨ Key Features

* **Lightning-Fast Development:** Powered by Vite for instant server start and optimized build performance.


* **Visual Search Capability:** Includes a dedicated visual search module (`visualSearch.ts`) to enable image-based product discovery.


* **Cloud Backend Integration:** Pre-configured with Firebase (`firebase.ts`) for seamless authentication, database operations, or cloud storage.


* **Modern Styling:** Utilizes Tailwind CSS (`tailwind.config.js`) and PostCSS (`postcss.config.js`) for highly customizable, responsive, and utility-first styling.


* **E-Commerce Core:** Features a dedicated e-commerce interface and logic layer built in TypeScript (`drutolink_e_commerce.tsx`).


* **Flexible Deployment:** Comes fully equipped with configuration files for instant deployment to both Vercel (`vercel.json`) and Netlify (`netlify.toml`).



## 🚀 Getting Started

### Prerequisites

Ensure you have Node.js and npm (or yarn/pnpm) installed on your local machine.

### Installation

1. Clone the repository and navigate to the project directory:
```bash
cd drutolink-main

```


2. Install the project dependencies defined in `package.json`:


```bash
npm install

```


3. Start the development server:


```bash
npm run dev

```



## 📁 Project Structure Highlights

The repository is structured to separate configuration, assets, and source code cleanly:

* **`/src`**: Contains the main application source code, including root React components (`main.tsx`) and global stylesheets (`index.css`).


* **`/public`**: Houses static assets, including the application logo (`logo.png`) and promotional or presentation slides (`slide1.jpg`, `slide2.jpg`, `slide3.jpg`).


* **Configuration Files**: Root-level settings for Vite, Tailwind, and deployments to maintain a clean build pipeline.



## ⚙️ Environment Setup

To fully utilize the Firebase integration and Visual Search features, you will need to set up your environment variables. Create a `.env` file in the root directory and add your specific Firebase configuration keys to ensure `firebase.ts` connects to your backend project successfully.

## 💳 UddoktaPay Sandbox Integration

The checkout now uses UddoktaPay Checkout V2 through server-side API routes. The UddoktaPay API key is never placed in React/Vite client code.

### Environment variables

Create a local `.env` (or configure the same variables in Netlify/Vercel project settings):

```env
UDDOKTAPAY_BASE_URL=https://sandbox.uddoktapay.com
UDDOKTAPAY_API_KEY=YOUR_SANDBOX_API_KEY
```

For Netlify, the payment routes are exposed as:

- `POST /api/uddoktapay/create`
- `POST /api/uddoktapay/verify`
- `POST /api/uddoktapay/webhook`

For Vercel, the same `/api/uddoktapay/*` routes are provided by the `api/uddoktapay/` functions.

### Payment flow

1. Customer submits checkout information.
2. A Firestore order is created with `paymentStatus: PENDING`.
3. The server creates an UddoktaPay Checkout V2 charge.
4. Customer is redirected to UddoktaPay.
5. UddoktaPay returns `invoice_id` to `/?payment=success`.
6. The server verifies the invoice through `/api/verify-payment`.
7. The client checks the returned `metadata.order_id` and payment amount against the Firestore order.
8. `COMPLETED` payments are saved as `paymentStatus: PAID` and the order moves to `Order Placed`.

> For production, the strongest setup is to move final order authorization/amount validation and Firestore payment updates into a trusted server using Firebase Admin SDK. The current integration keeps the UddoktaPay secret server-side and is suitable for the requested Sandbox integration/testing flow.
