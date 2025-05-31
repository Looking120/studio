
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
import { hireEmployee, type HireEmployeePayload } from '@/services/employee-service';

const employeeFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  middleName: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }),
  
  employeeNumber: z.string().min(1, { message: "Employee number is required."}),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }),
  phoneNumber: z.string().min(5, { message: "Phone number is required." }),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date of birth."}), 
  gender: z.string().min(1, { message: "Gender is required (e.g., Male, Female, Other)." }), 
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid hire date."}),
  
  departmentId: z.string().uuid({ message: "Department ID must be a valid GUID." }), 
  positionId: z.string().uuid({ message: "Position ID must be a valid GUID." }),     
  officeId: z.string().uuid({ message: "Office ID must be a valid GUID." }),       

  avatarUrl: z.string().url({ message: "Please enter a valid URL for the avatar." }).optional().or(z.literal('')),
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
      employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`, 
      address: '',
      phoneNumber: '',
      dateOfBirth: '', 
      gender: '', 
      hireDate: new Date().toISOString().split('T')[0], 
      departmentId: '', 
      positionId: '',   
      officeId: '',     
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
        dateOfBirth: new Date(data.dateOfBirth).toISOString(), 
        gender: data.gender, 
        hireDate: new Date(data.hireDate).toISOString(),   
        
        departmentId: data.departmentId, 
        positionId: data.positionId,     
        officeId: data.officeId,         
      };

      console.log("Submitting payload for hireEmployee:", payload);
      const newEmployee = await hireEmployee(payload);
      console.log('Employee data saved via service:', newEmployee);

      toast({
        title: "Employee Added",
        description: `${newEmployee.firstName} ${newEmployee.lastName} has been added successfully.`,
      });
      form.reset();
      router.push('/employees');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while adding the employee.";
        toast({
            variant: "destructive",
            title: "Add Error",
            description: `Could not add employee. ${errorMessage}`
        });
        console.error("Failed to add employee:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-2xl">Add New Employee</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/employees">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to list
              </Link>
            </Button>
          </div>
          <CardDescription>
            Fill in the information below to add a new employee to the system.
            Fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: John" {...field} />
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
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Doe" {...field} />
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
                    <FormLabel>Middle Name (Optional)</FormLabel>
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
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="Ex: john.doe@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employeeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Number *</FormLabel>
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
                      <FormLabel>Phone Number *</FormLabel>
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
                    <FormLabel>Full Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 123 Main Street, City, Country" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth *</FormLabel>
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
                      <FormLabel>Gender * (Ex: Male, Female, Other)</FormLabel>
                      <FormControl>
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
                      <FormLabel>Hire Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <p className="text-sm text-muted-foreground pt-2">Organizational IDs (UUID/GUID expected) - Placeholder, will be replaced by selectors</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="Department GUID" {...field} />
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
                      <FormLabel>Position ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="Position GUID" {...field} />
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
                      <FormLabel>Office ID *</FormLabel>
                      <FormControl>
                        <Input placeholder="Office GUID" {...field} />
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
                    <FormLabel>Avatar URL (Optional)</FormLabel>
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
                {form.formState.isSubmitting ? "Adding..." : "Add Employee"}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
