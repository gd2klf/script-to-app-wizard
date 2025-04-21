
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScanFormProps {
  url: string;
  setUrl: (url: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export const ScanForm = ({
  url,
  setUrl,
  onSubmit,
  loading
}: ScanFormProps) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex flex-col md:flex-row gap-2">
        <Input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Scanning...' : 'Scan Website'}
        </Button>
      </div>
      
      <Alert className="mt-4 bg-amber-50 border-amber-200">
        <AlertDescription>
          Scans are now performed through a secure backend service. The scanner tests security headers and HTTP methods on the specified website.
        </AlertDescription>
      </Alert>
    </form>
  );
};
