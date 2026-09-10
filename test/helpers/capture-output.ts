export async function captureOutput(run: () => Promise<void>): Promise<string> {
  const lines: string[] = [];
  const log = jest.spyOn(console, 'log').mockImplementation((...args: unknown[]) => {
    lines.push(args.map(String).join(' '));
  });

  try {
    await run();
  } finally {
    log.mockRestore();
  }

  return lines.join('\n');
}
