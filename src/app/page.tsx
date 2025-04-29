"use client";

import Image from "next/image";
import { useState } from "react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export default function Home() {
  const [imageId, setImageId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!isSupabaseConfigured()) {
      setError(
        "Supabase is not configured. Please check your environment variables."
      );
      return;
    }

    try {
      setIsUploading(true);
      setError(null);

      // Create a unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()
        .toString(36)
        .substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError, data } = await supabase.storage
        .from("images")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Storage error:", uploadError);
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath);

      // Insert record into images table
      const { error: dbError, data: imageRecord } = await supabase
        .from("images")
        .insert([
          {
            storage_path: filePath,
            url: publicUrl,
            mime_type: file.type,
            size_in_bytes: file.size,
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error("Database error:", dbError);
        throw dbError;
      }

      setImageId(imageRecord.id);
      setPreviewUrl(publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload image");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const copyToClipboard = () => {
    if (imageId) {
      const url = `${window.location.origin}/image/${imageId}`;
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isSupabaseConfigured()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center p-4">
          <h1 className="text-xl font-bold mb-4">⚠️ Configuration Required</h1>
          <p className="text-gray-600">
            Supabase environment variables are not configured.
            <br />
            Please set NEXT_PUBLIC_SUPABASE_URL and
            NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <div className="flex flex-col items-center gap-4 w-full">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-violet-50 file:text-violet-700
              hover:file:bg-violet-100
              disabled:opacity-50 disabled:cursor-not-allowed"
          />

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

          {isUploading && <p className="text-sm mt-2">Uploading...</p>}

          {imageId && previewUrl && (
            <div className="flex flex-col items-center gap-4 mt-4">
              <div className="relative w-64 h-64">
                <Image
                  src={previewUrl}
                  alt="Uploaded preview"
                  fill
                  className="object-contain"
                />
              </div>

              <div className="flex items-center gap-2 w-full max-w-md">
                <input
                  type="text"
                  value={`${window.location.origin}/image/${imageId}`}
                  readOnly
                  className="flex-1 p-2 border rounded text-sm truncate"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-violet-600 text-white rounded hover:bg-violet-700 transition-colors"
                >
                  {copied ? "Copied!" : "Copy URL"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
