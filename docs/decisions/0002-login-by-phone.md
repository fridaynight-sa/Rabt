# 0002: Login by phone without SMS

**Context:** Merchants should be able to use an email or a phone number.
Phone sign up with Supabase needs an SMS provider (paid per message).

**Decision:** Email is required at sign up (needed for confirmation and password
reset). A phone number is optional and unique. At login, a phone number is
turned into the account's email on the server, then the normal password login
runs. The lookup function is callable only with the secret key.

**Consequence:** No SMS cost. A merchant can log in with their phone. Phone
numbers are not verified by SMS; this can be added later if needed.
