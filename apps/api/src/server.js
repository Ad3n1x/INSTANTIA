import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { PDFDocument } from 'pdf-lib';
import { fileTypeFromBuffer } from 'file-type';
import { capabilities, routeRequest } from './capabilities.js';
import { planRequest } from './request-engine.js';

const app = express();
const port = Number(process.env.PORT || 8080);
const maxMb = Math.max(1, Number(process.env.MAX_UPLOAD_MB || 15));
app.disable('x-powered-by');
app.use(cors({ origin(origin, cb) {
  const allowed = (process.env.WEB_ORIGIN || 'http://localhost:5173').split(',').map(x => x.trim());
  if (!origin || allowed.includes('*') || allowed.includes(origin)) return cb(null, true);
  return cb(new Error('Origin not allowed'));
} }));
app.use(express.json({ limit: '1mb' }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxMb * 1024 * 1024, files: 20 } });

app.get('/health', (_req, res) => res.json({ ok: true, service: 'instantia-api', version: '0.1.0' }));
app.get('/api/capabilities', (_req, res) => res.json({ capabilities }));
app.post('/api/requests/route', async (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim().slice(0, 2000) : '';
  if (!prompt) return res.status(400).json({ error: 'Enter a description of the capability you need.' });
  const route = routeRequest(prompt);
  const capability = capabilities.find(c => c.id === route.capabilityId);
  if (route.capabilityId === 'image-to-pdf') {
    return res.json({ ...route, capability, executionStatus: 'ready-for-input', message: 'Verified capability selected. Upload images in the Image to PDF tool below to create your PDF.' });
  }
  try {
    const plan = await planRequest(prompt);
    return res.json({ ...route, capability, plan, executionStatus: plan.executionStatus, message: plan.message });
  } catch (error) {
    console.error('Request planning failed:', error?.message || error);
    return res.status(502).json({ error: 'INSTANTIA could not create a plan right now. Check the configured planning provider and try again.' });
  }
});

app.post('/api/tools/image-to-pdf', upload.array('images', 20), async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ error: 'Upload at least one PNG or JPEG image.' });
    const pdf = await PDFDocument.create();
    for (const file of files) {
      const type = await fileTypeFromBuffer(file.buffer);
      let image;
      if (type?.mime === 'image/png') image = await pdf.embedPng(file.buffer);
      else if (type?.mime === 'image/jpeg') image = await pdf.embedJpg(file.buffer);
      else return res.status(415).json({ error: `${file.originalname}: only genuine PNG and JPEG images are supported.` });
      const page = pdf.addPage([image.width, image.height]);
      page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
    }
    const bytes = await pdf.save();
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="instantia-document.pdf"', 'Cache-Control': 'no-store' });
    return res.send(Buffer.from(bytes));
  } catch (error) {
    if (error?.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: `Each upload must be no larger than ${maxMb} MB.` });
    console.error('PDF capability failed:', error?.message || error);
    return res.status(500).json({ error: 'PDF generation failed. Please check your images and try again.' });
  }
});
app.use((err, _req, res, _next) => {
  if (err?.message === 'Origin not allowed') return res.status(403).json({ error: 'Origin not allowed.' });
  if (err instanceof multer.MulterError) return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? `Upload exceeds ${maxMb} MB.` : 'Invalid upload.' });
  console.error('Unhandled API error:', err?.message || err);
  res.status(500).json({ error: 'Unexpected server error.' });
});
app.listen(port, () => console.log(`INSTANTIA API listening on ${port}`));
export { app };
