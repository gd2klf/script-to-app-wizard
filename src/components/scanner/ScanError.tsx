
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ScanErrorProps {
  errorDetails: string;
}

export const ScanError = ({ errorDetails }: ScanErrorProps) => {
  if (!errorDetails) return null;

  return (
    <Alert className="mt-4 bg-red-50 border-red-200">
      <AlertDescription className="text-red-800">
        <div className="font-semibold">Diagnostic information:</div>
        <div className="mt-1 text-sm break-all">{errorDetails}</div>
        <div className="mt-2">
          <p>Troubleshooting tips:</p>
          <ul className="list-disc pl-5 text-sm mt-1">
            <li>Check if the URL is correct and accessible in your browser</li>
            <li>Try a different proxy provider</li>
            <li>Some websites may actively block security scanning attempts</li>
            <li>Internal or private URLs may not be accessible from this application</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
};
