import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LineChart } from 'lucide-react';
import {
  UserDistributionChart,
  UserGrowthChart,
} from '@/components/admin/charts';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-6 w-6" />
            Platform Analytics
          </CardTitle>
          <CardDescription>
            An overview of user activity and growth trends.
          </CardDescription>
        </CardHeader>
      </Card>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>User Growth</CardTitle>
            <CardDescription>Monthly user registration trends.</CardDescription>
          </CardHeader>
          <CardContent>
            <UserGrowthChart />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>User Demographics</CardTitle>
            <CardDescription>
              Distribution of users by village/block.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserDistributionChart />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
