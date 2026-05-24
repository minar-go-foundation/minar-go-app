# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Android APK build and publish

This repository now includes a GitHub Actions workflow at `.github/workflows/android-build.yml`.

- On push to `main` or `android-mobile-ui-fix`, the workflow builds the Android app.
- It uploads APK/AAB artifacts to the Actions run.
- It also creates a GitHub Release and attaches `app-debug.apk`.

If you want a signed release APK, add a keystore and set these values in `android/gradle.properties` or GitHub secrets:

- `RELEASE_STORE_FILE`
- `RELEASE_STORE_PASSWORD`
- `RELEASE_KEY_ALIAS`
- `RELEASE_KEY_PASSWORD`

Then the Android release build will use the configured signing options.
