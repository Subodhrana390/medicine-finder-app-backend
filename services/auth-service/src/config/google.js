import { OAuth2Client } from "google-auth-library";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Google OAuth Configuration
let oauthClient = null;

const initializeGoogleOAuth = () => {
  if (!oauthClient) {
    // Try to load from environment variables first (recommended)
    const clientId = process.env.GOOGLE_CLIENT_ID;

    if (clientId) {
      oauthClient = new OAuth2Client(clientId);
      console.log("✅ Google OAuth initialized from environment variables");
    } else {
      // Fallback: try to load from client_secret.json file
      const clientSecretPath = path.join(__dirname, "client_secret.json");

      try {
        if (fs.existsSync(clientSecretPath)) {
          const credentials = JSON.parse(fs.readFileSync(clientSecretPath, "utf8"));
          const clientIdFromFile = credentials.web?.client_id || credentials.installed?.client_id;

          if (clientIdFromFile) {
            oauthClient = new OAuth2Client(clientIdFromFile);
            console.log("✅ Google OAuth initialized from client_secret.json");
          } else {
            throw new Error("No client_id found in client_secret.json");
          }
        } else {
          throw new Error("client_secret.json file not found");
        }
      } catch (error) {
        console.warn("⚠️ Google OAuth initialization failed:", error.message);
        console.warn("Set GOOGLE_CLIENT_ID environment variable or ensure client_secret.json exists");
      }
    }
  }

  return oauthClient;
};

export default initializeGoogleOAuth;
