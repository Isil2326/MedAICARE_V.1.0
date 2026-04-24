import React from 'react';
import { Brain } from 'lucide-react';
import { Card, CardHeader, Badge, Button } from './ui/primitives';

interface SuggestionProps {
  rec: any; // ClinicalSuggestion
  isClinic: boolean;
  onAction?: (id: string, newStatus: 'ACCEPTED' | 'MODIFIED' | 'REJECTED') => void;
}

export function ClinicalRecommendationCard({ rec, isClinic, onAction }: SuggestionProps) {
  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <Badge variant="warning">🟡 En attente</Badge>;
      case 'ACCEPTED': return <Badge variant="success">✅ Appliquée</Badge>;
      case 'MODIFIED': return <Badge variant="info">🟣 Modifiée</Badge>;
      case 'REJECTED': return <Badge variant="danger">❌ Rejetée</Badge>;
      default: return null;
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader 
        icon={Brain} 
        title={rec.title} 
        action={getStatusBadge(rec.status)} 
      />
      <div className="p-4 pt-0">
        {!isClinic && rec.message_patient && (
          <div className="bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mb-3">
            <p className="text-sm text-blue-200">{rec.message_patient}</p>
          </div>
        )}
        <div className="flex justify-between items-center text-sm mb-4">
          <span className="text-slate-400">Action recommandée :</span>
          <span className="font-medium text-slate-200">{rec.action}</span>
        </div>
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-400">Niveau de preuve (ADA) :</span>
          <Badge variant="info">Classe {rec.evidence}</Badge>
        </div>

        {isClinic && rec.status === 'PENDING' && onAction && (
          <div className="mt-4 flex gap-2 pt-4 border-t border-white/5">
            <Button variant="primary" className="flex-1" onClick={() => onAction(rec.id, 'ACCEPTED')}>✓ Accepter</Button>
            <Button variant="secondary" className="flex-1" onClick={() => onAction(rec.id, 'MODIFIED')}>📝 Modifier</Button>
            <Button variant="danger" className="flex-1 bg-red-500/10 text-red-400" onClick={() => onAction(rec.id, 'REJECTED')}>✗ Rejeter</Button>
          </div>
        )}
      </div>
    </Card>
  );
}
