import type { Request, Response } from 'express';

let appHandler: ((req: Request, res: Response) => unknown) | null = null;
let bootstrapError: Error | null = null;

const getAppHandler = async () => {
  if (appHandler || bootstrapError) return;

  try {
    const mod = await import('../backend/src/app');
    appHandler = mod.default;
  } catch (error) {
    bootstrapError = error instanceof Error ? error : new Error(String(error));
    console.error('❌ API bootstrap failed:', bootstrapError);
  }
};

export default async function handler(req: Request, res: Response) {
  await getAppHandler();

  if (!appHandler) {
    return res.status(500).json({
      error: 'API bootstrap failed',
      message: bootstrapError?.message || 'Unknown bootstrap error',
    });
  }

  return appHandler(req, res);
}
