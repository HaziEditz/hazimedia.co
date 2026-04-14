import {
  useListAllOrders,
  getListAllOrdersQueryKey,
  useUpdateOrderStatus,
  AdminOrderStatus,
  UpdateOrderStatusBodyStatus,
} from "@workspace/api-client-react";
import { DashboardLayout } from "../dashboard/layout";
import { format } from "date-fns";
import { Loader2, ExternalLink, Mail } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import { ChatPanel } from "@/components/ChatPanel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

const statusColors: Record<AdminOrderStatus, string> = {
  pending:
    "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20",
  active:
    "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
  completed:
    "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20",
  cancelled:
    "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20",
};

type Order = {
  id: string;
  clientName: string;
  clientEmail: string;
  packageType: string;
  instagramLink: string;
  message: string;
  status: AdminOrderStatus;
  createdAt: string;
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders, isLoading } = useListAllOrders({
    query: {
      queryKey: getListAllOrdersQueryKey(),
    },
  });

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
        toast({
          title: "Status updated",
          description: "The order status has been updated.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update order status.",
          variant: "destructive",
        });
      },
    },
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus.mutate({
      id,
      data: { status: newStatus as UpdateOrderStatusBodyStatus },
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Requests</h1>
          <p className="text-muted-foreground mt-2">
            Review client promotion requests, contact them, and update statuses.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="rounded-md border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead>Client</TableHead>
                  <TableHead>Package</TableHead>
                  <TableHead>Instagram</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="border-border/40 hover:bg-muted/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.clientName}</span>
                        <span className="text-xs text-muted-foreground">
                          {order.clientEmail}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize font-medium">
                      {order.packageType}
                    </TableCell>
                    <TableCell>
                      <a
                        href={order.instagramLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`capitalize ${statusColors[order.status]}`}
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1 text-muted-foreground hover:text-foreground"
                          onClick={() => setSelectedOrder(order as Order)}
                        >
                          <Mail className="h-3.5 w-3.5" />
                          Details
                        </Button>
                        <Select
                          value={order.status}
                          onValueChange={(val) =>
                            handleStatusChange(order.id, val)
                          }
                          disabled={updateStatus.isPending}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue placeholder="Update" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg border-border/40 bg-card/30 backdrop-blur-sm border-dashed">
            <h3 className="text-lg font-medium">No requests yet</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Client promotion requests will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Order detail / contact dialog */}
      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground mb-1">Client</p>
                  <p className="font-medium">{selectedOrder.clientName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Package</p>
                  <p className="font-medium capitalize">
                    {selectedOrder.packageType}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Submitted</p>
                  <p className="font-medium">
                    {format(new Date(selectedOrder.createdAt), "MMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Status</p>
                  <Badge
                    variant="outline"
                    className={`capitalize ${statusColors[selectedOrder.status]}`}
                  >
                    {selectedOrder.status}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">
                  Instagram Link
                </p>
                <a
                  href={selectedOrder.instagramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm flex items-center gap-1 break-all"
                >
                  {selectedOrder.instagramLink}
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">
                  Campaign Notes
                </p>
                <p className="text-sm bg-muted/40 rounded-md p-3 leading-relaxed">
                  {selectedOrder.message}
                </p>
              </div>

              <a
                href={`mailto:${selectedOrder.clientEmail}?subject=Your Hazi Media Promotion Request&body=Hi ${selectedOrder.clientName},%0A%0AI reviewed your promotion request for ${selectedOrder.instagramLink}.%0A%0A`}
              >
                <Button className="w-full gap-2">
                  <Mail className="h-4 w-4" />
                  Contact {selectedOrder.clientName} via Email
                </Button>
              </a>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/40" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">
                    Chat
                  </span>
                </div>
              </div>

              {user && (
                <div className="h-[400px]">
                  <ChatPanel 
                    orderId={selectedOrder.id} 
                    currentUserId={user.id} 
                    currentUserIsAdmin={true} 
                  />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
