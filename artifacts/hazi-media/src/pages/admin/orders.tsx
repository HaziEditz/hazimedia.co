import { useListAllOrders, getListAllOrdersQueryKey, useUpdateOrderStatus, AdminOrderStatus, UpdateOrderStatusBodyStatus } from "@workspace/api-client-react";
import { DashboardLayout } from "../dashboard/layout";
import { format } from "date-fns";
import { Loader2, ExternalLink } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
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

const statusColors: Record<AdminOrderStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 hover:bg-yellow-500/20",
  active: "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20",
  completed: "bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20",
  cancelled: "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20",
};

export default function AdminOrders() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders, isLoading } = useListAllOrders({
    query: {
      queryKey: getListAllOrdersQueryKey(),
    }
  });

  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListAllOrdersQueryKey() });
        toast({
          title: "Status updated",
          description: "The order status has been updated successfully.",
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Failed to update order status.",
          variant: "destructive",
        });
      }
    }
  });

  const handleStatusChange = (id: string, newStatus: string) => {
    updateStatus.mutate({
      id,
      data: { status: newStatus as UpdateOrderStatusBodyStatus }
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">All Orders</h1>
          <p className="text-muted-foreground mt-2">Manage and update client orders.</p>
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
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-border/40 hover:bg-muted/50 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{order.clientName}</span>
                        <span className="text-xs text-muted-foreground">{order.clientEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{order.packageType}</TableCell>
                    <TableCell>
                      <a 
                        href={order.instagramLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Link <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(order.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={`capitalize ${statusColors[order.status]}`}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Select 
                        value={order.status} 
                        onValueChange={(val) => handleStatusChange(order.id, val)}
                        disabled={updateStatus.isPending}
                      >
                        <SelectTrigger className="w-[130px] h-8 ml-auto">
                          <SelectValue placeholder="Update status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg border-border/40 bg-card/30 backdrop-blur-sm border-dashed">
            <h3 className="text-lg font-medium">No orders found</h3>
            <p className="text-sm text-muted-foreground mt-1">Platform orders will appear here.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}