import { useState, useRef, useEffect, useCallback } from "react";
import {
  useListMessages,
  getListMessagesQueryKey,
  useSendMessage,
  useRequestPayment,
  useCreateOrderPayment,
  useCaptureOrderPayment,
  Message,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Send, CreditCard, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useToast } from "@/hooks/use-toast";

const PACKAGE_PRICES: Record<string, number> = {
  starter: 9,
  growth: 19,
  premium: 39,
};

function playNotificationSound() {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);

    const oscillator2 = ctx.createOscillator();
    const gainNode2 = ctx.createGain();
    oscillator2.connect(gainNode2);
    gainNode2.connect(ctx.destination);
    oscillator2.frequency.value = 1100;
    oscillator2.type = "sine";
    gainNode2.gain.setValueAtTime(0, ctx.currentTime + 0.1);
    gainNode2.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.12);
    gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    oscillator2.start(ctx.currentTime + 0.1);
    oscillator2.stop(ctx.currentTime + 0.5);
  } catch {
  }
}

function playPaymentSound() {
  try {
    const ctx = new AudioContext();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const start = ctx.currentTime + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  } catch {
  }
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function showBrowserNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
    });
  }
}

interface ChatPanelProps {
  orderId: string;
  currentUserId: string;
  currentUserIsAdmin: boolean;
  orderStatus?: string;
  packageType?: string;
  onPaymentSuccess?: () => void;
}

export function ChatPanel({
  orderId,
  currentUserId,
  currentUserIsAdmin,
  orderStatus,
  packageType,
  onPaymentSuccess,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState("");
  const [payingMessageId, setPayingMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef<number>(0);
  const prevMessageIdsRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const { data: messages = [] } = useListMessages(orderId, {
    query: {
      refetchInterval: 2500,
    },
  });

  useEffect(() => {
    const prevIds = prevMessageIdsRef.current;
    const newMessages = messages.filter((m: Message) => !prevIds.has(m.id));

    if (newMessages.length > 0 && prevIds.size > 0) {
      const incoming = newMessages.filter((m: Message) => m.userId !== currentUserId);
      if (incoming.length > 0) {
        playNotificationSound();
        const latest = incoming[incoming.length - 1];
        showBrowserNotification(
          latest.isAdmin ? "Hazi Media" : latest.senderName ?? "Client",
          latest.messageType === "payment_request"
            ? "💳 Payment requested"
            : latest.content.slice(0, 100)
        );
      }
    }

    prevMessageIdsRef.current = new Set(messages.map((m: Message) => m.id));
    prevMessageCountRef.current = messages.length;
  }, [messages, currentUserId]);

  const sendMessage = useSendMessage({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(orderId) });
      },
    },
  });

  const requestPayment = useRequestPayment({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(orderId) });
        toast({ title: "Payment requested", description: "The client has been notified to pay." });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to request payment.", variant: "destructive" });
      },
    },
  });

  const createPayment = useCreateOrderPayment({
    mutation: {
      onError: () => {
        toast({ title: "Payment Error", description: "Could not initialize payment. Try again.", variant: "destructive" });
      },
    },
  });

  const capturePayment = useCaptureOrderPayment({
    mutation: {
      onSuccess: () => {
        playPaymentSound();
        toast({ title: "Payment Successful! 🎉", description: "Your promotion is now being processed." });
        queryClient.invalidateQueries({ queryKey: getListMessagesQueryKey(orderId) });
        setPayingMessageId(null);
        onPaymentSuccess?.();
      },
      onError: () => {
        toast({ title: "Payment Error", description: "Could not capture payment. Try again.", variant: "destructive" });
      },
    },
  });

  const handleSend = useCallback(() => {
    if (!inputValue.trim()) return;
    sendMessage.mutate({ id: orderId, data: { content: inputValue.trim() } });
    setInputValue("");
  }, [inputValue, orderId, sendMessage]);

  const handleRequestPayment = useCallback(() => {
    requestPayment.mutate({ id: orderId });
  }, [orderId, requestPayment]);

  useEffect(() => {
    const scrollContainer = scrollRef.current?.querySelector("[data-radix-scroll-area-viewport]");
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [messages.length]);

  const canRequestPayment =
    currentUserIsAdmin &&
    orderStatus !== "completed" &&
    orderStatus !== "cancelled";

  const canPay = !currentUserIsAdmin && orderStatus === "active";

  return (
    <div className="flex flex-col h-full border border-border/40 rounded-md bg-background/50 overflow-hidden">
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg: Message) => {
            const isMe = msg.userId === currentUserId;
            const isPaymentRequest = msg.messageType === "payment_request";

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {msg.senderName}
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

                {isPaymentRequest ? (
                  <div className="w-full max-w-[320px] rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      <span className="text-sm font-semibold text-primary">Payment Request</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{msg.content}</p>

                    {canPay && payingMessageId === msg.id && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm font-medium">
                          <span className="capitalize">{packageType} package</span>
                          <span className="text-primary font-bold">${PACKAGE_PRICES[packageType ?? ""] ?? "?"}</span>
                        </div>
                        <PayPalScriptProvider
                          options={{
                            clientId: (import.meta.env.VITE_PAYPAL_CLIENT_ID || "test").trim(),
                            currency: "USD",
                            components: "buttons",
                          }}
                        >
                          <PayPalButtons
                            style={{ layout: "vertical", shape: "rect", height: 40 }}
                            createOrder={async () => {
                              const res = await createPayment.mutateAsync({ id: orderId });
                              return res.paypalOrderId;
                            }}
                            onApprove={async (data) => {
                              await capturePayment.mutateAsync({
                                id: orderId,
                                data: { paypalOrderId: data.orderID },
                              });
                            }}
                            onError={(err) => {
                              console.error("PayPal Error", err);
                              toast({ title: "Payment Failed", description: "PayPal error.", variant: "destructive" });
                            }}
                          />
                        </PayPalScriptProvider>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-xs text-muted-foreground"
                          onClick={() => setPayingMessageId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}

                    {canPay && payingMessageId !== msg.id && (
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                        onClick={() => setPayingMessageId(msg.id)}
                        disabled={capturePayment.isPending || createPayment.isPending}
                      >
                        <CreditCard className="h-4 w-4" />
                        Pay Now
                      </Button>
                    )}

                    {currentUserIsAdmin && (
                      <div className="text-xs text-muted-foreground italic">
                        Waiting for client payment...
                      </div>
                    )}

                    {!currentUserIsAdmin && orderStatus === "completed" && (
                      <div className="flex items-center gap-2 text-green-500 text-sm font-medium">
                        <span>✅ Paid</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`px-3 py-2 rounded-lg max-w-[85%] text-sm ${
                      isMe
                        ? "bg-primary text-primary-foreground rounded-tr-none"
                        : "bg-muted rounded-tl-none"
                    }`}
                  >
                    {msg.content}
                  </div>
                )}
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

      <div className="p-3 border-t border-border/40 bg-card space-y-2">
        {canRequestPayment && (
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
            onClick={handleRequestPayment}
            disabled={requestPayment.isPending}
          >
            {requestPayment.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CreditCard className="h-4 w-4" />
            )}
            Request Payment
          </Button>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
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
