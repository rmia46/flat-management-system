// frontend/src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';


import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // IMPORT SHADCN SELECT COMPONENTS

const RegisterPage: React.FC = () => {
  const { registerUser } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [nid, setNid] = useState('');
  const [userType, setUserType] = useState('tenant');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = await registerUser({ firstName, lastName, email, password, phone, nid, userType });
  };

  return (
    <Card className="p-8 shadow-lg border border-border w-full max-w-md text-card-foreground">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-3xl font-bold text-foreground mb-2">Register</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label htmlFor="firstName" className="block text-muted-foreground text-sm font-medium mb-2">
              First Name:
            </label>
            <Input
              type="text"
              id="firstName"
              name="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="lastName" className="block text-muted-foreground text-sm font-medium mb-2">
              Last Name:
            </label>
            <Input
              type="text"
              id="lastName"
              name="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-muted-foreground text-sm font-medium mb-2">
              Email:
            </label>
            <Input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-muted-foreground text-sm font-medium mb-2">
              Password:
            </label>
            <Input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="phone" className="block text-muted-foreground text-sm font-medium mb-2">
              Phone:
            </label>
            <Input
              type="tel" // Use type="tel" for phone numbers
              id="phone"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 01XXXXXXXXX"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="nid" className="block text-muted-foreground text-sm font-medium mb-2">
              NID:
            </label>
            <Input
              type="text"
              id="nid"
              name="nid"
              value={nid}
              onChange={(e) => setNid(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <label htmlFor="userType" className="block text-muted-foreground text-sm font-medium mb-2">
              Register as:
            </label>
            <Select value={userType} onValueChange={setUserType}> 
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select user type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant">Tenant</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Button type="submit" className="transition-colors duration-200 transform hover:scale-[1.02]">
              Register
            </Button>
            <Link to="/login" className="inline-block align-baseline text-sm font-medium text-foreground hover:text-primary transition-colors duration-200">
              Already have an account? Login!
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default RegisterPage;
