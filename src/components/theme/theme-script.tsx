import { THEME_STORAGE_KEY } from "./constants";

// Runs while the HTML is parsed, before first paint, so a saved dark theme
// never flashes light. Mirrors applyTheme() in ./theme.ts.
const script = `(function(){try{var p=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=p==="dark"||(p!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light"}catch(e){}})()`;

export function ThemeScript() {
  return (
    <script
      // React warns about rendering <script> on the client; only the server
      // copy needs to execute (see Next.js "preventing flash" guide).
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: script }}
    />
  );
}
