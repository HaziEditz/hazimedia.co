import { useState } from "react";
import { useLocation } from "wouter";
import { useCreatePaypalOrder, useCapturePaypalOrder, getListOrdersQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Rocket, Zap, Crown, CheckCircle2 } from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "./layout";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  instagramLink: z.string().url("Please enter a valid URL"),
  message: z.string().min(10, "Message must be at least 10 characters").max(500),
  packageType: z.enum(["starter", "growth", "premium"]),
});

const packages = [
  {
    id: "starter",
    title: "Starter",
    description: "Basic promotion campaign",
    price: 49,
    icon: Rocket,
    color: "text-muted-foreground"
  },
  {
    id: "growth",
    title: "Growth",
    description: "Expanded reach with targeting",
    price: 149,
    icon: Zap,
    color: "text-purple-500"
  },
  {
    id: "premium",
    title: "Premium",
    description: "Full-scale domination campaign",
    price: 299,
    icon: Crown,
    color: "text-primary"
  }
] as const;

export default function OrderPromotion() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createPaypalOrder = useCreatePaypalOrder();
  const capturePaypalOrder = useCapturePaypalOrder();

  const [isSuccess, setIsSuccess] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: "onChange",
    defaultValues: {
      instagramLink: "",
      message: "",
      packageType: "starter",
    },
  });

  const selectedPackage = form.watch("packageType");
  const isFormValid = form.formState.isValid;

  const handleCreateOrder = async () => {
    const values = form.getValues();
    try {
      const response = await createPaypalOrder.mutateAsync({
        data: values
      });
      return response.paypalOrderId;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Could not create order",
        description: error.message || "An error occurred while setting up the payment.",
      });
      throw error;
    }
  };

  const handleApprove = async (data: any) => {
    const values = form.getValues();
    try {
      const order = await capturePaypalOrder.mutateAsync({
        data: {
          paypalOrderId: data.orderID,
          instagramLink: values.instagramLink,
          message: values.message,
          packageType: values.packageType,
        }
      });
      
      setIsSuccess(true);
      setSuccessOrderId(order.id);
      
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      
      setTimeout(() => {
        setLocation("/dashboard/orders");
      }, 3000);
      
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error.message || "An error occurred while capturing the payment.",
      });
    }
  };

  if (isSuccess) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto flex flex-col items-center justify-center py-20 text-center space-y-6">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Payment Successful</h1>
            <p className="text-muted-foreground text-lg">
              Your promotion campaign has been launched.
            </p>
            {successOrderId && (
              <p className="text-sm font-mono bg-muted/50 p-2 rounded inline-block mt-4">
                Order ID: {successOrderId}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Redirecting to your orders...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  const selectedPkgData = packages.find(p => p.id === selectedPackage);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Promotion</h1>
          <p className="text-muted-foreground mt-2">Submit a new link for targeted digital marketing.</p>
        </div>

        <Form {...form}>
          <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
            <Card className="bg-card/50 backdrop-blur-sm border-border/40">
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>Provide the link and specific instructions for the team.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="instagramLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://instagram.com/p/..." className="bg-background/50" {...field} />
                      </FormControl>
                      <FormDescription>
                        The exact post or profile you want us to promote.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campaign Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What is the goal of this promotion? Who is your target audience?" 
                          className="min-h-[120px] bg-background/50 resize-none"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Details help our team craft the perfect approach.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/40">
              <CardHeader>
                <CardTitle>Select Package</CardTitle>
                <CardDescription>Choose the tier that fits your growth goals.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="packageType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="grid gap-4 sm:grid-cols-3"
                        >
                          {packages.map((pkg) => (
                            <FormItem key={pkg.id}>
                              <FormControl>
                                <RadioGroupItem value={pkg.id} className="peer sr-only" />
                              </FormControl>
                              <FormLabel className="flex flex-col items-center justify-between rounded-lg border-2 border-border/40 bg-background/50 p-4 hover:bg-muted/50 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                                <pkg.icon className={`mb-3 h-6 w-6 ${pkg.color}`} />
                                <span className="font-semibold text-sm">{pkg.title}</span>
                                <span className="font-bold text-lg mt-1">${pkg.price}</span>
                                <span className="text-xs text-muted-foreground mt-2 text-center h-8 flex items-center">{pkg.description}</span>
                              </FormLabel>
                            </FormItem>
                          ))}
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border/40 border-primary/20">
              <CardHeader>
                <CardTitle>Checkout</CardTitle>
                <CardDescription>Complete your payment to launch the campaign.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-between items-center py-4 border-y border-border/40">
                  <div>
                    <p className="font-medium text-lg">{selectedPkgData?.title} Package</p>
                    <p className="text-muted-foreground text-sm">One-time payment</p>
                  </div>
                  <p className="text-2xl font-bold">${selectedPkgData?.price}</p>
                </div>
                
                {!isFormValid ? (
                  <div className="p-4 bg-muted/50 rounded-md text-sm text-center text-muted-foreground">
                    Please fill out all campaign details above to proceed with payment.
                  </div>
                ) : (
                  <div className="relative min-h-[150px] z-0">
                    <PayPalScriptProvider options={{ 
                      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
                      components: "buttons",
                      currency: "USD"
                    }}>
                      <PayPalButtons 
                        style={{ layout: "vertical", color: "blue", shape: "rect", label: "pay" }}
                        createOrder={handleCreateOrder}
                        onApprove={handleApprove}
                        onError={(err) => {
                          console.error("PayPal Error:", err);
                          toast({
                            variant: "destructive",
                            title: "Payment Error",
                            description: "There was an issue loading or processing PayPal. Please try again."
                          });
                        }}
                      />
                    </PayPalScriptProvider>
                  </div>
                )}
              </CardContent>
            </Card>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
