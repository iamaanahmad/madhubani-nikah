'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

const formSchema = z.object({
  document: z
    .any()
    .refine((files) => files?.length === 1, 'Document is required.')
    .refine(
      (files) => files?.[0]?.size <= 5000000,
      `Max file size is 5MB.`
    )
    .refine(
      (files) =>
        ['image/jpeg', 'image/png', 'application/pdf'].includes(
          files?.[0]?.type
        ),
      'Only .jpg, .png, and .pdf formats are supported.'
    ),
});

export function VerificationForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // In a real app, you would upload this to a secure bucket in Appwrite
    // and create a record in the `verification_requests` collection.
    console.log(values);
    toast({
      title: 'Submission Successful',
      description:
        'Your document has been submitted for review. Verification may take up to 48 hours.',
    });
    form.reset();
  }

  return (
    <>
    <Alert className="mb-6">
        <Info className="h-4 w-4" />
        <AlertTitle>Important Information</AlertTitle>
        <AlertDescription>
          <ul className="list-disc pl-5 space-y-1">
            <li>Please upload a clear, scanned copy of a government-issued ID (e.g., Aadhar Card, Passport, Driver's License).</li>
            <li>Your information will be kept confidential and will only be used for verification purposes.</li>
            <li>Make sure the name and other details on the document match your profile information.</li>
          </ul>
        </AlertDescription>
      </Alert>
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="document"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Verification Document</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => field.onChange(e.target.files)}
                />
              </FormControl>
              <FormDescription>
                Upload a clear copy of your government ID. Max size: 5MB.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full">
          Submit for Verification
        </Button>
      </form>
    </Form>
    </>
  );
}
