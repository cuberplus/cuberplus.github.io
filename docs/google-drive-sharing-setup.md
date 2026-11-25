# Google Drive sharing setup

These are the site owner's setup steps, in order. Ordinary CuberPlus users do
not need a Cloud project or API key. They sign in when publishing, and their
own Google Drive holds their files. Recipients do not sign in.

**If Google backups already work, reuse their Google Cloud project and Web
OAuth client.** Do not replace working backup settings. Part 2's deduplication
does not need any additional API or scope beyond the sharing setup below.
No server, service account, client secret, or Google Picker setup is required.

## 1. Open the existing Google Cloud project

Open https://console.cloud.google.com/ and sign in with the Google account that
owns the CuberPlus OAuth configuration.

Click the project selector at the top. Select the project used for CuberPlus
Google backups. If you have several projects, open **Google Auth Platform >
Clients** in each candidate and find the **Web application** whose Client ID
matches `VITE_GOOGLE_CLIENT_ID` in your local `.env` or `.env.local`.
Do not post the contents of those files anywhere.

If you have never configured Google access, create a project named CuberPlus
instead, and use that project for every remaining step.

## 2. Enable Google Drive API

In the selected project, open **APIs & Services > Library**.
Search for **Google Drive API**, open the Google Drive API result, and click
**Enable**. If it says **Manage**, it is already enabled.

Do not enable Gmail, Sheets, a database, or a server product for this feature.
The API being used is `drive.googleapis.com`.

## 3. Check Google Auth Platform branding

Open **Google Auth Platform > Branding**. If Google shows **Get started**,
complete the initial setup with the app name **CuberPlus**, a support email
you monitor, and your developer contact email.

For a public site, choose **External** when asked for the audience.
Do not choose **Personal**: that mode only lets the app creator authorize
the app and cannot later be changed to External.

Keep existing correct branding and URLs. For a new configuration, use
`https://cuberplus.com` as the application homepage and `cuberplus.com` as an
authorized domain if requested. Save your changes.

If Google requires a privacy policy, terms, or domain verification, supply
real published pages and complete the ownership/verification steps shown in
**Verification Center**. Do not enter a nonexistent policy URL. Publishing an
accurate policy, if required, is a prerequisite to Google's production approval;
enabling another API does not replace it.

## 4. Add the sharing permission without removing backup permission

Open **Google Auth Platform > Data Access** (sometimes shown as **Data access**).
Click **Add or remove scopes**.

Keep the existing private backup scope:

```text
https://www.googleapis.com/auth/drive.appdata
```

Add this sharing scope using the search box or the manual-scope field:

```text
https://www.googleapis.com/auth/drive.file
```

Click **Update**, then **Save** if offered.
Check that both scopes appear in the saved list. `drive.file` is Google's
non-sensitive, per-file scope. Do not select the broad `drive` or
`drive.readonly` scopes.

CuberPlus asks for sharing permission only when publishing or managing shares.
Backup authorization stays separate.

## 5. Check the Web OAuth client and allowed origins

Open **Google Auth Platform > Clients**, then open the existing CuberPlus
**Web application** client. If none exists, click **Create client**, select
**Web application**, and name it CuberPlus web.

Under **Authorized JavaScript origins**, keep existing origins and add the
ones you actually use. The normal production and development entries are:

```text
https://cuberplus.com
http://127.0.0.1:5173
http://localhost
http://localhost:5173
```

If you serve the site at `https://www.cuberplus.com`, add that exact origin too.
For local production-preview testing, also add the origin you use, such as
`http://127.0.0.1:4173`. If Vite uses another port, add that exact port.
An origin has no path, trailing slash, or `*`.

Click **Save**. Copy the **Client ID**, which ends in
`.apps.googleusercontent.com`. This is the value for `VITE_GOOGLE_CLIENT_ID`.
Reuse the current value if it already matches.

Do not copy a client secret into the site. This popup token flow does not need
a Google redirect URL. Leave any existing redirect URLs used by other features
unchanged. Microsoft's `auth-callback.html` is not a Google redirect URL.

## 6. Allow your publishing account while testing

Open **Google Auth Platform > Audience**.
For an External app in **Testing**, find **Test users**, click **Add users**,
enter the Google email address you will use to publish test solves, and save.
Add any other people who need to test publishing.

Recipients who only view links do not need to be test users.
If the app is already **In production**, do not switch it back to Testing;
you can skip this test-user step.

## 7. Create the public Drive reading API key

Open **APIs & Services > Credentials** in the same project.
Click **Create credentials > API key**. If prompted to choose a kind of key,
use a standard API key for API calls, not a service-account authorization key.
Name it **CuberPlus public Drive reads**.

Open the key's settings (or click **Edit API key / Restrict key** after
creation). Under **Application restrictions**, select **Websites** or
**HTTP referrers (web sites)**.

Add both the origin-only and wildcard-path entries for each allowed website:

```text
https://cuberplus.com
https://cuberplus.com/*
http://127.0.0.1:5173
http://127.0.0.1:5173/*
http://localhost:5173
http://localhost:5173/*
```

Only add development origins you will actually use. Add the equivalent pair
for `www`, preview port `4173`, or another development port if applicable.
Do not use the OAuth origins list as-is here: API key website restrictions
also need the wildcard-path entries.

Under **API restrictions**, choose **Restrict key**, select **Google Drive API**,
and save. Do not leave the key unrestricted.

Copy the API key value. It goes in `VITE_GOOGLE_DRIVE_API_KEY`, not in the
OAuth Client ID field. This key is intentionally included in the public
JavaScript build so signed-out visitors can read public files. Its restrictions
are important; it does not grant access to users' private Drive files.

## 8. Put the two public values in your local site configuration

Open `C:\Users\mipfeif\Repos\cuberplus.github.io` in your editor.
If you already have `.env.local`, edit it. Otherwise create `.env.local`
beside `package.json`. Add or update these two lines with the real values:

```dotenv
VITE_GOOGLE_CLIENT_ID=YOUR_EXISTING_WEB_CLIENT_ID.apps.googleusercontent.com
VITE_GOOGLE_DRIVE_API_KEY=YOUR_NEW_RESTRICTED_API_KEY
```

Keep existing Microsoft and other environment settings. Do not replace your
whole `.env` file with this example. Never add an OAuth client secret.

`.env.local` overrides `.env`. If both files contain the Google Client ID,
make sure `.env.local` has the intended value. Do not commit either file.
The checked-in `.env.example` contains placeholders, not actual credentials.

## 9. Restart and try one solve locally

If your own development server is running, stop it in its terminal with
Ctrl+C. From the repository directory, run:

```powershell
npm start
```

Open the address Vite prints. The normal address is
`http://127.0.0.1:5173`; its origin and port must match steps 5 and 7.
Changing environment values requires restarting Vite.

Open a recorded solve in Timer, click **Share**, then
**Publish to my Google Drive**. Allow the Google popup, select the test account
you added, and approve the permission to work with the app's files.
If the account selector chooses the wrong account, cancel and retry with
the intended publishing account.

CuberPlus checks the signed-out reading path before displaying a link.
Copy that link. If no link appears, use the troubleshooting table below.

## 10. Check the recipient and storage behavior

Open the link in a private/incognito browser window. You should see the solve,
analysis, and available replay without signing in. The shared replay must
not have editable +2, DNF, or Delete controls.

Publish an average, then an overlapping average. In your publishing account's
Google Drive, search for **CuberPlus**. You will see public solve catalog files
and small solve/average reference files. Catalog batches contain only new solve
content; for the ao1000 example, their combined solve count is 1,001, not 2,000.
More than one catalog file is expected: the append-only batches avoid rewriting
and retaining duplicate recordings in Drive file revisions.

The public catalog is broader than an individual average: a person who has
a link can inspect its referenced catalog files and see other previously
published solves there. A link contains references to the catalog batches
that existed when it was published; later batches are not added to old links.
Private backups, unselected local solves, notes, session/device names, and
original source IDs are not uploaded to the catalog.

## 11. Check revocation and cleanup

In CuberPlus, open **Options > Shared solves > Manage Google Drive shares**.
Use the publishing account. Click **Revoke link** beside a test share.
Reload that link in the private window; it should report that it was revoked.

Revoking deletes only the reference file. It deliberately keeps catalog solves
public for reuse, even if no remaining average uses them.
To remove all public data and all links, click **Delete all shared data** and
confirm. Private backups are not deleted. Previously downloaded copies cannot
be recalled.

## 12. Make publishing available to everyone

When local testing works, open **Google Auth Platform > Audience**.
For an External app still in Testing, click **Publish app** and confirm.
Check that the publishing status is **In production**.

Open **Verification Center** and complete any verification Google requires.
The `drive.file` scope is non-sensitive, but app branding, domain ownership,
or other scopes already used by your project can still require verification.
Changing publishing status does not automatically complete that verification.
Do not tell ordinary users to bypass an unverified-app warning.

If your existing app is already production-ready and verified, keep it that
way and address only any new requirements shown by Google.

## 13. Build and deploy when you are ready

The public IDs and key are embedded at build time. They must be present in
the environment that builds the production site, not just in a browser.
For this repository's local-build deployment, `.env.local` supplies them.
If you build elsewhere, configure these same two variables there.

From the repository directory, create the production build:

```powershell
npm run build
```

When you intentionally want to publish the site, use the repository's existing
deployment command:

```powershell
npm run deploy
```

That command builds again and publishes `build` with `gh-pages`. Do not deploy
until you want the changes live. These instructions do not themselves deploy
anything.

After deployment, repeat steps 9-11 on `https://cuberplus.com` with a real
publishing account and a signed-out recipient. An API key added after a build
requires a new build and deployment.

## Troubleshooting

| What you see | What to check |
| --- | --- |
| Sharing is not configured | Both public values must be nonempty in the build environment. Restart Vite or rebuild and deploy. |
| `origin_mismatch` or Google rejects the site | Step 5: exact scheme, hostname, and port under Authorized JavaScript origins. `localhost` and `127.0.0.1` differ. |
| Access blocked for your test account | Step 6: External audience, correct publishing account in Test users, and the same Cloud project as the Client ID. |
| Drive file permission was not granted | Step 4: add `drive.file`, save, reconnect, and approve sharing permission. Backup-only approval is not enough. |
| A 403 while publishing or reading | Check Drive API is enabled, key restrictions permit this origin and Drive API, and the account allows public sharing. Inspect the failed request in browser developer tools for Google's detailed reason. |
| Google popup does not open | Allow popups for this site and retry from the Publish button. |
| Work or school account refuses public sharing | Its administrator may prohibit anyone-with-link sharing. Use an account that permits public files; do not make a backup public. |
| Shared snapshot unavailable or revoked | The reference or a needed catalog file may have been deleted, made private, or blocked. Public catalog files must stay readable. |
| Snapshot too large | Select fewer solves. Needed catalog batches plus references must fit within the 32 MiB recipient download limit. A small selection can still need a large batch. |
| Publishing failed but files remain | Catalog data is intentionally reusable; cleanup errors can also leave a file. Use Delete all shared data to remove public files, including unreferenced batches. |
| OAuth sign-in expires | Reconnect using Manage Google Drive shares or publish again. Sharing tokens are memory-only and are not renewed in the background. |

## Official references

- Google API client, origins, branding, and scopes:
  https://developers.google.com/identity/oauth2/web/guides/get-google-api-clientid
- Enable Google Workspace APIs:
  https://developers.google.com/workspace/guides/enable-apis
- Drive scopes and their classifications:
  https://developers.google.com/workspace/drive/api/guides/api-specific-auth
- API key website and API restrictions:
  https://docs.cloud.google.com/api-keys/docs/add-restrictions-api-keys
- External audience, test users, and publishing:
  https://support.google.com/cloud/answer/15549945
