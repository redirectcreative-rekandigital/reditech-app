import { cn } from "cn";

type ContainerProps = React.ComponentProps<"div"> & {
  size?: "shell" | "prose" | "wide";
};

const sizes = {
  shell: "max-w-shell",
  prose: "max-w-prose",
  wide: "max-w-[90rem]",
} as const;

export function Container({ className, size = "shell", ...props }: ContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full px-4 sm:px-6 lg:px-8", sizes[size], className)}
      {...props}
    />
  );
}
