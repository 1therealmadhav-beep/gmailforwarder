'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { ArrowRight, Mail, Shield, Zap, Settings, Users } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2">
                <Mail className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Gmail Forwarder</span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="#features" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Features</Link>
                <Link href="#how-it-works" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">How it Works</Link>
                <Link href="#pricing" className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">Pricing</Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/auth?action=google">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/auth?action=google">
                <Button size="sm">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-950 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-6">
              Automate Your{' '}
              <span className="text-primary-600 dark:text-primary-400">Gmail Forwarding</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-10 max-w-2xl mx-auto">
              Set up custom rules to automatically forward emails from specific senders, domains, or with certain keywords.
              Admin panel for complete control, user panel for easy rule management.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/auth?action=google">
                <Button size="lg" className="w-full sm:w-auto gap-2">
                  Connect Gmail & Start
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-28 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Powerful Features
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Everything you need to automate email forwarding with granular control
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard
              icon={Settings}
              title="Custom Forwarding Rules"
              description="Create rules based on sender email, domain, subject keywords, or Gmail labels. Forward to multiple destinations."
            />
            <FeatureCard
              icon={Zap}
              title="Real-time Processing"
              description="Emails are processed and forwarded within minutes using Gmail push notifications and scheduled jobs."
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Private"
              description="OAuth 2.0 authentication, encrypted token storage, and minimal required scopes. Your data stays yours."
            />
            <FeatureCard
              icon={Users}
              title="Admin & User Panels"
              description="Separate dashboards for administrators to manage all users and for users to configure their own rules."
            />
            <FeatureCard
              icon={Mail}
              title="Flexible Forwarding"
              description="Forward as inline email, attachment, or with custom templates. Add prefixes, modify subjects, and more."
            />
            <FeatureCard
              icon={Zap}
              title="Rate Limiting & Safety"
              description="Built-in rate limiting, error handling, and audit logs to prevent issues and track all activity."
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-20 lg:py-28 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Get started in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <StepCard
              number="01"
              title="Connect Gmail"
              description="Sign in with Google and grant permission to read and send emails. Uses secure OAuth 2.0."
            />
            <StepCard
              number="02"
              title="Create Rules"
              description="Set up forwarding rules - filter by sender, domain, subject, or labels. Choose destination emails."
            />
            <StepCard
              number="03"
              title="Auto Forward"
              description="Emails matching your rules are automatically forwarded. Monitor everything from your dashboard."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-28 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Automate Your Email Forwarding?
          </h2>
          <p className="text-lg text-primary-100 mb-10 max-w-2xl mx-auto">
            Join thousands of users who save hours every week with automated Gmail forwarding.
          </p>
          <Link href="/auth?action=google">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto gap-2">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Mail className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-gray-100">Gmail Forwarder</span>
              </Link>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Automate your email forwarding with custom rules. Secure, private, and easy to use.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#features" className="hover:text-primary-600 dark:hover:text-primary-400">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-primary-600 dark:hover:text-primary-400">How it Works</Link></li>
                <li><Link href="#pricing" className="hover:text-primary-600 dark:hover:text-primary-400">Pricing</Link></li>
                <li><Link href="/docs" className="hover:text-primary-600 dark:hover:text-primary-400">Documentation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/about" className="hover:text-primary-600 dark:hover:text-primary-400">About</Link></li>
                <li><Link href="/blog" className="hover:text-primary-600 dark:hover:text-primary-400">Blog</Link></li>
                <li><Link href="/careers" className="hover:text-primary-600 dark:hover:text-primary-400">Careers</Link></li>
                <li><Link href="/contact" className="hover:text-primary-600 dark:hover:text-primary-400">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-primary-600 dark:hover:text-primary-400">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-primary-600 dark:hover:text-primary-400">Security</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            © 2024 Gmail Forwarder. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
          <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="mt-2">{description}</CardDescription>
      </CardContent>
    </Card>
  );
}

function StepCard({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="relative pl-12">
      <div className="absolute left-0 top-0 h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-sm">
        {number}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}