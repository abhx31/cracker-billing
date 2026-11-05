/**
 * Product list from "clean_material_list_.pdf" (73 items).
 *
 * sp: price of one piece. pack: [pack price, pieces per pack] when the item is
 * also sold as a whole pack. The list has no stock counts, so stock starts at 0.
 */
export type MaterialItem = {
  name: string;
  brand: string;
  sp: number | null;
  pack?: [price: number, pieces: number];
};

export const materialList: MaterialItem[] = [
  { name: "BIRD OTH", brand: "OTH", sp: 15, pack: [350, 25] },
  { name: "3 1/2 LAXMI", brand: "OTH", sp: 45, pack: [600, 15] },
  { name: "4 LAXMI", brand: "RGD", sp: 55, pack: [550, 10] },
  { name: "2 SOUND", brand: "RAINBOWS GS FANCY", sp: 70, pack: [650, 10] },
  // The list names both rows "5 LAXMI (20 PLY)"; names must be unique, so the
  // Rainbow one keeps its supplier name "25 PLY" (matched by brand).
  { name: "5 LAXMI (25 PLY)", brand: "RAINBOW AND GSWAMY", sp: 90, pack: [500, 5] },
  { name: "5 LAXMI (20 PLY)", brand: "OTH F", sp: 100 },
  { name: "28 CHORSA", brand: "OTHER", sp: 40, pack: [1200, 50] },
  { name: "28 GIANT", brand: "OTHER", sp: 45, pack: [900, 25] },
  { name: "24 DELUX", brand: "OTHER", sp: 70, pack: [600, 10] },
  { name: "HYDRO BOMB", brand: "RGD PL", sp: 110, pack: [650, 5] },
  { name: "KING KONG", brand: "RGD", sp: 200, pack: [900, 5] },
  { name: "CLASSIC BOMB", brand: "RGD", sp: 300, pack: [1250, 5] },
  { name: "BULLET BOMB", brand: "OTHER", sp: 40, pack: [200, 5] },
  { name: "SNAKE", brand: "OTHER", sp: 15, pack: [135, 10] },
  { name: "100 WALA", brand: "RGD", sp: 80 },
  { name: "200 WALA", brand: "RGD", sp: 170 },
  { name: "300 WALA", brand: "RGD", sp: 225 },
  { name: "1000 WALA", brand: "OTHER", sp: 249 },
  { name: "2000 WALA", brand: "OTHER", sp: 550 },
  // Two "5000 WALA" rows (different brands); suffixed to keep names unique.
  { name: "5000 WALA OTH", brand: "OTHER", sp: 1250 },
  { name: "10000 WALA", brand: "OTHER", sp: 3000 },
  { name: "5000 WALA RGD", brand: "RGD", sp: 1500 },
  { name: "FP BIG", brand: "RGD", sp: 180, pack: [850, 5] },
  { name: "FP ASHOKA", brand: "RGD", sp: 300, pack: [1350, 5] },
  { name: "GC ASHOKA", brand: "RGD", sp: 150, pack: [700, 5] },
  { name: "GC SPCL", brand: "RGD", sp: 165, pack: [800, 5] },
  { name: "GC DELUX", brand: "RGD", sp: 350, pack: [1450, 5] },
  { name: "BOMB ROCKET RGD", brand: "RGD", sp: 140, pack: [600, 5] },
  { name: "COLOUR ROCKET", brand: "RGD", sp: 110, pack: [550, 5] },
  { name: "LUNIK ROCKET", brand: "RGD", sp: 280, pack: [510, 2] },
  { name: "3 SOUND ROCKET", brand: "RGD", sp: 350, pack: [650, 2] },
  { name: "1 1/2 STAR OTH", brand: "OTH", sp: 35, pack: [310, 10] },
  { name: "10 PENCIL", brand: "RGD", sp: 120, pack: [1050, 10] },
  { name: "4 T STAR", brand: "OTH", sp: 125, pack: [1100, 10] },
  // No price in the list: added archived (hidden from billing) until priced.
  { name: "BIJU CRACKERS RED", brand: "D.O", sp: null },
  { name: "12 CM P", brand: "DURGA AND HARI RAM", sp: 65, pack: [325, 5] },
  { name: "12 CM C", brand: "DURGA AND HARI RAM", sp: 65, pack: [325, 5] },
  { name: "15 CM P", brand: "DURGA AND HARI RAM", sp: 85, pack: [170, 2] },
  { name: "15 CM C", brand: "DURGA AND HARI RAM", sp: 90, pack: [180, 2] },
  { name: "30 CM P", brand: "DURGA AND HARI RAM", sp: 105, pack: [210, 2] },
  { name: "30 CM C", brand: "OTH", sp: 105, pack: [210, 2] },
  { name: "WHISTLE ROCKET", brand: "ODINATION", sp: 280 },
  { name: "NAZI GREEN", brand: "OTH F", sp: 280, pack: [1350, 5] },
  { name: "KIT KAT", brand: "OTH F", sp: 120, pack: [950, 10] },
  { name: "POPS", brand: "OTH F", sp: 10, pack: [490, 50] },
  { name: "12 SHOT GS", brand: "RAINBOW AND GS FANCY", sp: 290 },
  { name: "15 SHOT GS", brand: "RAINBOW AND GS FANCY", sp: 490 },
  { name: "30 SHOTS OTH", brand: "OTH F", sp: 700 },
  { name: "60 SHOTS OTH", brand: "OTH F", sp: 1300 },
  { name: "7 SHOT 10 PC", brand: "RAINBOW AND GS FANCY", sp: 285 },
  { name: "LOTUS", brand: "AYYAN", sp: 420 },
  { name: "CLASSIC WHEEL", brand: "AYYAN", sp: 540 },
  { name: "PEACOCK", brand: "OTH F", sp: 300 },
  { name: "BADA PEACOCK", brand: "OTH F", sp: 650 },
  { name: "STAR POT FOUNTAIN", brand: "OTH F", sp: 210 },
  { name: "2 IN 1 POTS", brand: "POTS", sp: 620 },
  { name: "BEER TINS", brand: "OTHER FANCY", sp: 105 },
  { name: "DRONE", brand: "OTHER FANCY", sp: 250 },
  { name: "HAPPY POTTER", brand: "AJANTHA", sp: 350 },
  { name: "SCOOBY DOO", brand: "AJANTHA", sp: 260 },
  { name: "HELICOPTER", brand: "OTHER FANCY", sp: 250 },
  { name: "LEMON TREE FOUNTAIN", brand: "AYYAN", sp: 230 },
  { name: "ONE COMMET", brand: "OTHER", sp: 80, pack: [360, 5] },
  { name: "TWO COMMET", brand: "OTHER", sp: 140 },
  { name: "THREE COMMET", brand: "RAINBOW AND GS FANCY", sp: 350 },
  { name: "3 1/2 COMMET", brand: "OTHER", sp: 450 },
  { name: "CANDYCRUSH", brand: "AJANTHA", sp: 1050 },
  { name: "PUBG", brand: "AJANTHA", sp: 300 },
  { name: "MAGICAL SWORD", brand: "AJANTHA", sp: 590 },
  { name: "COLOR KOTI DG", brand: "VEL", sp: 350 },
  { name: "XL 4 BLACK", brand: "EAGLE PISTOL", sp: 110 },
  { name: "RING CAP PLASTIC", brand: "CORENATION", sp: 10, pack: [850, 100] },
  { name: "4 COMMET 2PC", brand: "RAINBOW AND GS FANCY", sp: 1500 },
];
