import { Dropbox } from "dropbox";

let cachedClient: Dropbox | null = null;
let cachedAccessToken = "";
let tokenExpiry = 0;

async function refreshAccessToken(): Promise<string> {
  const res = await fetch("https://api.dropbox.com/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.DROPBOX_APP_KEY}:${process.env.DROPBOX_APP_SECRET}`
        ).toString("base64"),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: process.env.DROPBOX_REFRESH_TOKEN!,
    }),
  });

  if (!res.ok) {
    throw new Error(`Dropbox token refresh failed: ${res.status}`);
  }

  const data = await res.json();
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
  cachedAccessToken = data.access_token;
  return cachedAccessToken;
}

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < tokenExpiry) {
    return cachedAccessToken;
  }
  return refreshAccessToken();
}

export async function getDropboxClient(): Promise<Dropbox> {
  if (cachedClient && Date.now() < tokenExpiry) {
    return cachedClient;
  }

  const accessToken = await getAccessToken();
  cachedClient = new Dropbox({ accessToken, fetch: globalThis.fetch });
  return cachedClient;
}

const ROOT_PATH = () => process.env.DROPBOX_ROOT_PATH || "";

export async function listCategoryFolders(): Promise<
  { name: string; path: string }[]
> {
  const dbx = await getDropboxClient();
  const res = await dbx.filesListFolder({ path: ROOT_PATH() });

  const EXCLUDED_FOLDERS = ["uploads"];

  return res.result.entries
    .filter(
      (e) =>
        e[".tag"] === "folder" &&
        !EXCLUDED_FOLDERS.includes(e.name.toLowerCase())
    )
    .map((e) => ({ name: e.name, path: e.path_lower! }));
}

export async function downloadFile(path: string): Promise<Buffer> {
  const accessToken = await getAccessToken();
  const res = await fetch("https://content.dropboxapi.com/2/files/download", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Dropbox-API-Arg": JSON.stringify({ path }),
    },
  });

  if (!res.ok) {
    throw new Error(`Download failed (${res.status}) for ${path}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

export interface DropboxFileEntry {
  name: string;
  path: string;
  size: number;
}

export async function listFilesRecursive(
  folderPath: string
): Promise<DropboxFileEntry[]> {
  const dbx = await getDropboxClient();
  const files: DropboxFileEntry[] = [];

  let res = await dbx.filesListFolder({
    path: folderPath,
    recursive: true,
  });

  for (const entry of res.result.entries) {
    if (entry[".tag"] === "file") {
      files.push({
        name: entry.name,
        path: entry.path_lower!,
        size: (entry as any).size ?? 0,
      });
    }
  }

  while (res.result.has_more) {
    res = await dbx.filesListFolderContinue({
      cursor: res.result.cursor,
    });
    for (const entry of res.result.entries) {
      if (entry[".tag"] === "file") {
        files.push({
          name: entry.name,
          path: entry.path_lower!,
          size: (entry as any).size ?? 0,
        });
      }
    }
  }

  return files;
}

export interface ArticleMetadata {
  filename: string;
  path: string;
  title: string;
  description: string;
  imageFilename?: string;
  imagePath?: string;
}

function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/ copy$/i, "")
    .replace(/[-_]/g, " ")
    .trim();
}

export async function getMetadata(
  folderPath: string,
  files: DropboxFileEntry[]
): Promise<ArticleMetadata[]> {
  // Try metadata.json first
  const metadataFile = files.find(
    (f) => f.name.toLowerCase() === "metadata.json"
  );
  if (metadataFile) {
    const raw = await downloadFile(metadataFile.path);
    const parsed = JSON.parse(raw.toString("utf-8"));
    return parsed.map((entry: any) => ({
      ...entry,
      path: `${folderPath}/${entry.filename}`,
    }));
  }

  // Auto-generate from PDF filenames
  const pdfs = files.filter((f) => f.name.toLowerCase().endsWith(".pdf"));
  const images = files.filter((f) =>
    /\.(jpg|jpeg|png|webp)$/i.test(f.name)
  );

  return pdfs.map((pdf) => {
    const baseName = pdf.name.replace(/\.pdf$/i, "");
    const image = images.find((img) =>
      img.name.toLowerCase().startsWith(baseName.toLowerCase().replace(/ copy$/i, ""))
    );

    return {
      filename: pdf.name,
      path: pdf.path,
      title: titleFromFilename(pdf.name),
      description: "",
      imageFilename: image?.name,
      imagePath: image?.path,
    };
  });
}
