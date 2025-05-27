
"use client";

import React, { useState, useEffect } from 'react';
import type { Employee } from '@/lib/data'; // Keep type definition
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { mockEmployees } from '@/lib/data'; // Import mockEmployees for initial state


export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
  const [searchTerm, setSearchTerm] = useState('');


  // Effect to update employees if mockEmployees changes (e.g. after adding an employee on another page and returning)
  // For a real app, this would likely re-fetch from an API or use global state
  useEffect(() => {
    setEmployees(mockEmployees);
  }, []);


  const handleStatusChange = (employeeId: string, newStatus: 'Active' | 'Inactive') => {
    setEmployees(prevEmployees =>
      prevEmployees.map(emp =>
        emp.id === employeeId ? { ...emp, status: newStatus } : emp
      )
    );
    // Here you would typically make an API call to update the status
    // Example: PUT /api/employees/{employeeId}/status with body { status: newStatus }
    console.log(`Employee ${employeeId} status changed to ${newStatus}`);
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Répertoire des Employés</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Rechercher des employés..."
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px] bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button asChild variant="default">
            <Link href="/employees/add">
              <UserPlus className="mr-2 h-4 w-4" /> Ajouter un Employé
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow key={employee.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={employee.avatarUrl || `https://placehold.co/40x40.png?text=${employee.name.substring(0,2)}`} alt={employee.name} data-ai-hint="person portrait" />
                        <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{employee.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{employee.email}</TableCell>
                  <TableCell>{employee.department}</TableCell>
                  <TableCell>{employee.jobTitle}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={employee.status === 'Active' ? 'default' : 'outline'}>
                      {employee.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Select
                      value={employee.status}
                      onValueChange={(value: 'Active' | 'Inactive') => handleStatusChange(employee.id, value)}
                    >
                      <SelectTrigger className="w-[120px] h-8 text-xs">
                        <SelectValue placeholder="Changer statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">Actif</SelectItem>
                        <SelectItem value="Inactive">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {filteredEmployees.length === 0 && (
            <p className="text-center text-muted-foreground py-8">Aucun employé trouvé.</p>
        )}
      </CardContent>
    </Card>
  );
}
