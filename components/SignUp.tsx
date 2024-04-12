import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function SignUp() {
  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sign Up</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Enter your information to create an account
        </p>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" placeholder="Enter your username" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" placeholder="Enter your email" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" required type="password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <Input id="confirm-password" required type="password" />
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id="terms" />
          <Label className="text-sm leading-none" htmlFor="terms">
            I agree to the
            <Link className="underline" href="#">
              terms and conditions
            </Link>
          </Label>
        </div>
        <Button className="w-full">Sign Up</Button>
        <div className="mt-4 text-center text-sm">
          Already have an account?
          <Link className="underline" href="#">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
