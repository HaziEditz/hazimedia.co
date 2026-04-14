import { useState, useRef, useEffect } from "react";
import { useListMessages, getListMessagesQueryKey, useSendMessage, Message } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface ChatPanelProps {
  orderId: string;
  currentUserId: string;
  currentUserIsAdmin: boolean;
}

export function ChatPanel({ orderId, currentUserId, currentUserIsAdmin }: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useListMessages(orderId, {
    query: {
      refetchInterval: 3000,
    }
  });

  const sendMessage = useSendMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(orderId) });
      }
    }
  });

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage.mutate({
      id: orderId,
      data: { content: inputValue.trim() }
    });
    setInputValue("");
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages.length]);

  return (
    <div className="flex flex-col h-full border border-border/40 rounded-md bg-background/50 overflow-hidden">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg: Message) => {
            const isMe = msg.userId === currentUserId;
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {msg.userName}
                  </span>
                  {!isMe && msg.isAdmin && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      Hazi Media
                    </Badge>
                  )}
                  {isMe && currentUserIsAdmin && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                      Hazi Media
                    </Badge>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {format(new Date(msg.createdAt), "h:mm a")}
                  </span>
                </div>
                <div className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted rounded-tl-none"}`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic py-8">
              No messages yet. Say hello!
            </div>
          )}
        </div>
      </ScrollArea>
      <div className="p-3 border-t border-border/40 bg-card">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex gap-2"
        >
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
            disabled={sendMessage.isPending}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!inputValue.trim() || sendMessage.isPending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
