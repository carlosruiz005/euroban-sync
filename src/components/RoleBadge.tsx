import { Badge } from '@/components/ui/badge';
import { AppRole } from '@/lib/supabase';
import { Shield, Users, Briefcase, Building2, Landmark } from 'lucide-react';

interface RoleBadgeProps {
  role: AppRole;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  const getRoleConfig = (role: AppRole) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrador',
          className: 'bg-primary text-primary-foreground',
          icon: Shield,
        };
      case 'internal_team':
        return {
          label: 'Equipo Interno',
          className: 'bg-accent text-accent-foreground',
          icon: Users,
        };
      case 'executive':
        return {
          label: 'Ejecutivo',
          className: 'bg-secondary text-secondary-foreground',
          icon: Briefcase,
        };
      case 'client':
        return {
          label: 'Cliente',
          className: 'bg-muted text-foreground',
          icon: Building2,
        };
      case 'bank':
        return {
          label: 'Banco',
          className: 'bg-primary/20 text-primary',
          icon: Landmark,
        };
    }
  };

  const config = getRoleConfig(role);
  const Icon = config.icon;

  return (
    <Badge className={`${config.className} transition-smooth`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};