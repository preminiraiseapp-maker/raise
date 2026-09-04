import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/*
          Keep the app shell exactly as tall as the visible viewport so the
          bottom tab bar never ends up behind the mobile browser toolbar.
        */}
        <style dangerouslySetInnerHTML={{ __html: viewportFix }} />
        <script dangerouslySetInnerHTML={{ __html: appHeightScript }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;

const viewportFix = `
/* iOS Safari resolves 100%/100vh to the toolbar-hidden height, so the bottom
   of the page renders behind the floating toolbar. --app-h is set from
   window.innerHeight (the true visible height) by the script below; 100dvh is
   the fallback until it runs / on browsers without the script. */
html, body, #root {
  height: 100vh;
  height: 100dvh;
  height: var(--app-h, 100dvh);
}

/* Bottom tab bar = the element wrapping the role="tablist" row. Guarantee it's
   tall enough and padded enough that the labels clear the home indicator and
   any browser toolbar, whatever the JS safe-area value works out to. */
:has(> [role="tablist"]) {
  box-sizing: border-box !important;
  min-height: calc(58px + env(safe-area-inset-bottom, 0px)) !important;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 10px) !important;
}`;

const appHeightScript = `
(function () {
  function set() {
    document.documentElement.style.setProperty('--app-h', window.innerHeight + 'px');
  }
  set();
  window.addEventListener('resize', set);
  window.addEventListener('orientationchange', set);
  window.addEventListener('pageshow', set);
})();`;
