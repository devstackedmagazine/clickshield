export type ScanInput =
  | { type: 'screenshot'; base64: string }
  | { type: 'url'; value: string }
  | { type: 'text'; value: string };
