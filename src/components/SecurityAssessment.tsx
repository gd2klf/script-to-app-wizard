
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HeadersTable } from "./security/HeadersTable";

type SecurityResult = {
  headers: Record<string, string>;
  methods: Record<string, boolean>;
};

const SecurityAssessment = ({ results }: { results: SecurityResult }) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Security Headers Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <HeadersTable headers={results.headers} />
        </CardContent>
      </Card>
    </div>
  );
};

export { SecurityAssessment };
