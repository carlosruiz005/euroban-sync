import { Badge } from '@/components/ui/badge';
import { DocumentStatus } from '@/lib/supabase';
import { CheckCircle2, Clock, AlertCircle, XCircle, FileEdit } from 'lucide-react';

interface StatusBadgeProps {
  status: DocumentStatus;
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const getStatusConfig = (status: DocumentStatus) => {
    switch (status) {
      case 'approved':
        return {
          label: 'Aprobado',
          className: 'bg-success/10 text-success hover:bg-success/20 border-success/20',
          icon: CheckCircle2,
        };
      case 'pending_review':
        return {
          label: 'Pendiente Revisión',
          className: 'bg-warning/10 text-warning hover:bg-warning/20 border-warning/20',
          icon: Clock,
        };
      case 'changes_requested':
        return {
          label: 'Cambios Solicitados',
          className: 'bg-accent/10 text-accent hover:bg-accent/20 border-accent/20',
          icon: AlertCircle,
        };
      case 'rejected':
        return {
          label: 'Rechazado',
          className: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20',
          icon: XCircle,
        };
      default: // draft
        return {
          label: 'Borrador',
          className: 'bg-muted text-muted-foreground hover:bg-muted/80',
          icon: FileEdit,
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <Badge variant="outline" className={`${config.className} transition-smooth`}>
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
    </Badge>
  );
};