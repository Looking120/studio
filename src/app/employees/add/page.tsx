
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
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
    form.clearErrors(); 
    try {
      // The 'hireEmployee' service function expects data that fits Omit<Employee, 'id' | 'status' | ...> & { avatarUrl?: string }
      // Our EmployeeFormValues is compatible.
      const newEmployee = await hireEmployee(data); 
      console.log('Employee data saved via service:', newEmployee);

      toast({
        title: "Employé Ajouté",
        description: `${newEmployee.name} a été ajouté avec succès. ID: ${newEmployee.id}`,
      });
      form.reset(); // Reset form fields after successful submission
      router.push('/employees'); 
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue s'est produite lors de l'ajout de l'employé.";
        toast({
            variant: "destructive",
            title: "Erreur d'Ajout",
            description: `Impossible d'ajouter l'employé. ${errorMessage}`
        });
        console.error("Failed to add employee:", error);
        // Handle field-specific errors if your API returns them in a structured way
        // Example: if (error.response?.data?.errors) { ... form.setError ... }
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
