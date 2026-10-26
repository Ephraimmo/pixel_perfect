import { type ReactNode } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/kit";
import { AppleIcon, GoogleIcon } from "@/components/brand-icons";
import { Button } from "@/components/ui/button";

/** Split auth screen: form on the left, full-bleed photo with serif copy on the right. */
export function AuthLayout({
  image,
  overlay,
  children,
}: {
  image: string;
  overlay: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-svh bg-background lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-6 py-8 sm:px-12">
        <Logo className="text-lg" />
        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-10">
          {children}
        </div>
      </div>
      <div className="relative hidden overflow-hidden lg:block">
        <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
        <div className="absolute bottom-16 left-12 right-12 text-white">{overlay}</div>
      </div>
    </div>
  );
}

export function SocialButtons({ onDone }: { onDone: () => void }) {
  const go = (provider: string) => {
    toast.success(`Signed in with ${provider} (demo)`);
    onDone();
  };
  return (
    <div className="space-y-2.5">
      <Button
        type="button"
        variant="outline"
        className="w-full bg-card"
        onClick={() => go("Google")}
      >
        <GoogleIcon /> Continue with Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full bg-card"
        onClick={() => go("Apple")}
      >
        <AppleIcon /> Continue with Apple
      </Button>
    </div>
  );
}
