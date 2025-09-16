import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LifeBuoy, Phone, Mail } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-3xl">
            <LifeBuoy className="h-8 w-8 text-primary" />
            Help & Support
          </CardTitle>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none font-body">
          <p>
            We are here to help you on your journey. If you have any questions, face any issues, or need assistance with creating a profile, please do not hesitate to reach out to us.
          </p>
          <h3>Contact Information</h3>
          <p>For any support, you can contact us via the following methods:</p>
          <div className="flex items-center gap-4">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <span>support@madhubaninikah.com</span>
          </div>
           <div className="flex items-center gap-4 mt-2">
            <Phone className="h-5 w-5 text-muted-foreground" />
            <span>+91 123 456 7890 (10 AM - 6 PM)</span>
          </div>
          
          <h3 className="mt-6">Frequently Asked Questions (FAQ)</h3>
          
          <h4>Is this service really free?</h4>
          <p>Yes, Madhubani Nikah is 100% free to use for everyone in the community. Our goal is to facilitate Halal marriages, not to make a profit.</p>
          
          <h4>How do you protect my privacy?</h4>
          <p>We have several privacy features, including photo blurring, guardian controls, and an internal messaging system. Your contact details are never shared without your explicit consent.</p>

          <h4>Can my parents or guardian manage my profile?</h4>
          <p>Absolutely. The platform is designed to be guardian-friendly. A Wali can create and manage a profile, communicate with potential matches, and be involved in every step of the process.</p>
        </CardContent>
      </Card>
    </div>
  );
}
