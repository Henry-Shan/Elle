"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import type { Attachment } from "ai";
import {
  ArrowUpIcon,
  PaperclipIcon,
  FileText,
  Users,
  FileSignature,
  GitCompare,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { PreviewAttachment } from "./preview-attachment";

export default function HomepageInput() {
  const router = useRouter();
  const { data: session } = useSession();
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [placeholder, setPlaceholder] = useState(
    "Ask Elle AI about hiring remote workers"
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  
  const phrases = [
    "hiring remote workers",
    "drafting SaaS NDA",
    "raise pre-seed funding",
  ];

  // Handle typing animation
  useEffect(() => {
    const baseText = "Ask Elle AI about ";
    const currentPhrase = phrases[phraseIndex];
    const typingSpeed = isDeleting ? 25 : 40;
    const pauseTime = 1500;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        // Typing phase
        if (charIndex < currentPhrase.length) {
          setPlaceholder(baseText + currentPhrase.substring(0, charIndex + 1));
          setCharIndex(charIndex + 1);
        } else {
          // Finished typing, pause then start deleting
          setTimeout(() => setIsDeleting(true), pauseTime);
        }
      } else {
        // Deleting phase
        if (charIndex > 0) {
          setPlaceholder(baseText + currentPhrase.substring(0, charIndex - 1));
          setCharIndex(charIndex - 1);
        } else {
          // Finished deleting, move to next phrase
          setIsDeleting(false);
          setPhraseIndex((phraseIndex + 1) % phrases.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [placeholder, isDeleting, phraseIndex, charIndex]);

  // Adjust textarea height
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${
        textareaRef.current.scrollHeight + 2
      }px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, attachments, uploadQueue, adjustHeight]);

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        const { url, pathname, contentType } = data;

        return {
          url,
          name: pathname,
          contentType: contentType,
        };
      }
      const { error } = await response.json();
      toast.error(error);
    } catch (error) {
      toast.error("Failed to upload file, please try again!");
    }
  };

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      setUploadQueue(files.map((file) => file.name));

      try {
        const uploadPromises = files.map((file) => uploadFile(file));
        const uploadedAttachments = await Promise.all(uploadPromises);
        const successfullyUploadedAttachments = uploadedAttachments.filter(
          (attachment) => attachment !== undefined
        ) as Attachment[];

        setAttachments((current) => [
          ...current,
          ...successfullyUploadedAttachments,
        ]);
      } catch (error) {
        console.error("Error uploading files!", error);
      } finally {
        setUploadQueue([]);
      }
    },
    []
  );

  const handleSubmit = () => {
    if (uploadQueue.length > 0) {
      toast.error("Please wait for files to finish uploading");
      return;
    }

    if (input.trim() === "" && attachments.length === 0) return;

    // Store input and attachments for chat page
    sessionStorage.setItem("homepageInput", input);
    sessionStorage.setItem("homepageAttachments", JSON.stringify(attachments));

    if (session) {
      router.push("/chat");
    } else {
      router.push("/login?redirect=/chat");
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    textareaRef.current?.focus();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto px-4 z-20">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-scroll items-end mb-2 p-1">
          {attachments.map((attachment) => (
            <PreviewAttachment key={attachment.url} attachment={attachment} />
          ))}

          {uploadQueue.map((filename) => (
            <PreviewAttachment
              key={filename}
              attachment={{
                url: "",
                name: filename,
                contentType: "",
              }}
              isUploading={true}
            />
          ))}
        </div>
      )}

      <div 
        className={`relative transition-all duration-300 ease-in-out ${
          isFocused 
            ? "shadow-[0_0_20px_rgba(252,123,17,0.15)] ring-1 ring-[#FC7B11]/30" 
            : "shadow-lg"
        } rounded-2xl bg-[#0a0a0a] border border-[#2a2a2a]`}
      >
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={input}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => {
            setInput(e.target.value);
            adjustHeight();
          }}
          className="min-h-[60px] max-h-[200px] w-full resize-none rounded-2xl pb-12 pr-14 pl-5 pt-4 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-100 placeholder-gray-500/80 text-[16px] leading-relaxed"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="absolute bottom-2.5 left-3">
          <Button
            className="rounded-full size-8 p-0 text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-colors"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            <PaperclipIcon size={18} />
          </Button>
        </div>

        <div className="absolute bottom-2.5 right-3">
          <Button
            className={`rounded-full size-8 p-0 transition-all duration-200 ${
              input.trim() || attachments.length > 0 
                ? "bg-[#FC7B11] hover:bg-[#FC7B11]/90 text-white shadow-md transform hover:scale-105" 
                : "bg-[#2a2a2a] text-gray-500 cursor-not-allowed"
            }`}
            onClick={handleSubmit}
            disabled={input.trim() === "" && attachments.length === 0}
          >
            <ArrowUpIcon size={18} />
          </Button>
        </div>
      </div>

      {/* Quick question buttons - Sleeker look */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
        {[
          { icon: FileText, text: "SAFE agreement", query: "What are the key clauses in a startup SAFE agreement?" },
          { icon: Users, text: "Hire remote work", query: "How to protect IP when hiring remote developers?" },
          { icon: FileSignature, text: "NDA for SaaS", query: "Draft a standard NDA for a SaaS startup." },
          { icon: GitCompare, text: "C-corp vs LLC", query: "What's the difference between a C-corp and LLC?" }
        ].map((item, i) => (
          <Button
            key={item.text}
            variant="ghost"
            className="h-auto py-2.5 px-1 rounded-xl flex flex-col sm:flex-row gap-2 items-center justify-center text-xs sm:text-sm font-medium text-gray-400 hover:text-gray-100 bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.05] hover:border-white/[0.1] transition-all duration-200"
            onClick={() => handleQuickQuestion(item.query)}
          >
            <item.icon className="size-4 opacity-70" />
            <span>{item.text}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}
