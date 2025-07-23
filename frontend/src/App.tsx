// frontend/src/App.tsx
import React, { useEffect } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AllFlatsPage from './pages/AllFlatsPage';
import CreateFlatPage from './pages/CreateFlatPage';

import { useAuth } from './context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Utility component from shadcn/ui docs for list items in NavigationMenuContent
const ListItem = React.forwardRef<
  React.ComponentRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        {href ? (
          <Link
            to={href}
            ref={ref as any}
            // FIX HERE: Use cn utility
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className // Pass the prop className here
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </Link>
        ) : (
          <a
            ref={ref}
            // FIX HERE: Use cn utility
            className={cn(
              "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
              className // Pass the prop className here
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
              {children}
            </p>
          </a>
        )}
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"


// Component for the Navigation Bar
const NavBar: React.FC = () => {
  const { isAuthenticated, user, logout, isLoading } = useAuth(); // <--- ENSURE isLoading IS DESTRUCTURED HERE

  return (
    <nav className="bg-card text-card-foreground shadow-sm p-4 border-b border-border">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-primary">
          Flat Manager
        </Link>

        {/* Main Navigation Menu */}
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/">
                  Home
                </Link>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                <Link to="/flats">
                  Browse Flats
                </Link>
                </NavigationMenuLink>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger>About</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  <li className="row-span-3">
                    <NavigationMenuLink asChild>
                      <a
                        className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                        href="/"
                      >
                        <div className="mb-2 mt-4 text-lg font-medium">
                          Flat Manager App
                        </div>
                        <p className="text-sm leading-tight text-muted-foreground">
                          A platform for seamless flat management.
                        </p>
                      </a>
                    </NavigationMenuLink>
                  </li>
                  <ListItem href="/about" title="About Us">
                    Learn more about our mission and team.
                  </ListItem>
                  <ListItem href="/contact" title="Contact Us">
                    Get in touch with our support.
                  </ListItem>
                  <ListItem href="/services" title="Our Services">
                    Explore the features we offer.
                  </ListItem>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        {/* Right-aligned buttons and user info */}
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* User Info Popover Trigger */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="text-muted-foreground text-sm cursor-pointer" disabled={isLoading}> {/* ENSURE disabled={isLoading} IS HERE */}
                    Welcome, {user?.firstName} ({user?.userType})!
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4">
                  <div className="grid gap-2 text-foreground">
                    <div className="text-lg font-semibold">User Info</div>
                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-1 text-sm">
                      <span className="text-muted-foreground">Name:</span>
                      <span>{user?.firstName} {user?.lastName}</span>
                      <span className="text-muted-foreground">Email:</span>
                      <span>{user?.email}</span>
                      <span className="text-muted-foreground">Type:</span>
                      <span>{user?.userType}</span>
                      {user?.phone && (
                        <>
                          <span className="text-muted-foreground">Phone:</span>
                          <span>{user?.phone}</span>
                        </>
                      )}
                      {user?.nid && (
                        <>
                          <span className="text-muted-foreground">NID:</span>
                          <span>{user?.nid}</span>
                        </>
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Dashboard button */}
              <Button asChild variant="default">
                <Link to="/dashboard">Dashboard</Link>
              </Button>

              <Button onClick={logout} variant="destructive">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Register</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// PrivateRoute component (no changes from previous step)
const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth(); // <--- ENSURE isLoading IS DESTRUCTURED HERE
  const navigate = useNavigate();

  console.log('PrivateRoute: Checking isAuthenticated:', isAuthenticated, 'Loading:', isLoading);

  useEffect(() => {
    if (!isAuthenticated && !isLoading) { // <--- ENSURE CONDITION USES !isLoading
      console.log('PrivateRoute: Not authenticated and done loading, redirecting to /login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) { // <--- ENSURE isLoading CHECK IS HERE
    return (
      <div className="flex justify-center items-center h-full text-foreground">
        Loading authentication...
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : null;
};


function App() {
    console.log('App: Rendering App component');
  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      <NavBar />

      <main className="flex-grow container mx-auto p-4 flex items-center justify-center">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/flats" element={<AllFlatsPage />} />
          <Route path="/flats/create" element={
            <PrivateRoute>
              <CreateFlatPage />
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <DashboardPage />
            </PrivateRoute>
          } />
          {/* Add placeholder routes for new menu items */}
          <Route path="/about" element={<h2 className="text-3xl font-bold text-foreground">About Us Page</h2>} />
          <Route path="/contact" element={<h2 className="text-3xl font-bold text-foreground">Contact Us Page</h2>} />
          <Route path="/services" element={<h2 className="text-3xl font-bold text-foreground">Our Services Page</h2>} />
        </Routes>
      </main>

      <footer className="bg-card text-card-foreground p-4 text-center border-t border-border">
        <p>&copy; {new Date().getFullYear()} Flat Manager. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
