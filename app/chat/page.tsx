"use client";

import { useState } from "react";
import { ChatInput } from "@/components/ui/chat-input";

interface Message {
  id: string;
  content: string;
  type: "user" | "assistant";
  mergedVideo?: string;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mergedVideo, setMergedVideo] = useState("");
  const MessageContent = ({
    content,
  }: {
    content: string;
    message?: Message;
  }) => {
    // If it's a merged video, show only that without relying on validation
    if (mergedVideo) {
      console.log("Displaying video with URL:", mergedVideo);
      return (
        <div className="space-y-1">
          <video controls width="100%" className="rounded-md">
            <source src={mergedVideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // For regular text messages
    return <p className="whitespace-pre-wrap">{content}</p>;
  };

  const handleSendMessage = async (
    messageContent: string,
    image?: File | null
  ) => {
    if (!messageContent.trim() && !image) return;

    const messageId = Date.now().toString();

    const newUserMessage: Message = {
      id: messageId,
      content: messageContent,
      type: "user",
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: messageContent }),
      });

      if (!res.ok) {
        throw new Error(`API responded with status: ${res.status}`);
      }

      const data = await res.json();
      setMergedVideo(data.url);
      console.log("API response received:", data);
    } catch (error) {
      console.error("Error sending message:", error);

      // Add an error message to the chat
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "Sorry, there was an error processing your request. Please try again.",
        type: "assistant",
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center w-full h-screen">
      <div className="max-w-3xl w-full mx-auto flex flex-col h-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground text-center">
                Send a message to start chatting
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.type === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <MessageContent content={message.content} message={message} />
                </div>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg p-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t">
          <ChatInput onSend={handleSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
