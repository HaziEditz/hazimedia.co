import { useState } from "react";
import { 
  useListOrders, 
  getListOrdersQueryKey, 
  useCreateOrderPayment, 
  useCaptureOrderPayment,
  Order
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { Loader2, ExternalLink, MessageSquare, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useAuth } from "@/lib/auth";

import { DashboardLayout } from "./layout";
import { ChatPanel } from "@/components/ChatPanel";

const PACKAGE_PRICES: Record<string, number> = {
  starter: 9,
  growth: 19,
  premium: 39,
};

export default function Orders() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [chatOrder, setChatOrder] = useState<Order | null>(null);
  const [payOrder, setPayOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useListOrders({
    query: {
      queryKey: getListOrdersQueryKey(),
    }
  });

  const createPayment = useCreateOrderPayment({
    mutation: {
      onError: () => {
        toast({
          title: "Payment Error",
          description: "Could not initialize payment. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const capturePayment = useCaptureOrderPayment({
    mutation: {
      onSuccess: () => {
        toast({
          title: "Payment Successful",
          description: "Your order is now being processed.",
        });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        setPayOrder(null);
      },
      onError: () => {
        toast({
          title: "Payment Error",
          description: "Could not capture payment. Please try again.",
          variant: "destructive",
        });
      }
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="default" className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">Active</Badge>;
      case "completed":
        return <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">Completed</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20">Pending</Badge>;
      case "cancelled":
        return <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPackageBadge = (pkg: string) => {
    switch (pkg) {
      case "premium":
        return <Badge variant="outline" className="border-primary/50 text-primary">Premium</Badge>;
      case "growth":
        return <Badge variant="outline" className="border-purple-500/50 text-purple-500">Growth</Badge>;
      case "starter":
        return <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground">Starter</Badge>;
      default:
        return <Badge variant="outline">{pkg}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-2">Manage and track your promotion requests.</p>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-border/40 overflow-hidden">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : !orders || orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <ExternalLink className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">No orders yet</h3>
                <p className="text-muted-foreground max-w-sm mt-2">
                  You haven't submitted any promotion requests. Head over to the New Promotion page to get started.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-border/40">
                    <TableHead>Date</TableHead>
                    <TableHead>Target Link</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Chat</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="border-border/40 hover:bg-muted/30">
                      <TableCell className="font-medium">
                        {format(new Date(order.createdAt), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <a 
                          href={order.instagramLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-primary hover:underline"
                        >
                          <span className="truncate max-w-[200px]">{order.instagramLink}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>{getPackageBadge(order.packageType)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setChatOrder(order)}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Chat
                          </Button>
                          {order.status === "active" && (
                            <Button 
                              variant="default" 
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => setPayOrder(order)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Dialog */}
      <Dialog open={!!chatOrder} onOpenChange={(open) => !open && setChatOrder(null)}>
        <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col">
          <DialogHeader>
            <DialogTitle>Order Chat</DialogTitle>
            <DialogDescription>
              Communicate directly with the Hazi Media team about this order.
            </DialogDescription>
          </DialogHeader>
          {chatOrder && user && (
            <div className="flex-1 min-h-0 mt-4">
              <ChatPanel 
                orderId={chatOrder.id} 
                currentUserId={user.id} 
                currentUserIsAdmin={user.isAdmin} 
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={!!payOrder} onOpenChange={(open) => !open && setPayOrder(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Complete Payment</DialogTitle>
            <DialogDescription>
              Pay for your {payOrder?.packageType} package to start the promotion.
            </DialogDescription>
          </DialogHeader>
          
          {payOrder && (
            <div className="space-y-6 mt-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border/40">
                <div className="flex flex-col">
                  <span className="font-medium capitalize">{payOrder.packageType} Package</span>
                  <span className="text-xs text-muted-foreground break-all max-w-[200px] truncate">{payOrder.instagramLink}</span>
                </div>
                <span className="text-2xl font-bold">${PACKAGE_PRICES[payOrder.packageType]}</span>
              </div>

              <div className="min-h-[150px]">
                <PayPalScriptProvider 
                  options={{ 
                    clientId: (import.meta.env.VITE_PAYPAL_CLIENT_ID || "test").trim(),
                    currency: "USD",
                    components: "buttons"
                  }}
                >
                  <PayPalButtons
                    style={{ layout: "vertical", shape: "rect" }}
                    createOrder={async () => {
                      const res = await createPayment.mutateAsync({ id: payOrder.id });
                      return res.paypalOrderId;
                    }}
                    onApprove={async (data) => {
                      await capturePayment.mutateAsync({ 
                        id: payOrder.id, 
                        data: { paypalOrderId: data.orderID } 
                      });
                    }}
                    onError={(err) => {
                      console.error("PayPal Checkout Error", err);
                      toast({
                        title: "Payment Failed",
                        description: "There was an error with PayPal.",
                        variant: "destructive",
                      });
                    }}
                  />
                </PayPalScriptProvider>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
