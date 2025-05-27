
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Label component from ShadCN is used by FormLabel
// import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
// import { mockEmployees, type Employee } from '@/lib/data'; // We'll use the service now
import { hireEmployee } from '@/services/employee-service';
import type { Employee } from '@/lib/data';


const employeeFormSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
  department: z.string().min(2, { message: "Le département doit contenir au moins 2 caractères." }),
  jobTitle: z.string().min(2, { message: "Le poste doit contenir au moins 2 caractères." }),
  avatarUrl: z.string().url({ message: "Veuillez entrer une URL valide pour l'avatar." }).optional().or(z.literal('')),
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export default function AddEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      name: '',
      email: '',
      department: '',
      jobTitle: '',
      avatarUrl: '',
    },
  });

  const onSubmit = async (data: EmployeeFormValues) => {
    form.clearErrors(); // Clear previous errors
    try {
      // Use the hireEmployee service function
      const newEmployee = await hireEmployee(data); 
      console.log('Employee data saved via service:', newEmployee);

      toast({
        title: "Employé Ajouté",
        description: `${data.name} a été ajouté avec succès.`,
      });
      router.push('/employees'); 
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Erreur d'Ajout",
            description: `Impossible d'ajouter l'employé. ${error instanceof Error ? error.message : 'Erreur inconnue du serveur.'}`
        });
        console.error("Failed to add employee:", error);
        // Optionally, set form errors if the API returns field-specific errors
        // if (error.response && error.response.data && error.response.data.errors) {
        //   const errors = error.response.data.errors;
        //   Object.keys(errors).forEach((key) => {
        //     form.setError(key as keyof EmployeeFormValues, {
        //       type: 'manual',
        //       message: errors[key].join(', '),
        //     });
        //   });
        // }
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">Ajouter un Nouvel Employé</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/employees">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la liste
              </Link>
            </Button>
          </div>
          <CardDescription>
            Remplissez les informations ci-dessous pour ajouter un nouvel employé au système.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom Complet</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Jean Dupont" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Ex: jean.dupont@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Département</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Ingénierie" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poste</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Développeur Senior" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de l'Avatar (Optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end pt-6">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Ajout en cours..." : "Ajouter l'Employé"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
