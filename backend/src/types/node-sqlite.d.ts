// Type shim for Node.js built-in sqlite (node:sqlite), available Node 22.5+
// Remove once @types/node ships full typings.
declare module 'node:sqlite' {
  interface StatementResult {
    changes: number;
    lastInsertRowid: number | bigint;
  }

  interface Statement {
    run(...params: unknown[]): StatementResult;
    get(...params: unknown[]): Record<string, unknown> | undefined;
    all(...params: unknown[]): Record<string, unknown>[];
  }

  class DatabaseSync {
    constructor(location: string, options?: { open?: boolean });
    open(): void;
    close(): void;
    exec(sql: string): void;
    prepare(sql: string): Statement;
  }
}
