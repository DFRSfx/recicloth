let appHandler: ((req: any, res: any) => unknown) | null = null;
let bootstrapError: Error | null = null;

const getAppHandler = async () => {
  if (appHandler || bootstrapError) return;

  try {
    const mod = await import('../backend/src/app.js');
    appHandler = mod.default;
  } catch (error) {
    bootstrapError = error instanceof Error ? error : new Error(String(error));
    console.error('❌ API bootstrap failed:', bootstrapError);
  }
};

export default async function handler(req: any, res: any) {
  await getAppHandler();

  if (!appHandler) {
    return res.status(500).json({
      error: 'API bootstrap failed',
      message: bootstrapError?.message || 'Unknown bootstrap error',
      stack: bootstrapError?.stack || null,
    });
  }

  return appHandler(req, res);
}
