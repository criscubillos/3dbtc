export interface WsCallbacks {
  onTrade: (price: number) => void;
  onTicker: (data: Record<string, string>) => void;
  onBookTicker: (data: Record<string, string>) => void;
  onAggTrade: (data: Record<string, string | boolean>) => void;
}

export class BinanceWebSocket {
  private ws: WebSocket | null = null;
  private symbol: string;
  private callbacks: WsCallbacks;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disposed = false;

  constructor(symbol: string, callbacks: WsCallbacks) {
    this.symbol = symbol.toLowerCase();
    this.callbacks = callbacks;
    this.connect();
  }

  private connect() {
    if (this.disposed) return;

    const sym = this.symbol;
    this.ws = new WebSocket(
      `wss://stream.binance.com:9443/stream?streams=${sym}@trade/${sym}@ticker/${sym}@bookTicker/${sym}@aggTrade`
    );

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      const { stream, data } = msg;
      if (stream.endsWith('@trade')) {
        this.callbacks.onTrade(parseFloat(data.p));
      } else if (stream.endsWith('@ticker')) {
        this.callbacks.onTicker(data);
      } else if (stream.endsWith('@bookTicker')) {
        this.callbacks.onBookTicker(data);
      } else if (stream.endsWith('@aggTrade')) {
        this.callbacks.onAggTrade(data);
      }
    };

    this.ws.onclose = () => {
      if (!this.disposed) {
        this.reconnectTimer = setTimeout(() => this.connect(), 3000);
      }
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }

  dispose() {
    this.disposed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
  }
}
