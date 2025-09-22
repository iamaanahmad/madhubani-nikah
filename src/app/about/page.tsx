import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';
import MainLayout from '@/components/layout/main-layout';

export default function AboutPage() {
  return (
    <MainLayout>
      <div className="container mx-auto p-4 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-headline text-3xl">
              <Info className="h-8 w-8 text-primary" />
              About Madhubani Nikah
            </CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none font-body">
            <p>
              Madhubani Nikah is a dedicated and trusted Islamic matrimony platform designed specifically for the Muslim community of the Madhubani region. Our mission is to provide a safe, secure, and Halal environment where individuals can find suitable life partners according to Islamic values.
            </p>
            <p>
              We understand the cultural nuances and religious importance of marriage in our community. That's why our platform is built with a "character-first" approach, emphasizing religious practice, education, and family values over superficial attributes.
            </p>
            <h3>Our Core Principles:</h3>
            <ul>
              <li><strong>Privacy-Focused:</strong> We prioritize your privacy with features like optional photo uploads, blurred photos, and secure messaging.</li>
              <li><strong>Family-Oriented:</strong> We encourage family involvement in a way that respects individual choice and control.</li>
              <li><strong>100% Free:</strong> Our service is completely free, removing financial barriers to finding a partner.</li>
              <li><strong>Community-Driven:</strong> We aim to strengthen our community by facilitating blessed unions and upholding Islamic traditions.</li>
            </ul>
            <p>
              We are committed to helping you find your life partner in a way that is pleasing to Allah (SWT).
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
