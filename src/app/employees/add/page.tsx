
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
import { hireEmployee, type HireEmployeePayload } from '@/services/employee-service'; // Updated import

// Adjusted Zod schema to align with HireEmployeePayload and backend entities
// Note: For GUIDs (departmentId, positionId, officeId) and enums (gender),
// the form will need proper select/radio components eventually.
const employeeFormSchema = z.object({
  firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères." }),
  lastName: z.string().min(2, { message: "Le nom de famille doit contenir au moins 2 caractères." }),
  middleName: z.string().optional(),
  email: z.string().email({ message: "Veuillez entrer une adresse email valide." }),
  
  employeeNumber: z.string().min(1, { message: "Le numéro d'employé est requis."}),
  address: z.string().min(5, { message: "L'adresse doit contenir au moins 5 caractères." }),
  phoneNumber: z.string().min(5, { message: "Le numéro de téléphone est requis." }),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Date de naissance invalide."}), // Basic validation
  gender: z.string().min(1, { message: "Le genre est requis (ex: Male, Female, Other)." }), // String as per new schema
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Date d'embauche invalide."}),
  
  departmentId: z.string().uuid({ message: "L'ID du département doit être un GUID valide." }), // Expecting GUID
  positionId: z.string().uuid({ message: "L'ID du poste doit être un GUID valide." }),     // Expecting GUID
  officeId: z.string().uuid({ message: "L'ID du bureau doit être un GUID valide." }),       // Expecting GUID

  avatarUrl: z.string().url({ message: "Veuillez entrer une URL valide pour l'avatar." }).optional().or(z.literal('')),
  // userId is optional in HireEmployeePayload, not typically set in this form for a *new* employee
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
      middleName: '',
      email: '',
      employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`, // Example placeholder
      address: '',
      phoneNumber: '',
      dateOfBirth: '', 
      gender: '', // Will need a select/radio for Male, Female, Other
      hireDate: new Date().toISOString().split('T')[0], // Default to today
      departmentId: '', // Placeholder, should be a select returning GUID
      positionId: '',   // Placeholder, should be a select returning GUID
      officeId: '',     // Placeholder, should be a select returning GUID
      avatarUrl: '',
    },
  });

  const onSubmit = async (data: EmployeeFormValues) => {
    form.clearErrors();
    try {
      const payload: HireEmployeePayload = {
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || undefined,
        email: data.email,
        avatarUrl: data.avatarUrl || undefined,
        
        employeeNumber: data.employeeNumber,
        address: data.address,
        phoneNumber: data.phoneNumber,
        dateOfBirth: new Date(data.dateOfBirth).toISOString(), // Ensure ISO format
        gender: data.gender, // Expecting "Male", "Female", "Other"
        hireDate: new Date(data.hireDate).toISOString(),   // Ensure ISO format
        
        departmentId: data.departmentId, // Expecting GUID from form
        positionId: data.positionId,     // Expecting GUID from form
        officeId: data.officeId,         // Expecting GUID from form
        // userId: undefined, // Not typically set when creating a new employee this way
      };

      console.log("Submitting payload for hireEmployee:", payload);
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
    <div className="max-w-3xl mx-auto py-8">
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
            Les champs marqués d'un * sont obligatoires.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
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
                      <FormLabel>Nom de famille *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Dupont" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="middleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deuxième prénom (Optionnel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Charles" {...field} />
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
                    <FormLabel>Adresse Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Ex: jean.dupont@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro d'employé *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: EMP001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de téléphone *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="Ex: 555-0100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse complète *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 123 Rue Principale, Ville, Pays" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date de naissance *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Genre * (Ex: Male, Female, Other)</FormLabel>
                      <FormControl>
                         {/* TODO: Replace with Select component for Male, Female, Other */}
                        <Input placeholder="Ex: Male" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hireDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date d'embauche *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <p className="text-sm text-muted-foreground pt-2">IDs Organisationnels (UUID/GUID attendus) - TODO: Remplacer par des sélecteurs</p>
              <div className="grid md:grid-cols-3 gap-4">
                 <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Département *</FormLabel>
                      <FormControl>
                        <Input placeholder="GUID Département" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="positionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Poste *</FormLabel>
                      <FormControl>
                        <Input placeholder="GUID Poste" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="officeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Bureau *</FormLabel>
                      <FormControl>
                        <Input placeholder="GUID Bureau" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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

