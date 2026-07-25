// BR Code (Pix) payload generator — static QR with fixed CNPJ key.
// Reference: BCB Manual do BR Code (EMV MPM).

function tlv(id: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${id}${len}${value}`;
}

function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) !== 0 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

function sanitize(text: string, max: number): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .slice(0, max)
    .trim();
}

export function buildPixPayload(opts: {
  key: string;
  merchantName: string;
  merchantCity: string;
  amount?: number; // BRL
  txid?: string;
  description?: string;
}): string {
  const key = opts.key.replace(/\D/g, ""); // CNPJ digits only
  const name = sanitize(opts.merchantName, 25) || "RECEBEDOR";
  const city = sanitize(opts.merchantCity, 15) || "BRASIL";
  const txid = sanitize(opts.txid || "***", 25) || "***";

  const gui = tlv("00", "br.gov.bcb.pix");
  const pixKey = tlv("01", key);
  const desc = opts.description ? tlv("02", sanitize(opts.description, 40)) : "";
  const mai = tlv("26", gui + pixKey + desc);

  const parts = [
    tlv("00", "01"), // payload format
    tlv("01", "12"), // dynamic-friendly (12 = many payments)
    mai,
    tlv("52", "0000"), // merchant category
    tlv("53", "986"), // BRL
    ...(opts.amount && opts.amount > 0
      ? [tlv("54", opts.amount.toFixed(2))]
      : []),
    tlv("58", "BR"),
    tlv("59", name),
    tlv("60", city),
    tlv("62", tlv("05", txid)),
  ];

  const partial = parts.join("") + "6304";
  return partial + crc16(partial);
}
