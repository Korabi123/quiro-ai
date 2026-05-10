import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/client/plugins";

const client = createAuthClient({
  plugins: [twoFactorClient()]
});

// I want to see a TS error to get the exact type of enable
client.twoFactor.enable({ password: "hi", randomProp: true });
