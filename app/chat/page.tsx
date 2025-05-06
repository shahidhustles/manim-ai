"use client";

import { useState } from "react";
import { isCloudinaryVideoUrl } from "@/lib/isCloudinaryVideoURL";
import { ChatInput } from "@/components/ui/chat-input";

interface Message {
  id: string;
  content: string;
  type: "user" | "assistant";
  isVideo?: boolean;
}

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const MessageContent = ({ content }: { content: string }) => {
    if (isCloudinaryVideoUrl(content.trim())) {
      return (
        <video controls width="100%" className="rounded-md">
          <source src={content.trim()} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }
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
      console.log("API response received:", data);

      // // For now, just show a placeholder response
      // const responseMessage: Message = {
      //   id: (Date.now() + 1).toString(),
      //   content: "Processing your request...",
      //   type: "assistant",
      // };

      // setMessages((prev) => [...prev, responseMessage]);
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
                  <MessageContent content={message.content} />
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
