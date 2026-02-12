import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import {
  listCategoryFolders,
  downloadFile,
  getMetadata,
  listFilesRecursive,
} from "@/lib/dropbox";

const SYNC_BOT_EMAIL = "dropbox-sync@sassh.system";

async function getSyncBotUser() {
  const user = await prisma.user.findUnique({
    where: { email: SYNC_BOT_EMAIL },
  });
  if (!user) {
    throw new Error(
      `Sync bot user not found (${SYNC_BOT_EMAIL}). Run the seed script first.`
    );
  }
  return user;
}

async function ensureCategory(name: string) {
  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing) return existing;

  const maxOrder = await prisma.category.aggregate({ _max: { order: true } });
  return prisma.category.create({
    data: { name, order: (maxOrder._max.order ?? 0) + 1 },
  });
}

export interface SyncStats {
  created: number;
  skipped: number;
  errors: { folder: string; file: string; error: string }[];
}

export async function runSync(): Promise<SyncStats> {
  const stats: SyncStats = { created: 0, skipped: 0, errors: [] };
  const bot = await getSyncBotUser();
  const folders = await listCategoryFolders();

  for (const folder of folders) {
    let files;
    try {
      files = await listFilesRecursive(folder.path);
    } catch (err) {
      console.error("[sync] list error for", folder.name, err);
      stats.errors.push({
        folder: folder.name,
        file: "*",
        error: err instanceof Error ? err.message : "Could not list folder",
      });
      continue;
    }

    // Skip folders with no syncable documents
    const hasDocs = files.some((f) =>
      /\.(pdf|doc|docx|jpg|jpeg|png)$/i.test(f.name)
    );
    if (!hasDocs) continue;

    let metadata;
    try {
      metadata = await getMetadata(folder.path, files);
    } catch (err) {
      console.error("[sync] metadata error for", folder.name, err);
      stats.errors.push({
        folder: folder.name,
        file: "metadata",
        error: err instanceof Error ? err.message : "Could not parse metadata",
      });
      continue;
    }

    if (metadata.length === 0) continue;

    const category = await ensureCategory(folder.name);

    for (const entry of metadata) {
      const dropboxPath = entry.path;

      try {
        const exists = await prisma.article.findUnique({
          where: { dropboxPath },
        });
        if (exists) {
          stats.skipped++;
          continue;
        }

        // Download and upload article file
        const fileBuffer = await downloadFile(dropboxPath);
        const fileExt = entry.filename.split(".").pop()?.toLowerCase() || "";
        const contentTypeMap: Record<string, string> = {
          pdf: "application/pdf",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
        };
        const pdfBlob = await put(
          `articles/sync/${folder.name}/${entry.filename}`,
          fileBuffer,
          { access: "public", contentType: contentTypeMap[fileExt] || "application/octet-stream" }
        );

        // Download and upload cover image if specified
        let imageUrl: string | undefined;
        const imagePath = entry.imagePath || (entry.imageFilename
          ? `${folder.path}/${entry.imageFilename}`
          : undefined);

        if (imagePath) {
          try {
            const imgBuffer = await downloadFile(imagePath);
            const ext = imagePath.split(".").pop() || "jpg";
            const contentType = ext === "png" ? "image/png" : "image/jpeg";
            const imgBlob = await put(
              `articles/sync/${folder.name}/${entry.imageFilename}`,
              imgBuffer,
              { access: "public", contentType }
            );
            imageUrl = imgBlob.url;
          } catch {
            // Image is optional — continue without it
          }
        }

        await prisma.article.create({
          data: {
            title: entry.title,
            description: entry.description,
            pdfUrl: pdfBlob.url,
            imageUrl: imageUrl ?? null,
            published: true,
            authorId: bot.id,
            categoryId: category.id,
            dropboxPath,
            syncedAt: new Date(),
          },
        });

        stats.created++;
      } catch (err) {
        stats.errors.push({
          folder: folder.name,
          file: entry.filename,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }
  }

  return stats;
}
