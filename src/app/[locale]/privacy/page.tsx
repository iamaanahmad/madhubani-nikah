import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';

export default function PrivacyPolicyPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-3xl">
              <Shield className="h-8 w-8 text-primary" />
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none font-body">
            <p>
              Your privacy is of utmost importance to us. This Privacy Policy outlines how Madhubani Nikah collects, uses, maintains, and discloses information collected from users of our platform.
            </p>

            <h3>Information We Collect</h3>
            <p>
              We may collect personal identification information from Users in a variety of ways, including, but not limited to, when Users visit our site, register on the site, fill out a profile, and in connection with other activities, services, features or resources we make available on our Platform. Users may be asked for, as appropriate, name, email address, phone number, and other personal details relevant to a matrimonial profile.
            </p>

            <h3>How We Use Collected Information</h3>
            <ul>
              <li>To create and manage your profile.</li>
              <li>To enable communication between you and other users.</li>
              <li>To improve our platform and user experience.</li>
              <li>To send periodic emails or notifications related to your account or matches.</li>
            </ul>

            <h3>How We Protect Your Information</h3>
            <p>
              We adopt appropriate data collection, storage and processing practices and security measures to protect against unauthorized access, alteration, disclosure or destruction of your personal information. You have full control over your photo privacy (blurring/hiding) and when to share contact details.
            </p>

            <h3>Sharing Your Personal Information</h3>
            <p>
              We do not sell, trade, or rent Users' personal identification information to others. Your profile information is only shared with other registered users on the platform for the purpose of finding a matrimonial match.
            </p>

            <h3>Your Consent</h3>
            <p>
              By using this Platform, you signify your acceptance of this policy. If you do not agree to this policy, please do not use our Platform.
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
