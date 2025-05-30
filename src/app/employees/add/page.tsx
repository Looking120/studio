
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
// Removed type import for Employee from lib/data as hireEmployee service will have its own payload type

const employeeFormSchema = z.object({
  firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères." }),
  lastName: z.string().min(2, { message: "Le nom de famille doit contenir au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
  department: z.string().min(2, { message: "Le département doit contenir au moins 2 caractères." }), // Placeholder, likely needs to be DepartmentId
  jobTitle: z.string().min(2, { message: "Le poste doit contenir au moins 2 caractères." }), // Placeholder, likely needs to be PositionId
  avatarUrl: z.string().url({ message: "Veuillez entrer une URL valide pour l'avatar." }).optional().or(z.literal('')),
  // TODO: Add more fields required by backend: employeeNumber, address, dateOfBirth, gender, hireDate, etc.
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export default function AddEmployeePage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      department: '', // This will likely need to become a selection for DepartmentId
      jobTitle: '',   // This will likely need to become a selection for PositionId
      avatarUrl: '',
    },
  });

  const onSubmit = async (data: EmployeeFormValues) => {
    form.clearErrors();
    try {
      // Construct the payload according to what hireEmployee service now expects
      // This will evolve as we add more fields to the form
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        department: data.department, // Placeholder, will become departmentId
        jobTitle: data.jobTitle,     // Placeholder, will become positionId
        avatarUrl: data.avatarUrl || undefined, // Send undefined if empty to omit
        // Dummy values for other required fields for now, or fetch/select them
        // These would ideally come from the form once it's expanded
        employeeNumber: `EMP-${Math.floor(Math.random() * 10000)}`,
        address: "123 Main St", // Placeholder
        phoneNumber: "555-0100", // Placeholder
        dateOfBirth: new Date(1990,0,1).toISOString(), // Placeholder
        gender: 0, // Placeholder for enum (e.g., Male)
        hireDate: new Date().toISOString(), // Placeholder
        departmentId: "00000000-0000-0000-0000-000000000000", // Placeholder GUID
        positionId: "00000000-0000-0000-0000-000000000000", // Placeholder GUID
      };

      const newEmployee = await hireEmployee(payload);
      console.log('Employee data saved via service:', newEmployee);

      toast({
        title: "Employé Ajouté",
        description: `${newEmployee.firstName} ${newEmployee.lastName} a été ajouté avec succès.`,
      });
      form.reset();
      router.push('/employees');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue s'est produite lors de l'ajout de l'employé.";
        toast({
            variant: "destructive",
            title: "Erreur d'Ajout",
            description: `Impossible d'ajouter l'employé. ${errorMessage}`
        });
        console.error("Failed to add employee:", error);
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
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Jean" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de famille</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Dupont" {...field} />
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
                    <FormLabel>Département (Temporaire - sera ID)</FormLabel>
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
                    <FormLabel>Poste (Temporaire - sera ID)</FormLabel>
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
