import { useListClients, getListClientsQueryKey } from "@workspace/api-client-react";
import { DashboardLayout } from "../dashboard/layout";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AdminClients() {
  const { data: clients, isLoading } = useListClients({
    query: {
      queryKey: getListClientsQueryKey(),
    }
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-2">Manage all registered clients.</p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : clients && clients.length > 0 ? (
          <div className="rounded-md border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border/40 hover:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead className="text-right">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className="border-border/40 hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-muted-foreground">{client.email}</TableCell>
                    <TableCell>{client.totalOrders}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {format(new Date(client.createdAt), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center border rounded-lg border-border/40 bg-card/30 backdrop-blur-sm border-dashed">
            <h3 className="text-lg font-medium">No clients found</h3>
            <p className="text-sm text-muted-foreground mt-1">Clients will appear here once they register.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}