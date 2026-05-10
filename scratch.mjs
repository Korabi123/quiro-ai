import { createAuthClient } from "better-auth/client";
import { twoFactorClient } from "better-auth/client/plugins";

const client = createAuthClient({
  plugins: [twoFactorClient()]
});

console.log(Object.keys(client.twoFactor));
