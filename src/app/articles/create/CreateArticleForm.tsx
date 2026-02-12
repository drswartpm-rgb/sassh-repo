"use client";

import { useRouter } from "next/navigation";
import ArticleUploadForm from "@/components/ArticleUploadForm";

export default function CreateArticleForm() {
  const router = useRouter();

  return (
    <ArticleUploadForm
      onCreated={() => {
        router.push("/dashboard");
      }}
    />
  );
}
