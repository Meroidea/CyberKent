/* Before anything imports the app: the environment it validates on load. */
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.NODE_ENV = "test";
process.env.JWT_SECRET ??= "test-secret-that-is-long-enough-for-the-env-schema";
process.env.CLIENT_ORIGIN = "http://localhost:5173";
delete process.env.RESEND_API_KEY;
delete process.env.BLOB_READ_WRITE_TOKEN;

/* The development mailer writes each email to the console; tests read the log instead of the terminal. */
const original = console.info;
console.info = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("[mailer]")) {
    (globalThis as { __mail?: string[] }).__mail ??= [];
    (globalThis as { __mail?: string[] }).__mail!.push(args.join(" "));
    return;
  }
  original(...args);
};
