import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { BillWithItems } from "@/db/schema";
import {
  formatBillNumber,
  formatCurrency,
  formatDateTime,
  formatQuantity,
  formatSignedCurrency,
} from "@/lib/format";
import { billRoundOff } from "../calc";

const colors = {
  text: "#1c1917",
  muted: "#78716c",
  border: "#e7e5e4",
  shade: "#fafaf9",
  accent: "#c2410c",
};

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSans",
    fontSize: 10,
    color: colors.text,
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 12,
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
  },
  brand: { flexDirection: "row", alignItems: "center" },
  logo: { width: 64, height: 64, marginRight: 12 },
  shopName: { fontSize: 18, fontWeight: 700 },
  docLabel: { color: colors.muted, marginTop: 2 },
  billNumber: { fontSize: 12, fontWeight: 700, textAlign: "right" },
  meta: { flexDirection: "row", marginBottom: 16 },
  metaItem: { flex: 1 },
  label: { color: colors.muted, fontSize: 8, marginBottom: 2, textTransform: "uppercase" },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 5,
  },
  headRow: { backgroundColor: colors.shade, fontWeight: 700 },
  cNo: { width: 24, paddingHorizontal: 4, color: colors.muted },
  cItem: { flex: 1, paddingHorizontal: 4 },
  cRate: { width: 70, paddingHorizontal: 4, textAlign: "right" },
  cQty: { width: 100, paddingHorizontal: 4, textAlign: "right" },
  cAmount: { width: 80, paddingHorizontal: 4, textAlign: "right" },
  totals: { marginTop: 12, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  grandTotal: {
    borderTopWidth: 1,
    borderTopColor: colors.text,
    marginTop: 4,
    paddingTop: 6,
    fontSize: 13,
    fontWeight: 700,
  },
  thanks: { marginTop: 28, textAlign: "center", color: colors.muted },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: colors.muted,
  },
});

export type PdfLogo = { data: Buffer; format: "jpg" | "png" };

export function BillDocument({
  bill,
  shopName,
  logo,
}: {
  bill: BillWithItems;
  shopName: string;
  logo?: PdfLogo;
}) {
  const billNumber = formatBillNumber(bill.id);
  const roundOff = billRoundOff(bill);

  return (
    <Document title={`${shopName} - ${billNumber}`} author={shopName} subject="Bill">
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt */}
            {logo && <Image src={logo} style={styles.logo} />}
            <View>
              <Text style={styles.shopName}>{shopName}</Text>
              <Text style={styles.docLabel}>Bill</Text>
            </View>
          </View>
          <View>
            <Text style={styles.billNumber}>{billNumber}</Text>
            <Text style={[styles.docLabel, { textAlign: "right" }]}>
              {formatDateTime(bill.createdAt)}
            </Text>
          </View>
        </View>

        <View style={styles.meta}>
          <View style={styles.metaItem}>
            <Text style={styles.label}>Customer</Text>
            <Text>{bill.customerName}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.label}>WhatsApp</Text>
            <Text>+{bill.customerPhone}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.label}>Billed by</Text>
            <Text>{bill.billedBy}</Text>
          </View>
        </View>

        {/* `fixed` repeats the table header on every page of long bills. */}
        <View style={[styles.row, styles.headRow]} fixed>
          <Text style={styles.cNo}>#</Text>
          <Text style={styles.cItem}>Item</Text>
          <Text style={styles.cRate}>Rate</Text>
          <Text style={styles.cQty}>Qty</Text>
          <Text style={styles.cAmount}>Amount</Text>
        </View>
        {bill.items.map((item, i) => (
          <View key={item.id} style={styles.row} wrap={false}>
            <Text style={styles.cNo}>{i + 1}</Text>
            <Text style={styles.cItem}>{item.productName}</Text>
            <Text style={styles.cRate}>{formatCurrency(item.unitPrice)}</Text>
            <Text style={styles.cQty}>
              {formatQuantity(item.quantity, item.unit, item.piecesPerUnit)}
            </Text>
            <Text style={styles.cAmount}>{formatCurrency(item.lineTotal)}</Text>
          </View>
        ))}

        <View style={styles.totals} wrap={false}>
          <View style={styles.totalRow}>
            <Text style={{ color: colors.muted }}>Subtotal</Text>
            <Text>{formatCurrency(bill.subtotal)}</Text>
          </View>
          {bill.discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: colors.muted }}>Discount ({bill.discountPercent}%)</Text>
              <Text>−{formatCurrency(bill.discountAmount)}</Text>
            </View>
          )}
          {roundOff !== 0 && (
            <View style={styles.totalRow}>
              <Text style={{ color: colors.muted }}>Round off</Text>
              <Text>{formatSignedCurrency(roundOff)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, styles.grandTotal]}>
            <Text>Total</Text>
            <Text>{formatCurrency(bill.total)}</Text>
          </View>
        </View>

        <Text style={styles.thanks}>Thank you for your purchase! Celebrate safely.</Text>

        <View style={styles.footer} fixed>
          <Text>
            {shopName} · {billNumber}
          </Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
