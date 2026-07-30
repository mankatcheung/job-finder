import type { FastifyInstance } from 'fastify';
import { createReadStream } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';

export async function registerUploadRoutes(fastify: FastifyInstance): Promise<void> {
  const uploadDir = join(process.cwd(), 'uploads');

  // Serve uploaded files
  fastify.get('/uploads/:key', async (request, reply) => {
    const { key } = request.params as { key: string };
    const filePath = join(uploadDir, key);

    try {
      await stat(filePath);
      return reply.type('application/octet-stream').send(createReadStream(filePath));
    } catch {
      return reply.code(404).send({ error: 'File not found' });
    }
  });

  // Handle upload requests (used by LocalStorageProvider)
  fastify.post('/uploads/_upload/:key', async (request, reply) => {
    const { key } = request.params as { key: string };
    const filePath = join(uploadDir, key);

    try {
      const data = await request.file();
      if (!data) {
        return reply.code(400).send({ error: 'No file provided' });
      }

      const { writeFile, mkdir } = await import('fs/promises');
      const { dirname } = await import('path');
      await mkdir(dirname(filePath), { recursive: true });

      const chunks: Buffer[] = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      await writeFile(filePath, Buffer.concat(chunks));

      return reply.code(200).send({ success: true, key });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Upload failed' });
    }
  });
}
