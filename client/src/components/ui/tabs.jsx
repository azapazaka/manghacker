/* eslint-disable react-refresh/only-export-components */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../../lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = ({ className, ...props }) => (
  <TabsPrimitive.List className={cn("inline-flex h-12 items-center rounded-full bg-white/70 p-1 shadow-soft", className)} {...props} />
);

export const TabsTrigger = ({ className, ...props }) => (
  <TabsPrimitive.Trigger
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
      className
    )}
    {...props}
  />
);

export const TabsContent = ({ className, ...props }) => <TabsPrimitive.Content className={cn("mt-6 outline-none", className)} {...props} />;
