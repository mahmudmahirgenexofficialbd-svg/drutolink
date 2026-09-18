# DrutoLink UddoktaPay Sandbox — GitHub setup

## 1. Upload all project files
Upload the contents of this folder to the root of the GitHub repository.

## 2. Netlify environment variables
Set these in Netlify -> Site configuration -> Environment variables:

UDDOKTAPAY_BASE_URL=https://sandbox.uddoktapay.com
UDDOKTAPAY_API_KEY=YOUR_SANDBOX_API_KEY

Do NOT put the UddoktaPay API key in VITE_ variables or frontend source code.

## 3. Firebase rules
Firebase Console -> Firestore Database -> Rules -> replace the rules with the contents of firestore.rules -> Publish.

## 4. Netlify
The included netlify.toml exposes:
POST /api/uddoktapay/create
POST /api/uddoktapay/verify
POST /api/uddoktapay/webhook

Build command: npm run build
Publish directory: dist

## 5. Important
The current Sandbox integration verifies the UddoktaPay response in the frontend before updating the order. For production payment security, move the final Firestore payment update to a trusted server using Firebase Admin SDK.
