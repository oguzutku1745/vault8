import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Shield, Zap, TrendingUp, ArrowRight } from "lucide-react"
import { Link } from "react-router-dom"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-background" />
          <div className="container relative py-24 md:py-32">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
                <span className="flex h-2 w-2 rounded-full bg-accent" />
                <span className="text-muted-foreground">Cross-chain yield optimization</span>
              </div>

              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-6xl text-balance">
                Maximize Your DeFi Yields Across{" "}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Base & Solana
                </span>
              </h1>

              <p className="mb-8 text-lg text-muted-foreground text-balance">
                vault8 automatically optimizes your crypto assets across multiple chains and protocols, delivering
                superior returns with institutional-grade security.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Link to="/marketplace">
                    Explore Vaults <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/dashboard">Create Vault</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-card/50">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Secure & Audited</h3>
                <p className="text-muted-foreground">
                  Smart contracts audited by leading security firms with multi-sig protection
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card hover:border-secondary/50 transition-colors">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10">
                  <Zap className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Auto-Rebalancing</h3>
                <p className="text-muted-foreground">
                  Intelligent algorithms continuously optimize your portfolio for maximum yield
                </p>
              </div>

              <div className="flex flex-col items-center text-center p-6 rounded-xl border border-border bg-card hover:border-accent/50 transition-colors">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <TrendingUp className="h-6 w-6 text-accent" />
                </div>
                <h3 className="mb-2 text-xl font-bold">Superior Returns</h3>
                <p className="text-muted-foreground">
                  Outperform traditional DeFi strategies with cross-chain optimization
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
