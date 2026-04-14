import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateOrder, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Rocket, Zap, Crown, CheckCircle2, Loader2 } from "lucide-react";

import { useToast } from "@/hooks/use-toast";
import { DashboardLayout } from "./layout";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  instagramLink: z.string().url("Please enter a valid URL"),
  message: z
    .string()
    .min(10, "Please write at least 10 characters")
    .max(500),
  packageType: z.enum(["starter", "growth", "premium"]),
});

const packages = [
  {
    id: "starter",
    title: "Starter",
    description: "Basic promotion campaign",
    price: 9,
    icon: Rocket,
    color: "text-muted-foreground",
  },
  {
    id: "growth",
    title: "Growth",
    description: "Expanded reach with targeting",
    price: 19,
    icon: Zap,
    color: "text-purple-500",
  },
  {
    id: "premium",
    title: "Premium",
    description: "Full-scale domination campaign",
    price: 39,
    icon: Crown,
    color: "text-primary",
  },
] as const;

export default function OrderPromotion() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createOrder = useCreateOrder();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instagramLink: "",
      message: "",
      packageType: "starter",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createOrder.mutateAsync({ data: values });
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey() });
      setTimeout(() => {
        setLocation("/dashboard/orders");
      }, 3000);
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Could not submit your request. Please try again.",
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
            <h1 className="text-3xl font-bold tracking-tight">Request Submitted</h1>
            <p className="text-muted-foreground text-lg">
              Your promotion request has been sent. We will review it and reach
              out to you soon.
            </p>
          </div>
          <p className="text-sm text-muted-foreground animate-pulse">
            Redirecting to your orders...
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Request a Promotion</h1>
          <p className="text-muted-foreground mt-2">
            Tell us what you want promoted. We will review your request and get
            back to you.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="bg-card/50 backdrop-blur-sm border-border/40">
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
                <CardDescription>
                  Provide the link and specific instructions for the team.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="instagramLink"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promotion Link</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://..."
                          className="bg-background/50"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The link to whatever you want us to promote — any platform.
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
                          placeholder="What is the goal? Who is your target audience? Any specific instructions?"
                          className="min-h-[120px] bg-background/50 resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The more detail you give us, the better we can help.
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
                <CardDescription>
                  Choose the tier that fits your growth goals.
                </CardDescription>
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
                                <RadioGroupItem
                                  value={pkg.id}
                                  className="peer sr-only"
                                />
                              </FormControl>
                              <FormLabel className="flex flex-col items-center justify-between rounded-lg border-2 border-border/40 bg-background/50 p-4 hover:bg-muted/50 hover:text-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all">
                                <pkg.icon
                                  className={`mb-3 h-6 w-6 ${pkg.color}`}
                                />
                                <span className="font-semibold text-sm">
                                  {pkg.title}
                                </span>
                                <span className="font-bold text-lg mt-1">
                                  ${pkg.price}
                                </span>
                                <span className="text-xs text-muted-foreground mt-2 text-center h-8 flex items-center">
                                  {pkg.description}
                                </span>
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

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={createOrder.isPending}
            >
              {createOrder.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Request"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </DashboardLayout>
  );
}
