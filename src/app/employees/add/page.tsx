
"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { hireEmployee, type HireEmployeePayload } from '@/services/employee-service';
import { 
  fetchDepartments, 
  fetchPositions, 
  fetchOffices, 
  type Department, 
  type Position, 
  type Office as OrgOffice // Renamed to avoid conflict with Office from lib/data
} from '@/services/organization-service';
import { Skeleton } from '@/components/ui/skeleton';

const employeeFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  middleName: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }),
  
  employeeNumber: z.string().min(1, { message: "Employee number is required."}),
  address: z.string().min(5, { message: "Address must be at least 5 characters." }).optional().or(z.literal('')),
  phoneNumber: z.string().min(5, { message: "Phone number is required." }).optional().or(z.literal('')),
  dateOfBirth: z.string().refine((val) => !val || !isNaN(Date.parse(val)), { message: "Invalid date of birth."}).optional().or(z.literal('')), 
  gender: z.string().min(1, { message: "Gender is required (e.g., Male, Female, Other)." }).optional().or(z.literal('')), 
  hireDate: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid hire date."}),
  
  departmentId: z.string().uuid({ message: "Please select a valid department." }), 
  positionId: z.string().uuid({ message: "Please select a valid position." }),     
  officeId: z.string().uuid({ message: "Please select a valid office." }),       

  avatarUrl: z.string().url({ message: "Please enter a valid URL for the avatar." }).optional().or(z.literal('')),
  userIdToHire: z.string().uuid({ message: "Invalid user ID to hire." }).optional(), // For linking existing user
});

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export default function AddEmployeePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [offices, setOffices] = useState<OrgOffice[]>([]); // Use OrgOffice type
  const [isLoadingOrgData, setIsLoadingOrgData] = useState(true);
  const [orgDataError, setOrgDataError] = useState<string | null>(null);

  const initialFirstName = searchParams.get('firstName') || '';
  const initialLastName = searchParams.get('lastName') || '';
  const initialEmail = searchParams.get('email') || '';
  const initialPhoneNumber = searchParams.get('phoneNumber') || '';
  const initialUserIdToHire = searchParams.get('userIdToHire') || undefined;


  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: {
      firstName: initialFirstName,
      lastName: initialLastName,
      middleName: '',
      email: initialEmail,
      employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`, 
      address: '',
      phoneNumber: initialPhoneNumber,
      dateOfBirth: '', 
      gender: '', 
      hireDate: new Date().toISOString().split('T')[0], 
      departmentId: undefined, 
      positionId: undefined,   
      officeId: undefined,     
      avatarUrl: '',
      userIdToHire: initialUserIdToHire,
    },
  });

  useEffect(() => {
    // If these values are pre-filled from searchParams, update the form state
    if (initialFirstName) form.setValue('firstName', initialFirstName);
    if (initialLastName) form.setValue('lastName', initialLastName);
    if (initialEmail) form.setValue('email', initialEmail);
    if (initialPhoneNumber) form.setValue('phoneNumber', initialPhoneNumber);
    if (initialUserIdToHire) form.setValue('userIdToHire', initialUserIdToHire);
  }, [initialFirstName, initialLastName, initialEmail, initialPhoneNumber, initialUserIdToHire, form]);


  useEffect(() => {
    const loadOrgData = async () => {
      setIsLoadingOrgData(true);
      setOrgDataError(null);
      try {
        const [deptData, posData, officeData] = await Promise.all([
          fetchDepartments(),
          fetchPositions(),
          fetchOffices() 
        ]);
        setDepartments(deptData || []);
        setPositions(posData || []);
        setOffices(officeData || []); 
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Could not load organizational data (departments, positions, offices).";
        setOrgDataError(errorMessage);
        toast({ variant: "destructive", title: "Data Load Error", description: errorMessage });
      } finally {
        setIsLoadingOrgData(false);
      }
    };
    loadOrgData();
  }, [toast]);

  const onSubmit = async (data: EmployeeFormValues) => {
    form.clearErrors();
    try {
      const payload: HireEmployeePayload = {
        userId: data.userIdToHire || undefined, // Ensure userIdToHire is passed as userId
        firstName: data.firstName,
        lastName: data.lastName,
        middleName: data.middleName || undefined,
        email: data.email,
        avatarUrl: data.avatarUrl || undefined,
        
        employeeNumber: data.employeeNumber,
        address: data.address || undefined,
        phoneNumber: data.phoneNumber || undefined,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString() : undefined, 
        gender: data.gender || undefined, 
        hireDate: new Date(data.hireDate).toISOString(),   
        
        departmentId: data.departmentId, 
        positionId: data.positionId,     
        officeId: data.officeId,
      };
      
      if (data.userIdToHire) {
        console.log("Attempting to hire existing user with ID:", data.userIdToHire, "Payload:", JSON.stringify(payload, null, 2));
      } else {
        console.log("Attempting to hire new user. Payload:", JSON.stringify(payload, null, 2));
      }

      const newEmployee = await hireEmployee(payload);
      console.log('Employee data saved via service:', newEmployee);

      toast({
        title: "Employee Hired",
        description: `${newEmployee.firstName} ${newEmployee.lastName} has been hired successfully.`,
      });
      form.reset({ 
        firstName: '', lastName: '', middleName: '', email: '',
        employeeNumber: `EMP-${Math.floor(1000 + Math.random() * 9000)}`,
        address: '', phoneNumber: '', dateOfBirth: '', gender: '',
        hireDate: new Date().toISOString().split('T')[0],
        departmentId: undefined, positionId: undefined, officeId: undefined,
        avatarUrl: '', userIdToHire: undefined,
      });
      router.push('/employees');
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred while adding the employee.";
        toast({
            variant: "destructive",
            title: "Hiring Error",
            description: `Could not hire employee. ${errorMessage}`
        });
        console.error("Failed to hire employee:", error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card className="shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-2xl">
              {initialUserIdToHire ? "Complete Employee Hiring" : "Add New Employee"}
            </CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/employees">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to list
              </Link>
            </Button>
          </div>
          <CardDescription>
            {initialUserIdToHire 
              ? "Complete the employee details below. Some information has been pre-filled."
              : "Fill in the information below to add a new employee to the system."}
            Fields marked with * are required for hiring.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
               {initialUserIdToHire && (
                <FormField
                    control={form.control}
                    name="userIdToHire"
                    render={({ field }) => (
                    <FormItem className="hidden">
                        <FormControl>
                        <Input {...field} type="hidden" />
                        </FormControl>
                    </FormItem>
                    )}
                />
                )}
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
                    <FormLabel>Middle Name</FormLabel>
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
                      <FormLabel>Phone Number</FormLabel>
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
                    <FormLabel>Full Address</FormLabel>
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
                      <FormLabel>Date of Birth</FormLabel>
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
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                    <SelectItem value="PreferNotToSay">Prefer not to say</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
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
              
              <p className="text-sm text-muted-foreground pt-2 font-semibold">Organizational Details *</p>
              {isLoadingOrgData && (
                <div className="space-y-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              )}
              {orgDataError && !isLoadingOrgData && (
                 <div className="flex items-center p-3 rounded-md border border-destructive/50 bg-destructive/10 text-destructive text-sm">
                    <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span>{orgDataError}</span>
                </div>
              )}
              {!isLoadingOrgData && !orgDataError && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Departments</SelectLabel>
                              {departments.map(dept => (
                                <SelectItem key={dept.id} value={dept.id}>
                                  {dept.name}
                                </SelectItem>
                              ))}
                              {departments.length === 0 && <SelectItem value="nodata" disabled>No departments found</SelectItem>}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="positionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Position *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select position" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Positions</SelectLabel>
                              {positions.map(pos => (
                                <SelectItem key={pos.id} value={pos.id}>
                                  {pos.title}
                                </SelectItem>
                              ))}
                              {positions.length === 0 && <SelectItem value="nodata" disabled>No positions found</SelectItem>}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="officeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Office *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select office" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Offices</SelectLabel>
                              {offices.map(office => (
                                <SelectItem key={office.id} value={office.id}>
                                  {office.name}
                                </SelectItem>
                              ))}
                              {offices.length === 0 && <SelectItem value="nodata" disabled>No offices found</SelectItem>}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.png" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end pt-6">
              <Button type="submit" disabled={form.formState.isSubmitting || isLoadingOrgData}>
                {form.formState.isSubmitting ? (initialUserIdToHire ? "Hiring..." : "Adding..." ) : (initialUserIdToHire ? "Complete Hiring" : "Add Employee")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
