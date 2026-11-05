import "server-only";
import path from "node:path";
import { Font, renderToBuffer } from "@react-pdf/renderer";
import type { BillWithItems } from "@/db/schema";
import { BillDocument } from "./bill-document";

// Fonts ship with the app (see next.config.ts outputFileTracingIncludes) since
// the built-in PDF fonts have no ₹ glyph.
const FONT_DIR = path.join(process.cwd(), "src/features/bills/pdf/fonts");

let fontsRegistered = false;

function registerFonts() {
  if (fontsRegistered) return;
  Font.register({
    family: "NotoSans",
    fonts: [
      { src: path.join(FONT_DIR, "NotoSans-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "NotoSans-Bold.ttf"), fontWeight: 700 },
    ],
  });
  // Don't split product names like "LAXMI" across lines with hyphens.
  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}

export async function renderBillPdf(bill: BillWithItems, shopName: string) {
  registerFonts();
  return renderToBuffer(<BillDocument bill={bill} shopName={shopName} />);
}
