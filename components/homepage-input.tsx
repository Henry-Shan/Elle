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
  const phrases = [
    "hiring remote workers . . .",
    "drafting SaaS NDA . . .",
    "raise pre-seed funding . . .",
  ];

  // Handle typing animation
  useEffect(() => {
    const baseText = "Ask Elle AI about ";
    const currentPhrase = phrases[phraseIndex];
    const typingSpeed = isDeleting ? 25 : 25;
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
    <div className="relative w-[85%] max-w-2xl mx-auto mb-60 px-4">
      <input
        type="file"
        className="fixed -top-4 -left-4 size-0.5 opacity-0 pointer-events-none"
        ref={fileInputRef}
        multiple
        onChange={handleFileChange}
        tabIndex={-1}
      />

      {(attachments.length > 0 || uploadQueue.length > 0) && (
        <div className="flex flex-row gap-2 overflow-x-scroll items-end mb-2">
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

      <div className="relative">
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            adjustHeight();
          }}
          className="min-h-[14px] max-h-[75dvh] resize-none rounded-2xl pb-10 pr-16 pl-6 pt-3"
          rows={3}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="absolute bottom-2 left-2">
          <Button
            className="rounded-full p-1.5 h-fit"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
          >
            <PaperclipIcon size={14} />
          </Button>
        </div>

        <div className="absolute bottom-2 right-2">
          <Button
            className="rounded-full p-1.5 h-fit"
            onClick={handleSubmit}
            disabled={input.trim() === "" && attachments.length === 0}
          >
            <ArrowUpIcon size={14} />
          </Button>
        </div>
      </div>

      {/* Quick question buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4">
        <Button
          variant="outline"
          className="rounded-full gap-2 px-4 py-2 text-sm"
          onClick={() =>
            handleQuickQuestion(
              "What are the key clauses in a startup SAFE agreement?"
            )
          }
        >
          <FileText size={16} />
          SAFE agreement
        </Button>
        <Button
          variant="outline"
          className="rounded-full gap-2 px-4 py-2 text-sm"
          onClick={() =>
            handleQuickQuestion(
              "How to protect IP when hiring remote developers?"
            )
          }
        >
          <Users size={16} />
          Hire remote work
        </Button>
        <Button
          variant="outline"
          className="rounded-full gap-2 px-4 py-2 text-sm"
          onClick={() =>
            handleQuickQuestion("Draft a standard NDA for a SaaS startup.")
          }
        >
          <FileSignature size={16} />
          NDA for SaaS
        </Button>
        <Button
          variant="outline"
          className="rounded-full gap-2 px-4 py-2 text-sm"
          onClick={() =>
            handleQuickQuestion(
              "What's the difference between a C-corp and LLC?"
            )
          }
        >
          <GitCompare size={16} />
          C-corp vs LLC
        </Button>
      </div>
    </div>
  );
}
