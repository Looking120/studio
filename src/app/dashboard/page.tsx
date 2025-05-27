
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockActivityLogs, mockEmployees, mockOffices, mockAttendanceSummary } from "@/lib/data";
import { Users, MapPin, ListChecks, Building2, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const summaryData = [
    { title: "Total Employees", value: mockEmployees.length, icon: Users, href: "/employees" },
    { title: "Active Today", value: mockAttendanceSummary.activeToday, icon: CheckCircle, href: "/activity" },
    { title: "Total Offices", value: mockOffices.length, icon: Building2, href: "/offices" },
    { title: "Avg. Work Hours", value: `${mockAttendanceSummary.avgWorkHours}h`, icon: Clock, href: "/attendance" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryData.map((item) => (
          <Link href={item.href} key={item.title} legacyBehavior>
            <a className="block hover:shadow-lg transition-shadow duration-200 rounded-lg">
              <Card className="bg-card text-card-foreground hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                  <item.icon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{item.value}</div>
                  <p className="text-xs text-muted-foreground pt-1">View Details</p>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockActivityLogs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-border last:border-b-0">
                <div>
                  <p className="font-medium text-sm">{log.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{log.activity} at {log.location}</p>
                </div>
                <p className="text-xs text-muted-foreground">{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            ))}
            <Link href="/activity" className="text-sm text-primary hover:underline mt-4 block text-center">
              View All Activity Logs
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Quick Map Overview (HQ)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-0">
            {/* Simplified map or image placeholder for dashboard. Full map on /locations and /offices */}
            <div className="w-full h-full bg-muted rounded-b-lg flex items-center justify-center">
               <img 
                src="https://placehold.co/600x300.png" 
                alt="Map placeholder" 
                data-ai-hint="map office"
                className="object-cover w-full h-full rounded-b-lg"
                />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
