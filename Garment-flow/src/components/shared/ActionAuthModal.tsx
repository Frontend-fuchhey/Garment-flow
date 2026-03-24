import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

interface ActionAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export function ActionAuthModal({
  open,
  onOpenChange,
  onSuccess,
  title = "Admin Verification",
  description = "Enter admin credentials to proceed with this action.",
}: ActionAuthModalProps) {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleVerify = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (adminId === "admin" && password === "admin123") {
      setAdminId("");
      setPassword("");
      setError("");
      onOpenChange(false);
      onSuccess();
    } else {
      setError("Invalid Admin ID or Password");
    }
  };

  const handleClose = (value: boolean) => {
    if (!value) {
      setAdminId("");
      setPassword("");
      setError("");
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleVerify} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="auth-admin-id">Admin ID</Label>
            <Input
              id="auth-admin-id"
              value={adminId}
              onChange={(e) => { setAdminId(e.target.value); setError(""); }}
              placeholder="Admin ID"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="auth-password">Password</Label>
            <Input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="Password"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleClose(false)} skipShiftLock>
              Cancel
            </Button>
            <Button type="submit" skipShiftLock>Confirm</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
