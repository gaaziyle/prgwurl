"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface ImageData {
  url: string;
  title?: string;
  description?: string;
}

export default function ImagePage() {
  const params = useParams();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImage() {
      try {
        const { data, error } = await supabase
          .from("images")
          .select("*")
          .eq("id", params.id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setImageData(data);
        } else {
          setError("Image not found");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load image");
      } finally {
        setIsLoading(false);
      }
    }

    fetchImage();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !imageData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>{error || "Image not found"}</p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="relative w-full max-w-[100vw] h-[100vh]">
        <Image
          src={imageData.url}
          alt={imageData.title || "Uploaded image"}
          fill
          className="object-contain"
        />
        {imageData.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
            <h2 className="text-xl font-bold">{imageData.title}</h2>
            {imageData.description && (
              <p className="mt-2">{imageData.description}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
