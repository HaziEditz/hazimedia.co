import { useEffect, useRef } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowRight, BarChart3, CheckCircle2, Globe2, MousePointerClick, Target, TrendingUp, Zap } from "lucide-react";

export default function Landing() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Basic scroll reveal
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in", "fade-in", "slide-in-from-bottom-8");
          entry.target.classList.remove("opacity-0");
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll(".reveal");
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-primary selection:text-primary-foreground">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          {/* Subtle noise and gradient background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-20 mix-blend-overlay" />
        </div>
        
        <div className="container mx-auto px-4 text-center reveal opacity-0 duration-1000">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary mb-8 border border-primary/20 text-sm font-medium">
            <Zap className="h-4 w-4" /> 
            <span>Elite Digital Marketing Agency</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 max-w-5xl mx-auto leading-[1.1]">
            Building Attention <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/50">That Converts.</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            We engineer viral growth for ambitious brands. Stop posting into the void and start dominating your niche with data-driven promotion strategies.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="h-14 px-8 text-lg font-medium w-full sm:w-auto shadow-lg shadow-primary/20">
                Start Campaign <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#services">
              <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium w-full sm:w-auto bg-background/50 backdrop-blur">
                View Packages
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-32 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mb-20 reveal opacity-0">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6">Engineered for growth.</h2>
            <p className="text-lg text-muted-foreground">We don't just buy ads. We orchestrate attention through our proprietary network of high-engagement channels.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Precision Targeting",
                desc: "We analyze your ideal customer profile and map it against our network of millions of active users."
              },
              {
                icon: TrendingUp,
                title: "Viral Orchestration",
                desc: "Strategic placement across high-leverage accounts to create algorithmic momentum and social proof."
              },
              {
                icon: BarChart3,
                title: "Conversion Optimization",
                desc: "We don't just drive traffic. We optimize the flow to ensure maximum conversion on your assets."
              }
            ].map((service, i) => (
              <div key={i} className="p-8 rounded-2xl bg-card/50 border border-border/40 hover:border-primary/50 transition-all hover:bg-card/80 group reveal opacity-0" style={{ transitionDelay: `${i * 150}ms` }}>
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <service.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-3">{service.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{service.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="container mx-auto px-4 relative text-center reveal opacity-0">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-8">Ready to dominate?</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join the elite brands that are already leveraging our network to capture market share.
          </p>
          <Link href="/register">
            <Button size="lg" className="h-14 px-10 text-lg font-medium shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
              Launch Your Campaign Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40 bg-card/30">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 text-xl font-bold tracking-tighter">
            <div className="w-5 h-5 rounded bg-primary" />
            HAZI MEDIA
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Hazi Media. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
