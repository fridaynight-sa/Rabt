// Login cookies are for the server only: the site never reads them in the browser,
// so JavaScript (including any injected script) cannot read them either.
export const SESSION_COOKIE_OPTIONS = {
  path: "/",
  sameSite: "lax" as const,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  maxAge: 60 * 60 * 24 * 30,
};
