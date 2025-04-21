
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScanFormProps {
  url: string;
  setUrl: (url: string) => void;
  useProxy: boolean;
  setUseProxy: (useProxy: boolean) => void;
  selectedProxy: string;
  setSelectedProxy: (proxy: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export const ScanForm = ({
  url,
  setUrl,
  useProxy,
  setUseProxy,
  selectedProxy,
  setSelectedProxy,
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
      
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="use-proxy"
            checked={useProxy}
            onCheckedChange={setUseProxy}
          />
          <label htmlFor="use-proxy" className="text-sm text-gray-600">
            Use CORS proxy
          </label>
        </div>
        
        {useProxy && (
          <div className="flex items-center space-x-2">
            <select 
              value={selectedProxy} 
              onChange={(e) => setSelectedProxy(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="corsproxy.io">corsproxy.io</option>
              <option value="cors-anywhere">cors-anywhere</option>
              <option value="allorigins">allorigins</option>
            </select>
            <span className="text-sm text-gray-600">Choose proxy provider</span>
          </div>
        )}
      </div>

      <Alert className="mt-4 bg-amber-50 border-amber-200">
        <AlertDescription>
          If you encounter connection issues, try enabling a different proxy provider. Some websites might block specific proxies or have strict security measures.
        </AlertDescription>
      </Alert>
    </form>
  );
};
