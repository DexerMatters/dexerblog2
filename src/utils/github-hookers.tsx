import useSWR from "swr";

export interface DocItem { name: string; path: string; type: string; download_url: string | null }

const apiKey = process.env.NEXT_PUBLIC_GITHUB_API_KEY;

const fetcher = (url: string) => {
  const options: RequestInit = {
    headers: {
      ...(apiKey && { Authorization: `token ${apiKey}` }),
      Accept: "application/vnd.github.v3+json"
    }
  };
  return fetch(url, options).then(res => res.json()).then(data => (data as Array<DocItem>).filter(
    item => {
      return item.name.startsWith('.') === false;
    }
  ));
}

export function useDocList(path: string) {
  const fetcher = (url: string) => {
    const options: RequestInit = {
      headers: {
        ...(apiKey && { Authorization: `token ${apiKey}` }),
        Accept: "application/vnd.github.v3+json"
      }
    };
    return fetch(url, options).then(res => res.json()).then(data => (data as Array<DocItem>).filter(
      item => {
        return item.name.startsWith('.') === false;
      }
    ));
  }
  const { data, error, isLoading } = useSWR(`https://api.github.com/repos/DexerMatters/dexerblog-docs/contents/${path}`, fetcher);
  return {
    data: data as Array<DocItem> | undefined,
    error,
    isLoading
  };
}


export function useDocContent(path: string) {
  const fetcher = (url: string) =>
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch document content");
        return res.text();
      });
  const { data, error, isLoading } = useSWR(`https://raw.githubusercontent.com/DexerMatters/dexerblog-docs/refs/heads/main/${path}`, fetcher);
  return {
    data: data as string | undefined,
    error,
    isLoading
  };
}