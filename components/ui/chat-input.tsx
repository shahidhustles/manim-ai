"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "./button";
import Image from "next/image";

interface ChatInputProps {
  onSend: (message: string, image?: File | null) => void;
}

export function ChatInput({ onSend }: ChatInputProps) {
  const [message, setMessage] = useState<string>("");
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setImage(file);
          const reader = new FileReader();
          reader.onload = (event) => {
            setImagePreview(event.target?.result as string);
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && !image) return;

    onSend(message, image);
    setMessage("");
    setImage(null);
    setImagePreview(null);

    // Focus the input after sending
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

// Submit on Enter (without shift for new line)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full rounded-xl bg-background border shadow-sm">
      {imagePreview && (
        <div className="relative p-2 border-b">
          <p className="text-xs text-muted-foreground mb-1">Image attached:</p>
          <div className="relative w-20 h-20">
            <Image
              src={imagePreview}
              alt="Pasted image"
              fill
              className="object-cover rounded-md"
            />
            <button
              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center"
              onClick={removeImage}
              type="button"
              aria-label="Remove image"
            >
              x
            </button>
          </div>
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex items-center p-2">
        <div className="flex-1 flex items-center rounded-full bg-muted/50 border px-3 py-1.5 mr-2">
          <textarea
            ref={inputRef}
            className="flex-1 bg-transparent resize-none outline-none min-h-[36px] max-h-24 py-1.5 text-sm"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground p-1 rounded-full"
              onClick={triggerFileInput}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-5"
              >
                <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
              </svg>
            </button>
          </div>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileSelect}
        />
        <Button type="submit" className="rounded-full px-4">
          Send Message
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4 ml-1"
          >
            <line x1="22" x2="11" y1="2" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </Button>
      </form>
    </div>
  );
}
