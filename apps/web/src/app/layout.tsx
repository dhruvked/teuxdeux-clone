import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import "@mantine/core/styles.css";
import "@/app/global.css";

export const metadata = {
  title: "TODO_sample",
  description: "TeuxDeux Clone",
};

export const viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Fonts */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />

        {/* Mobile UX */}
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />

        {/* Debug Console (Eruda) — Loaded only on mobile */}
        <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && /mobile|android|iphone/i.test(navigator.userAgent)) {
                eruda.init({
                  defaults: {
                    displaySize: 30,
                    transparency: 0.95,
                    position: 'right'
                  }
                });
              }
            `,
          }}
        />
      </head>

      <body
        style={{
          fontFamily: "Inter, sans-serif",
        }}
      >
        <MantineProvider defaultColorScheme="dark">{children}</MantineProvider>
      </body>
    </html>
  );
}
