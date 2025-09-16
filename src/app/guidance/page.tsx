import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { islamicContent } from '@/lib/data';

export default function GuidancePage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-headline text-3xl">
            <BookOpen className="h-8 w-8 text-primary" />
            Islamic Marriage Guidance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {islamicContent.map((item) => (
             <blockquote key={item.id} className="border-l-4 border-primary pl-4 py-2">
                <p className="font-headline text-xl italic leading-relaxed md:text-2xl">
                  &ldquo;{item.text}&rdquo;
                </p>
                <footer className="mt-2 text-sm text-muted-foreground">- {item.source} ({item.type})</footer>
              </blockquote>
          ))}
           <div className="prose dark:prose-invert max-w-none font-body pt-6">
              <h3>The Importance of Nikah</h3>
              <p>
                In Islam, Nikah is not just a social contract but a sacred covenant and an act of worship. It is a means of finding tranquility, completing half of one's deen (faith), and building a righteous family, which is the cornerstone of an Islamic society. The Quran and the Sunnah of Prophet Muhammad (peace be upon him) provide comprehensive guidance on choosing a spouse, the marriage process, and the rights and responsibilities of both husband and wife.
              </p>
              <p>
                Our platform encourages users to seek partners based on piety (Taqwa), good character (Akhlaq), and compatibility, as these are the foundations of a lasting and blessed marriage.
              </p>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
