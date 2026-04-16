// Combined logic and UI into one file
import { useState } from "react"
import { useNavigate } from "react-router"
import { supabase } from "../lib/supabaseClient"
import { useAuth } from "../lib/AuthContext"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function Login({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // Logic at the top
  const [email, setEmail] = useState<string>("")
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()
  const { session } = useAuth()

  // If already logged in, push them to the admin dashboard
  if (session) {
    navigate("/admin")
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      navigate("/admin") // Redirect on success
    }
  }

  // UI at the bottom
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className={cn("flex flex-col gap-6", className)} {...props}>
          <Card>
            <CardHeader>
              <CardTitle>Admin Login</CardTitle>
              <CardDescription>
                Enter your email below to login to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      placeholder="johndoe@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <div className="flex items-center">
                      <FieldLabel htmlFor="password">Password</FieldLabel>
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <Button
                      type="submit"
                      className="w-full disabled:bg-powder-blue disabled:text-white disabled:opacity-100"
                      disabled={!email.trim() || !password.trim()}
                    >
                      Login
                    </Button>
                    <FieldDescription className="text-center">
                      Don&apos;t need to sign in? <a href="/">Home</a>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </form>
              {error && <p style={{ color: "red" }}>{error}</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
