
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";

interface ScanFormProps {
  url: string;
  setUrl: (url: string) => void;
  onSubmit: (e: React.FormEvent | React.MouseEvent, requireAuth: boolean) => void;
  loading: boolean;
}

export const ScanForm = ({
  url,
  setUrl,
  onSubmit,
  loading
}: ScanFormProps) => {
  const { user } = useAuth();
  
  return (
    <form className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <Input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button 
            type="button" 
            onClick={(e) => onSubmit(e, false)}
            disabled={loading}
          >
            {loading ? 'Scanning...' : 'Scan'}
          </Button>
          
          <Button 
            type="button" 
            variant="secondary"
            onClick={(e) => onSubmit(e, true)}
            disabled={loading || !user}
            title={!user ? "Login required" : "Scan with authentication"}
          >
            <Lock className="mr-1" size={16} />
            {loading ? 'Scanning...' : 'Auth Scan'}
          </Button>
        </div>
      </div>
      
      <Alert className="mt-4 bg-amber-50 border-amber-200">
        <AlertDescription>
          <p>Security scanner functionality:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Tests for security headers like Content-Security-Policy, X-XSS-Protection, etc.</li>
            <li>All requests are made securely through a backend Edge Function</li>
            <li>Use "Auth Scan" to include your authentication token in the request (requires login)</li>
          </ul>
        </AlertDescription>
      </Alert>
    </form>
  );
};
