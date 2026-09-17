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
