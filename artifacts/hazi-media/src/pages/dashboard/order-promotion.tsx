import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateOrder } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { getListOrdersQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Loader2, Rocket, Zap, Crown } from "lucide-react";

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

export default function OrderPromotion() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createOrder = useCreateOrder();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instagramLink: "",
      message: "",
      packageType: "starter",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createOrder.mutate({
      data: values
    }, {
      onSuccess: () => {
        toast({
          title: "Order submitted",
          description: "Your promotion request has been received.",
        });
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setLocation("/dashboard/orders");
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Submission failed",
          description: error.message || "An unexpected error occurred.",
        });
      }
    });
  };

  const packages = [
    {
      id: "starter",
      title: "Starter",
      description: "Perfect for testing the waters",
      icon: Rocket,
      color: "text-muted-foreground"
    },
    {
      id: "growth",
      title: "Growth",
      description: "Our most popular selection",
      icon: Zap,
      color: "text-purple-500"
    },
    {
      id: "premium",
      title: "Premium",
      description: "Maximum attention and conversion",
      icon: Crown,
      color: "text-primary"
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Promotion</h1>
          <p className="text-muted-foreground mt-2">Submit a new link for targeted digital marketing.</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                                <span className="text-xs text-muted-foreground mt-1 text-center">{pkg.description}</span>
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
              <CardFooter className="flex justify-end pt-6 border-t border-border/40">
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={createOrder.isPending}
                  className="w-full sm:w-auto min-w-[200px]"
                >
                  {createOrder.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Launch Campaign"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
