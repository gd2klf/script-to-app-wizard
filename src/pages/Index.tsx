
import { HeaderScanner } from "@/components/HeaderScanner";

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 text-slate-800">HTTP Security Scanner</h1>
          <p className="text-lg text-slate-600">
            Test security headers and HTTP methods for any website
          </p>
        </div>
        <HeaderScanner />
      </div>
    </div>
  );
};

export default Index;
