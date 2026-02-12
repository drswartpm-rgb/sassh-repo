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

  return res.result.entries
    .filter((e) => e[".tag"] === "folder")
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

export interface ArticleMetadata {
  filename: string;
  title: string;
  description: string;
  imageFilename?: string;
}

export async function getMetadata(
  folderPath: string
): Promise<ArticleMetadata[]> {
  const raw = await downloadFile(`${folderPath}/metadata.json`);
  return JSON.parse(raw.toString("utf-8"));
}
