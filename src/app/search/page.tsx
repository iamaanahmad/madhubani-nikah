import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Search } from 'lucide-react';

export default function SearchPage() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Filters Section */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-headline text-2xl">
                <Search className="h-6 w-6 text-primary" />
                Filter Profiles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="space-y-4">
                <Label htmlFor="age-range">Age Range: 25 - 40</Label>
                <Slider
                  id="age-range"
                  defaultValue={[25, 40]}
                  min={18}
                  max={60}
                  step={1}
                />
              </div>

               <div className="space-y-2">
                <Label htmlFor="village">Village / Block</Label>
                <Input id="village" placeholder="e.g., Benipatti" />
              </div>

               <Accordion type="multiple" className="w-full">
                <AccordionItem value="education">
                  <AccordionTrigger>Education</AccordionTrigger>
                  <AccordionContent className="space-y-2">
                     <div className="flex items-center space-x-2">
                      <Checkbox id="edu-school" />
                      <Label htmlFor="edu-school">School</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                      <Checkbox id="edu-grad" />
                      <Label htmlFor="edu-grad">Graduation</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                      <Checkbox id="edu-postgrad" />
                      <Label htmlFor="edu-postgrad">Post-Graduation</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                      <Checkbox id="edu-religious" />
                      <Label htmlFor="edu-religious">Religious Education</Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="occupation">
                  <AccordionTrigger>Occupation</AccordionTrigger>
                  <AccordionContent>
                    <div className="flex items-center space-x-2">
                      <Checkbox id="occ-service" />
                      <Label htmlFor="occ-service">Service</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                      <Checkbox id="occ-business" />
                      <Label htmlFor="occ-business">Business</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                      <Checkbox id="occ-student" />
                      <Label htmlFor="occ-student">Student</Label>
                    </div>
                     <div className="flex items-center space-x-2">
                      <Checkbox id="occ-homemaker" />
                      <Label htmlFor="occ-homemaker">Homemaker</Label>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                 <AccordionItem value="religious-practice">
                  <AccordionTrigger>Religious Practice</AccordionTrigger>
                  <AccordionContent>
                    <RadioGroup defaultValue="any">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="any" id="rp-any" />
                        <Label htmlFor="rp-any">Any</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="regular" id="rp-regular" />
                        <Label htmlFor="rp-regular">Prays Regularly</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="hafiz" id="rp-hafiz" />
                        <Label htmlFor="rp-hafiz">Hafiz/Hafiza</Label>
                      </div>
                    </RadioGroup>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              <Button className="w-full">
                <Search className="mr-2" />
                Apply Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="lg:col-span-3">
           <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Search Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-md">
                <p className="text-muted-foreground">Filtered profiles will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
