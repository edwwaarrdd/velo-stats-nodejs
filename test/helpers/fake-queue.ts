export interface RecordedJob {
  name: string;
  data: unknown;
}

/**
 * Stands in for a BullMQ queue so tests can assert what was dispatched without
 * a Redis server.
 */
export class FakeQueue {
  readonly jobs: RecordedJob[] = [];

  constructor(public readonly name: string) {}

  add(name: string, data: unknown): Promise<RecordedJob> {
    const job = { name, data };

    this.jobs.push(job);

    return Promise.resolve(job);
  }

  clear(): void {
    this.jobs.length = 0;
  }
}
