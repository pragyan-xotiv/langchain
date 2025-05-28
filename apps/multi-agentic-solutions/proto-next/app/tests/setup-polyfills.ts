import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';

// First ensure these properties exist on global
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = NodeTextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  // @ts-expect-error - TextDecoder implementation from Node.js doesn't match web API exactly
  global.TextDecoder = NodeTextDecoder;
}

// Mock ReadableStream for Node.js environment
class MockReadableStream {
  // Constructor takes no options in this mock implementation
  constructor() {
    /* No initialization needed */
  }

  getReader() {
    return {
      read: () => Promise.resolve({ done: true, value: undefined }),
      releaseLock: () => { /* no-op */ },
    };
  }

  pipeThrough() {
    return new MockReadableStream();
  }

  pipeTo() {
    return Promise.resolve();
  }

  tee(): [MockReadableStream, MockReadableStream] {
    return [new MockReadableStream(), new MockReadableStream()];
  }
}

// @ts-expect-error - ReadableStream is not available in Node.js environment
global.ReadableStream = MockReadableStream;
// @ts-expect-error - WritableStream is not available in Node.js environment
global.WritableStream = class MockWritableStream {};
// @ts-expect-error - TransformStream is not available in Node.js environment
global.TransformStream = class MockTransformStream {};

// Define types for better type checking
interface MockRequestInit {
  method?: string;
  headers?: Record<string, string> | Headers;
  body?: string;
}

// Mock Headers implementation with entries() support
class MockHeaders {
  private headers: Map<string, string> = new Map();
  
  constructor(init?: Record<string, string> | Headers) {
    if (init) {
      if (init instanceof MockHeaders) {
        // Copy from another Headers object
        for (const [key, value] of init.entries()) {
          this.set(key, value);
        }
      } else if (init instanceof Map) {
        // Copy from a Map
        for (const [key, value] of init.entries()) {
          this.set(key, value);
        }
      } else {
        // Copy from a plain object
        Object.entries(init).forEach(([key, value]) => {
          this.set(key, value);
        });
      }
    }
  }
  
  get(name: string): string | null {
    return this.headers.get(name.toLowerCase()) || null;
  }
  
  set(name: string, value: string): void {
    this.headers.set(name.toLowerCase(), value);
  }
  
  has(name: string): boolean {
    return this.headers.has(name.toLowerCase());
  }
  
  delete(name: string): void {
    this.headers.delete(name.toLowerCase());
  }
  
  append(name: string, value: string): void {
    const key = name.toLowerCase();
    const existing = this.get(key);
    this.set(key, existing ? `${existing}, ${value}` : value);
  }
  
  // Add entries() method for iteration
  *entries(): IterableIterator<[string, string]> {
    for (const [key, value] of this.headers.entries()) {
      yield [key, value];
    }
  }
  
  // Add keys() method
  *keys(): IterableIterator<string> {
    for (const key of this.headers.keys()) {
      yield key;
    }
  }
  
  // Add values() method
  *values(): IterableIterator<string> {
    for (const value of this.headers.values()) {
      yield value;
    }
  }
  
  // Add forEach method
  forEach(callback: (value: string, key: string, parent: Headers) => void): void {
    for (const [key, value] of this.entries()) {
      callback(value, key, this as unknown as Headers);
    }
  }
  
  // Add Symbol.iterator method
  *[Symbol.iterator](): IterableIterator<[string, string]> {
    yield* this.entries();
  }
}

// @ts-expect-error - Headers is not available in Node.js environment
global.Headers = MockHeaders;

// Mock Request for Node.js environment
class MockRequest {
  private _url: string;
  method: string;
  headers: Headers;
  
  constructor(url: string, options?: MockRequestInit) {
    this._url = url;
    this.method = options?.method || 'GET';
    this.headers = new Headers(options?.headers);
  }
  
  get url(): string {
    return this._url;
  }
}

// @ts-expect-error - Request is not available in Node.js environment
global.Request = MockRequest;

// Mock Response for Node.js environment
class MockResponse {
  status: number;
  statusText: string;
  headers: Headers;
  body: null;
  
  constructor(_body?: unknown, options?: { status?: number; statusText?: string; headers?: Record<string, string> }) {
    this.status = options?.status || 200;
    this.statusText = options?.statusText || 'OK';
    this.headers = new Headers(options?.headers);
    this.body = null;
  }
  
  json() {
    return Promise.resolve({});
  }
  
  text() {
    return Promise.resolve('');
  }
}

// @ts-expect-error - Response is not available in Node.js environment
global.Response = MockResponse;

// Define cookies interface for NextRequest
interface RequestCookies {
  // Unused parameter silenced with underscore prefix
  get: (_name: string) => null;
  getAll: () => [];
  set: () => void;
  delete: () => void;
  has: () => boolean;
}

// Mock NextRequest implementation
class MockNextRequest extends MockRequest {
  readonly cookies: RequestCookies;
  readonly nextUrl: { pathname: string; searchParams: URLSearchParams };
  readonly ip: string;
  readonly geo: { country: string; city: string; region: string };
  
  constructor(input: string, init?: MockRequestInit) {
    super(input, init);
    this.cookies = {
      get: () => null,
      getAll: () => [],
      set: () => { /* no-op */ },
      delete: () => { /* no-op */ },
      has: () => false,
    };
    this.nextUrl = { pathname: '/', searchParams: new URLSearchParams() };
    this.ip = '127.0.0.1';
    this.geo = { country: 'US', city: 'Unknown', region: 'Unknown' };
  }
}

// Mock NextResponse
class MockNextResponse extends MockResponse {
  static json(data: unknown, init?: { status?: number; headers?: Record<string, string> }) {
    return new MockNextResponse(JSON.stringify(data), init);
  }
}

// @ts-expect-error - NextRequest is not available in Node.js environment
global.NextRequest = MockNextRequest;
// @ts-expect-error - NextResponse is not available in Node.js environment 
global.NextResponse = MockNextResponse;

// Add console.log to confirm the polyfills are loaded
console.log('Polyfills loaded: TextEncoder, TextDecoder, and other browser APIs are now available in the test environment.'); 