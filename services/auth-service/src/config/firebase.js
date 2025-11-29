import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const initializeFirebase = () => {
  if (!admin.apps.length) {
    const serviceAccountPath = path.join(__dirname, "service-account.json");

    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountPath)
      });
      console.log("✅ Firebase Admin initialized");
    } catch (error) {
      console.warn("⚠️ Firebase Admin initialization failed:", error.message);
      console.warn("Make sure service-account.json exists in src/config/");
    }
  }

  return admin;
};

export default initializeFirebase;
