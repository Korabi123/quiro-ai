// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://d4166ed9cb45c32c3d5475bee8d5faf0@o4507120000237568.ingest.us.sentry.io/4510353169645568",

  tracesSampleRate: 1,

  enableLogs: true,

  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
});
