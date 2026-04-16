// Combined logic and UI into one file
import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { supabase, type Inquiry, type Holiday } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext"
import {
  CalendarDays,
  Inbox,
  ChevronRight,
  Clock,
  User2,
  Search,
  Plus,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

export default function Admin() {
  // Logic at the top
  const { session } = useAuth()
  const navigate = useNavigate()
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | Inquiry["status"]>(
    "all"
  )

  // Holiday form state
  const [showHolidayForm, setShowHolidayForm] = useState(false)
  const [newHolidayDate, setNewHolidayDate] = useState("")
  const [newHolidayName, setNewHolidayName] = useState("")
  const [submittingHoliday, setSubmittingHoliday] = useState(false)

  const getStatusBadgeClasses = (status: Inquiry["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
      case "pending":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
      case "cancelled":
        return "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200"
      default:
        return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
    }
  }

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      setError(null)
      try {
        const [inqResponse, holResponse] = await Promise.all([
          supabase
            .from("inquiries")
            .select("*")
            .order("date", { ascending: false }),
          supabase
            .from("holidays")
            .select("*")
            .order("date", { ascending: true }),
        ])
        if (inqResponse.error) {
          setError(`Error fetching inquiries: ${inqResponse.error.message}`)
        } else if (inqResponse.data) {
          setInquiries(inqResponse.data)
        }
        if (holResponse.error) {
          setError(`Error fetching holidays: ${holResponse.error.message}`)
        } else if (holResponse.data) {
          setHolidays(holResponse.data)
        }
      } catch (err) {
        setError(`Unexpected error: ${err}`)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate("/")
  }

  const updateStatus = async (id: string, newStatus: Inquiry["status"]) => {
    const { error } = await supabase
      .from("inquiries")
      .update({ status: newStatus })
      .eq("id", id)
    if (error) {
      setError(`Error updating status: ${error.message}`)
      toast.error("Failed to update status")
    } else {
      setInquiries((inq) =>
        inq.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
      )
      toast.success(`Inquiry ${newStatus}`)
    }
  }

  const addHoliday = async () => {
    if (!newHolidayDate) {
      toast.error("Please select a date")
      return
    }

    setSubmittingHoliday(true)
    try {
      const { error } = await supabase.from("holidays").insert([
        {
          date: newHolidayDate,
          name: newHolidayName || "Holiday",
        },
      ])

      if (error) {
        if (error.code === "23505") {
          toast.error("This date is already marked as a holiday")
        } else {
          toast.error("Failed to add holiday")
        }
      } else {
        toast.success("Holiday added")
        setNewHolidayDate("")
        setNewHolidayName("")
        setShowHolidayForm(false)
        // Refetch holidays
        const { data } = await supabase
          .from("holidays")
          .select("*")
          .order("date", { ascending: true })
        if (data) setHolidays(data)
      }
    } catch (err) {
      toast.error("Failed to add holiday")
    } finally {
      setSubmittingHoliday(false)
    }
  }

  // Filter and search
  const filteredInquiries = inquiries.filter((inq) => {
    const matchesStatus = statusFilter === "all" || inq.status === statusFilter
    const matchesSearch =
      inq.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inq.email.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  if (loading) return <DashboardSkeleton />

  // UI at the bottom
  return (
    <div className="min-h-screen bg-[#fafafa] pt-16 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <div className="container mx-auto max-w-6xl space-y-8 p-6 md:p-10">
        {/* Header Section */}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Logged in as: {session?.user?.email}
          </p>
          <Button onClick={handleLogout} variant="outline">
            Log Out
          </Button>
          {error && <p className="text-red-500">{error}</p>}
        </div>

        <div className="grid gap-8">
          {/* Inquiries Table Card */}
          <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:border dark:border-zinc-800 dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Inbox className="h-5 w-5 text-zinc-400" />
                  Recent Inquiries
                </CardTitle>
                <CardDescription>
                  Direct requests from your website.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="rounded-full px-3">
                {filteredInquiries.length} / {inquiries.length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter Bar */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                  </Button>
                  <Button
                    variant={statusFilter === "pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={
                      statusFilter === "confirmed" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilter("confirmed")}
                  >
                    Confirmed
                  </Button>
                  <Button
                    variant={
                      statusFilter === "cancelled" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setStatusFilter("cancelled")}
                  >
                    Cancelled
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
                <Table>
                  <TableHeader className="bg-zinc-50/50 dark:bg-zinc-900/50">
                    <TableRow>
                      <TableHead className="w-62.5 text-center font-semibold">
                        Client
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Project Type
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Requested Date
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Status
                      </TableHead>
                      <TableHead className="text-center font-semibold">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInquiries.length > 0 ? (
                      filteredInquiries.map((inq) => (
                        <TableRow
                          key={inq.id}
                          className="group transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
                                <User2 className="h-4 w-4 text-zinc-500" />
                              </div>
                              <span className="font-medium">
                                {inq.full_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <span className="text-zinc-600 dark:text-zinc-400">
                              {inq.project_type}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center text-sm">
                              <span className="flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                                <Clock className="h-3 w-3 text-zinc-400" />{" "}
                                {inq.time}
                              </span>
                              <span className="text-zinc-500">{inq.date}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge
                              className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase ${getStatusBadgeClasses(inq.status)}`}
                            >
                              {inq.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            {inq.status === "pending" && (
                              <div className="inline-flex items-center justify-center gap-2">
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() =>
                                    updateStatus(inq.id, "cancelled")
                                  }
                                >
                                  Cancel
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updateStatus(inq.id, "confirmed")
                                  }
                                >
                                  Confirm
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="h-32 text-center text-zinc-500"
                        >
                          No inquiries found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Holidays Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-zinc-400" />
                <h2 className="text-lg font-semibold">Holiday Closures</h2>
              </div>
              <Button
                size="sm"
                onClick={() => setShowHolidayForm(!showHolidayForm)}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Holiday
              </Button>
            </div>

            {/* Add Holiday Form */}
            {showHolidayForm && (
              <Card className="border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2 md:col-span-1">
                        <label className="text-sm font-medium">Date</label>
                        <Input
                          type="date"
                          value={newHolidayDate}
                          onChange={(e) => setNewHolidayDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">
                          Holiday Name (optional)
                        </label>
                        <Input
                          placeholder="e.g., Christmas, New Year"
                          value={newHolidayName}
                          onChange={(e) => setNewHolidayName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={addHoliday} disabled={submittingHoliday}>
                        {submittingHoliday ? "Adding..." : "Add"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowHolidayForm(false)
                          setNewHolidayDate("")
                          setNewHolidayName("")
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {holidays.length > 0 ? (
                holidays.map((h) => (
                  <Card
                    key={h.id}
                    className="group border-none shadow-sm transition-all hover:shadow-md dark:border dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col gap-2">
                        <p className="text-xs font-bold tracking-widest text-zinc-400 uppercase">
                          {h.date}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-zinc-900 dark:text-zinc-100">
                            {h.name || "Untitled Holiday"}
                          </span>
                          <ChevronRight className="h-4 w-4 text-zinc-300 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-100" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="col-span-full text-center text-sm text-zinc-500">
                  No holidays configured.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl space-y-8 p-10">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-100 w-full rounded-2xl" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
