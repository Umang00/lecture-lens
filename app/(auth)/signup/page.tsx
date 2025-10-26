'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Users, Shield, Info, ArrowLeft } from 'lucide-react';

export default function SignupDisabledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-gray-900">
            Registration Closed
          </CardTitle>
          <CardDescription className="text-gray-600">
            Lecture Lens uses invite-only access for security
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Mail className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">
                How to Get Access
              </p>
              <p className="text-sm text-blue-800">
                Contact your cohort admin or instructor to request access.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-semibold text-gray-900">For Students</p>
              </div>
              <p className="text-sm text-gray-700">
                Contact your cohort admin or instructor to request access.
                They will create an account and assign you to your cohort.
              </p>
            </div>

            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-semibold text-gray-900">For Admins</p>
              </div>
              <p className="text-sm text-gray-700 mb-2">
                Create user accounts via the admin panel or seed script:
              </p>
              <code className="block text-xs bg-gray-900 text-green-400 p-2 rounded font-mono">
                npm run seed
              </code>
            </div>

            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-yellow-600" />
                <p className="text-sm font-semibold text-yellow-900">Demo Access</p>
              </div>
              <p className="text-sm text-yellow-800 mb-2">
                For demo purposes, use these test accounts:
              </p>
              <div className="text-xs space-y-1 text-yellow-800 font-mono">
                <p>• student@cohort5.com / demo123</p>
                <p>• instructor@cohort5.com / demo123</p>
                <p>• admin@100x.com / demo123</p>
              </div>
            </div>
          </div>

          <Button asChild className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go to Login
            </Link>
          </Button>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-xs font-semibold text-gray-700 mb-2 text-center">Why Invite-Only?</p>
            <ul className="text-xs space-y-1 text-gray-600">
              <li>• Prevents unauthorized access to cohort data</li>
              <li>• Maintains Row-Level Security (RLS) integrity</li>
              <li>• Ensures users are properly assigned to cohorts</li>
              <li>• Protects lecture content and resources</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
