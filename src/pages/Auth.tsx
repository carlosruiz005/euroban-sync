import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { authHelpers } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Building2 } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().trim().email({ message: 'Correo electrónico inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

const Auth = () => {
  const navigate = useNavigate();
  const { user, roles, hasRole } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });

  useEffect(() => {
    if (user && roles.length > 0) {
      // Redirect executives to approvals page
      if (hasRole('executive')) {
        navigate('/approvals', { replace: true });
      }
      // Redirect clients to upload page
      else if (hasRole('client')) {
        navigate('/upload', { replace: true });
      }
      // Redirect internal team to internal docs page
      else if (hasRole('internal_team')) {
        navigate('/internal-docs', { replace: true });
      }
      // Redirect other roles to dashboard
      else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, roles, hasRole, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      loginSchema.parse(loginForm);
      setLoading(true);
      
      const { error } = await authHelpers.signIn(loginForm.email, loginForm.password);
      
      if (error) throw error;
      
      toast.success('Inicio de sesión exitoso');
      // Redirect will be handled by useEffect based on user role
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else if (error.message === 'Invalid login credentials') {
        toast.error('Credenciales inválidas');
      } else {
        toast.error('Error al iniciar sesión: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary flex items-center justify-center">
            <Building2 className="w-8 h-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl">EurobanSync</CardTitle>
            <CardDescription>
              Sistema de control de archivos financieros
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="nombre@ejemplo.com"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
        
        <CardFooter className="text-center text-sm text-muted-foreground">
          <p className="w-full">
            Sistema seguro para la gestión de información financiera
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Auth;