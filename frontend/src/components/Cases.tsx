import { Input } from "./ui/input"
import { Button } from "./ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"
import { Card, CardContent, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"

export const Cases = () => (
  <div className="max-w-6xl mx-auto space-y-8">
    <div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Cases</h1>
      <p className="text-xl text-gray-600">Browse and search through all registered cases</p>
    </div>

    <div className="flex flex-col sm:flex-row gap-4">
      <Input
        type="text"
        placeholder="Search cases..."
        className="flex-1"
      />
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="closed">Closed</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div className="grid gap-6">
      {[1, 2, 3].map((caseNum) => (
        <Card key={caseNum}>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <CardTitle>Case #{caseNum}</CardTitle>
                  <Badge variant="default">Active</Badge>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                </p>
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" />
                    Filed: March {caseNum}, 2024
                  </div>
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Last Updated: 2 days ago
                  </div>
                </div>
              </div>
              <Button variant="outline">View Details</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
)

function CalendarIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
      />
    </svg>
  )
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  )
} 